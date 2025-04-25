let db;
const DB_NAME = 'blogDB';
const STORE_NAME = 'posts';

const openRequest = indexedDB.open(DB_NAME);

openRequest.onerror = function(event) {
  console.error('Database error:', event.target.error);
  showError('Не удалось загрузить пост. Пожалуйста, попробуйте позже.');
};

openRequest.onsuccess = function(event) {
  db = event.target.result;
  loadPost();
};

function loadPost() {
  const postId = Number(localStorage.getItem('currentPostId'));
  
  if (!postId) {
    showError('Пост не найден');
    return;
  }
  
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(postId);

  request.onsuccess = function(event) {
    const post = event.target.result;
    if (post) {
      displayPost(post);
    } else {
      showError('Пост не найден');
    }
  };

  request.onerror = function(event) {
    console.error('Load error:', event.target.error);
    showError('Ошибка загрузки поста');
  };
}

function displayPost(post) {
  const container = document.getElementById('postContent');
  
  container.innerHTML = `
    ${post.image ? `<img src="${post.image}" alt="Изображение поста" />` : ''}
    <h2>${post.title}</h2>
    <div class="post-meta">
      <small>${new Date(post.createdAt).toLocaleDateString()}</small>
    </div>
    <p>${post.content}</p>
    <div class="post-actions">
      <button onclick="showEditForm(${post.id})">Редактировать</button>
      <button onclick="deletePost(${post.id})">Удалить</button>
      <button onclick="goBack()">Назад</button>
    </div>
  `;
  
  document.getElementById('editTitle').value = post.title;
  document.getElementById('editContent').value = post.content;
}

function showError(message) {
  document.getElementById('postContent').innerHTML = `
    <div class="error">
      <p>${message}</p>
      <button onclick="goBack()">Вернуться назад</button>
    </div>
  `;
}

function showEditForm(id) {
  document.getElementById('editForm').classList.add('show');
  document.getElementById('editForm').dataset.postId = id;
}

function hideEditForm() {
  document.getElementById('editForm').classList.remove('show');
}

function updatePost(id, title, content) {
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const getRequest = store.get(id);

  getRequest.onsuccess = function(event) {
    const post = event.target.result;
    if (!post) {
      showToast('Пост не найден', 'error');
      return;
    }
    
    post.title = title;
    post.content = content;
    post.updatedAt = new Date().toISOString();
    
    const updateRequest = store.put(post);
    
    updateRequest.onsuccess = function() {
      showToast('Пост успешно обновлен!');
      loadPost();
      hideEditForm();
    };
    
    updateRequest.onerror = function(event) {
      console.error('Update error:', event.target.error);
      showToast('Ошибка при обновлении', 'error');
    };
  };
}

function deletePost(id) {
  if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;
  
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.delete(id);

  request.onsuccess = function() {
    showToast('Пост удален');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  };

  request.onerror = function(event) {
    console.error('Delete error:', event.target.error);
    showToast('Ошибка при удалении', 'error');
  };
}

function goBack() {
  window.location.href = 'index.html';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

document.getElementById('editForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const id = Number(this.dataset.postId);
  const title = document.getElementById('editTitle').value.trim();
  const content = document.getElementById('editContent').value.trim();
  
  if (!title || !content) {
    showToast('Заполните все поля!', 'error');
    return;
  }
  
  updatePost(id, title, content);
});

window.showEditForm = showEditForm;
window.hideEditForm = hideEditForm;
window.deletePost = deletePost;
window.goBack = goBack;