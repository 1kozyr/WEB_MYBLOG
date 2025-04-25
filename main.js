let db;
const DB_NAME = 'blogDB';
const DB_VERSION = 1;
const STORE_NAME = 'posts';

const openRequest = indexedDB.open(DB_NAME, DB_VERSION);

openRequest.onerror = function(event) {
  console.error('Database error:', event.target.error);
  showToast('Ошибка загрузки базы данных', 'error');
};

openRequest.onupgradeneeded = function(event) {
  db = event.target.result;
  
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    store.createIndex('title', 'title', { unique: false });
  }
};

openRequest.onsuccess = function(event) {
  db = event.target.result;
  renderPosts();
};

function addPost(title, content, image) {
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  const newPost = { 
    title, 
    content, 
    image,
    createdAt: new Date().toISOString()
  };
  
  const request = store.add(newPost);

  request.onsuccess = function() {
    renderPosts();
    document.getElementById('postForm').reset();
    showToast('Пост успешно добавлен!');
  };

  request.onerror = function(event) {
    console.error('Add error:', event.target.error);
    showToast('Ошибка при добавлении поста', 'error');
  };
}

function getPosts(callback) {
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  request.onsuccess = function(event) {
    callback(event.target.result);
  };

  request.onerror = function(event) {
    console.error('Get error:', event.target.error);
    showToast('Ошибка загрузки постов', 'error');
  };
}

function renderPosts() {
  const postsContainer = document.getElementById('posts');
  postsContainer.innerHTML = '';
  
  getPosts(function(posts) {
    if (posts.length === 0) {
      postsContainer.innerHTML = '<p class="no-posts">Пока нет постов. Добавьте первый!</p>';
      return;
    }
    
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    posts.forEach(post => {
      const postEl = document.createElement('article');
      postEl.className = 'post';
      postEl.innerHTML = `
        ${post.image ? `<img src="${post.image}" alt="Изображение поста" />` : ''}
        <h2>${post.title}</h2>
        <p>${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
        <button onclick="viewPost(${post.id})">Читать дальше</button>
      `;
      postsContainer.appendChild(postEl);
    });
  });
}

function viewPost(postId) {
  localStorage.setItem('currentPostId', postId);
  window.location.href = 'post.html';
}

function convertImageToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = function() {
    callback(reader.result);
  };
  reader.onerror = function(error) {
    console.error('File error:', error);
    showToast('Ошибка загрузки изображения', 'error');
  };
  reader.readAsDataURL(file);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

document.getElementById('postForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageFile = document.getElementById('imageFile').files[0];
  
  if (!title || !content || !imageFile) {
    showToast('Заполните все поля!', 'error');
    return;
  }
  
  convertImageToBase64(imageFile, function(image) {
    addPost(title, content, image);
  });
});

window.viewPost = viewPost;