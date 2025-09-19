// Глобальні змінні
let allPosts = [];
let currentFilter = 'all';

// Знаходимо елементи
const fetchPostsBtn = document.getElementById('fetchPostsBtn');
const addPostBtn = document.getElementById('addPostBtn');
const postsContainer = document.getElementById('posts-container');
const addPostResult = document.getElementById('addPostResult');
const searchInput = document.querySelector('.search-bar input');
const searchBtn = document.querySelector('.search-bar button');
const categoryFilters = document.querySelectorAll('.category-filter');

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
  fetchAllPosts();
  updateCategoryCounts();
  setupEventListeners();
});

// Налаштування обробників подій
function setupEventListeners() {
  if (fetchPostsBtn) fetchPostsBtn.addEventListener('click', fetchAllPosts);
  if (addPostBtn) addPostBtn.addEventListener('click', addNewPost);
  
  // Пошук
  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
  
  // Фільтрація по категоріям
  categoryFilters.forEach(filter => {
    filter.addEventListener('click', (e) => {
      e.preventDefault();
      const category = e.target.dataset.category;
      filterPostsByCategory(category);
    });
  });
  
  // Обробка форми додавання поста
  const addPostForm = document.getElementById('addPostForm');
  if (addPostForm) {
    addPostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addNewPost();
    });
  }
}

// Асинхронна функція для отримання та відображення постів
const fetchAllPosts = async () => {
  console.log("Fetching posts...");
  try {
    const response = await fetch('http://localhost:3000/posts');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    allPosts = await response.json();
    displayPosts(allPosts);
    updateCategoryCounts();
    
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    postsContainer.innerHTML = `<p class="error">Помилка: Не вдалося отримати пости. Перевірте, чи запущено сервер.</p>`;
  }
};

// Відображення постів
function displayPosts(posts) {
  postsContainer.innerHTML = '';
  
  if (posts.length === 0) {
    postsContainer.innerHTML = '<p>Немає постів для відображення.</p>';
    return;
  }
  
  posts.forEach(post => {
    const postElement = createPostElement(post);
    postsContainer.appendChild(postElement);
  });
}

// Створення елементу поста
function createPostElement(post) {
  const postElement = document.createElement('div');
  postElement.className = 'post-card';
  postElement.dataset.id = post.id;
  postElement.dataset.category = post.category || 'uncategorized';
  
  postElement.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <img src="https://via.placeholder.com/40" alt="${post.author}">
        <span>${post.author}</span>
      </div>
      <div class="post-category">${getCategoryName(post.category)}</div>
    </div>
    <h3>${post.title}</h3>
    <p class="post-content">${post.content}</p>
    <div class="post-footer">
      <div class="post-date">${post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Невідомо'}</div>
      <div class="post-actions">
        <button class="btn-edit" data-id="${post.id}"><i class="fas fa-edit"></i> Редагувати</button>
        <button class="btn-delete" data-id="${post.id}"><i class="fas fa-trash"></i> Видалити</button>
        <button class="btn-like"><i class="far fa-heart"></i> <span>${post.likes || 0}</span></button>
      </div>
    </div>
  `;
  
  // Додаємо обробники подій для кнопок
  const editBtn = postElement.querySelector('.btn-edit');
  const deleteBtn = postElement.querySelector('.btn-delete');
  const likeBtn = postElement.querySelector('.btn-like');
  
  if (editBtn) editBtn.addEventListener('click', () => editPost(post.id));
  if (deleteBtn) deleteBtn.addEventListener('click', () => deletePost(post.id));
  if (likeBtn) likeBtn.addEventListener('click', () => likePost(post.id, likeBtn));
  
  return postElement;
}

// Отримання назви категорії
function getCategoryName(category) {
  const categories = {
    'travel': 'Подорожі',
    'cooking': 'Кулінарія',
    'tech': 'Технології',
    'books': 'Книги',
    'personal': 'Особисте',
    'uncategorized': 'Без категорії'
  };
  
  return categories[category] || category;
}

// Оновлення лічильників категорій
function updateCategoryCounts() {
  const categories = {
    'all': allPosts.length,
    'travel': allPosts.filter(post => post.category === 'travel').length,
    'cooking': allPosts.filter(post => post.category === 'cooking').length,
    'tech': allPosts.filter(post => post.category === 'tech').length,
    'books': allPosts.filter(post => post.category === 'books').length,
    'personal': allPosts.filter(post => post.category === 'personal').length
  };
  
  // Оновлюємо лічильники в UI
  for (const [category, count] of Object.entries(categories)) {
    const countElement = document.getElementById(`${category}-count`);
    if (countElement) {
      countElement.textContent = `(${count})`;
    }
  }
}

// Фільтрація постів за категорією
function filterPostsByCategory(category) {
  currentFilter = category;
  
  // Оновлюємо активний клас у фільтрах
  categoryFilters.forEach(filter => {
    if (filter.dataset.category === category) {
      filter.classList.add('active');
    } else {
      filter.classList.remove('active');
    }
  });
  
  if (category === 'all') {
    displayPosts(allPosts);
  } else {
    const filteredPosts = allPosts.filter(post => post.category === category);
    displayPosts(filteredPosts);
  }
}

// Обробка пошуку
function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    filterPostsByCategory(currentFilter);
    return;
  }
  
  const filteredPosts = allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm) || 
    post.content.toLowerCase().includes(searchTerm) ||
    post.author.toLowerCase().includes(searchTerm)
  );
  
  displayPosts(filteredPosts);
}

// Асинхронна функція для додавання нового поста
const addNewPost = async () => {
  const title = document.getElementById('postTitle').value;
  const author = document.getElementById('postAuthor').value;
  const content = document.getElementById('postContent').value;
  const category = document.getElementById('postCategory').value;

  // Валідація
  if (!title || !author || !content || !category) {
    showNotification('Будь ласка, заповніть всі поля.', 'error');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        author: author,
        content: content,
        category: category,
        createdAt: new Date().toISOString(),
        likes: 0
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const newPost = await response.json();
    console.log("Post added successfully:", newPost);

    // Очищаємо форму
    document.getElementById('postTitle').value = '';
    document.getElementById('postAuthor').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postCategory').selectedIndex = 0;

    // Показуємо повідомлення про успіх
    showNotification('Пост успішно додано!', 'success');

    // Оновлюємо список постів
    setTimeout(fetchAllPosts, 500);

  } catch (error) {
    console.error('There was a problem adding the post:', error);
    showNotification('Помилка: Не вдалося додати пост. Перевірте, чи запущено сервер.', 'error');
  }
};

// Редагування поста
const editPost = async (postId) => {
  const post = allPosts.find(p => p.id === postId);
  
  if (!post) {
    showNotification('Пост не знайдено.', 'error');
    return;
  }
  
  // Заповнюємо форму значеннями поста
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postAuthor').value = post.author;
  document.getElementById('postContent').value = post.content;
  document.getElementById('postCategory').value = post.category || 'personal';
  
  // Прокручуємо до форми
  document.querySelector('.create-post').scrollIntoView({ behavior: 'smooth' });
  
  // Змінюємо функціонал кнопки на оновлення
  const submitBtn = document.getElementById('addPostBtn');
  submitBtn.textContent = 'Оновити пост';
  submitBtn.onclick = () => updatePost(postId);
};

// Оновлення поста
const updatePost = async (postId) => {
  const title = document.getElementById('postTitle').value;
  const author = document.getElementById('postAuthor').value;
  const content = document.getElementById('postContent').value;
  const category = document.getElementById('postCategory').value;

  // Валідація
  if (!title || !author || !content || !category) {
    showNotification('Будь ласка, заповніть всі поля.', 'error');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        author: author,
        content: content,
        category: category,
        createdAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Очищаємо форму
    document.getElementById('postTitle').value = '';
    document.getElementById('postAuthor').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postCategory').selectedIndex = 0;

    // Повертаємо кнопку до початкового стану
    const submitBtn = document.getElementById('addPostBtn');
    submitBtn.textContent = 'Опублікувати';
    submitBtn.onclick = addNewPost;

    // Показуємо повідомлення про успіх
    showNotification('Пост успішно оновлено!', 'success');

    // Оновлюємо список постів
    setTimeout(fetchAllPosts, 500);

  } catch (error) {
    console.error('There was a problem updating the post:', error);
    showNotification('Помилка: Не вдалося оновити пост.', 'error');
  }
};

// Видалення поста
const deletePost = async (postId) => {
  if (!confirm('Ви впевнені, що хочете видалити цей пост?')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    showNotification('Пост успішно видалено!', 'success');
    setTimeout(fetchAllPosts, 500);

  } catch (error) {
    console.error('There was a problem deleting the post:', error);
    showNotification('Помилка: Не вдалося видалити пост.', 'error');
  }
};

// Лайк поста
const likePost = async (postId, likeBtn) => {
  const post = allPosts.find(p => p.id === postId);
  
  if (!post) return;
  
  try {
    const updatedLikes = (post.likes || 0) + 1;
    
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        likes: updatedLikes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Оновлюємо UI
    likeBtn.querySelector('span').textContent = updatedLikes;
    likeBtn.querySelector('i').className = 'fas fa-heart';
    
    // Оновлюємо локальні дані
    const updatedPost = await response.json();
    const index = allPosts.findIndex(p => p.id === postId);
    if (index !== -1) {
      allPosts[index] = updatedPost;
    }

  } catch (error) {
    console.error('There was a problem liking the post:', error);
  }
};

// Функція для показу сповіщень
function showNotification(message, type) {
  // Видаляємо попередні сповіщення
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  // Створюємо нове сповіщення
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Додаємо сповіщення на сторінку
  document.body.appendChild(notification);
  
  // Показуємо сповіщення
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ховаємо сповіщення через 3 секунди
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Експортуємо функції для використання в інших файлах
window.blogApp = {
  fetchAllPosts,
  addNewPost,
  editPost,
  deletePost,
  filterPostsByCategory,
  handleSearch
};