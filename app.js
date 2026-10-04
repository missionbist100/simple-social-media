// ==================== DATA LAYER (localStorage) ====================
const DB = {
  get(key) {
    return JSON.parse(localStorage.getItem(key) || 'null');
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getUsers() {
    return this.get('users') || [];
  },
  getPosts() {
    return this.get('posts') || [];
  },
  getCurrentUser() {
    return this.get('currentUser');
  },
  setCurrentUser(user) {
    this.set('currentUser', user);
  },
  saveUsers(users) {
    this.set('users', users);
  },
  savePosts(posts) {
    this.set('posts', posts);
  }
};

// ==================== UTILITIES ====================
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

// ==================== AUTH ====================
function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      }
    });
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = DB.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      DB.setCurrentUser(user);
      showApp();
      showToast('Welcome back, ' + user.fullname + '!');
    } else {
      showToast('Invalid username or password');
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const fullname = document.getElementById('reg-fullname').value.trim();

    const users = DB.getUsers();
    if (users.find(u => u.username === username)) {
      showToast('Username already taken');
      return;
    }

    const newUser = {
      id: generateId(),
      username,
      email,
      password,
      fullname,
      bio: '',
      avatar: '',
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    DB.saveUsers(users);
    DB.setCurrentUser(newUser);
    showApp();
    showToast('Account created successfully!');
  });
}

// ==================== APP NAVIGATION ====================
function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderFeed();
  updateProfilePage();
}

function showAuth() {
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  DB.setCurrentUser(null);
}

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const pages = {
    feed: document.getElementById('feed-page'),
    explore: document.getElementById('explore-page'),
    create: document.getElementById('create-page'),
    profile: document.getElementById('profile-page')
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(pages).forEach(p => p.classList.add('hidden'));
      pages[btn.dataset.page].classList.remove('hidden');

      if (btn.dataset.page === 'feed') renderFeed();
      if (btn.dataset.page === 'explore') renderUsers();
      if (btn.dataset.page === 'profile') updateProfilePage();
    });
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    showAuth();
    showToast('Logged out');
  });
}

// ==================== THEME ====================
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  toggle.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    toggle.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

// ==================== POSTS ====================
function createPost(content, imageUrl) {
  const user = DB.getCurrentUser();
  if (!user) return;

  const posts = DB.getPosts();
  const post = {
    id: generateId(),
    userId: user.id,
    username: user.username,
    fullname: user.fullname,
    avatar: user.avatar,
    content: content.trim(),
    image: imageUrl.trim() || null,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);
  DB.savePosts(posts);
  return post;
}

function renderFeed() {
  const container = document.getElementById('feed-container');
  const posts = DB.getPosts();
  const currentUser = DB.getCurrentUser();

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-newspaper"></i>
        <p>No posts yet. Be the first to share something!</p>
      </div>`;
    return;
  }

  container.innerHTML = posts.map(post => {
    const isLiked = post.likes.includes(currentUser.id);
    const commentsHtml = post.comments.map(c => `
      <div class="comment">
        <div class="comment-avatar">${getInitials(c.fullname)}</div>
        <div class="comment-body">
          <strong>${c.fullname}</strong> ${c.text}
        </div>
      </div>
    `).join('');

    return `
      <div class="post-card" data-id="${post.id}">
        <div class="post-header">
          <div class="avatar">
            \( {post.avatar ? `<img src=" \){post.avatar}" alt="">` : getInitials(post.fullname)}
          </div>
          <div class="post-user-info">
            <h4>${post.fullname}</h4>
            <span>@${post.username} · ${timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        \( {post.image ? `<img class="post-image" src=" \){post.image}" alt="Post image" onerror="this.style.display='none'">` : ''}
        <div class="post-actions">
          <button class="action-btn \( {isLiked ? 'liked' : ''}" onclick="toggleLike(' \){post.id}')">
            <i class="fas fa-heart"></i> <span>${post.likes.length}</span>
          </button>
          <button class="action-btn" onclick="toggleComments('${post.id}')">
            <i class="fas fa-comment"></i> <span>${post.comments.length}</span>
          </button>
        </div>
        <div class="comments-section hidden" id="comments-${post.id}">
          ${commentsHtml}
          <div class="comment-input-row">
            <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}" 
                   onkeypress="if(event.key==='Enter') addComment('${post.id}')">
            <button onclick="addComment('${post.id}')">Post</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleLike(postId) {
  const posts = DB.getPosts();
  const post = posts.find(p => p.id === postId);
  const user = DB.getCurrentUser();
  if (!post || !user) return;

  const idx = post.likes.indexOf(user.id);
  if (idx === -1) {
    post.likes.push(user.id);
  } else {
    post.likes.splice(idx, 1);
  }
  DB.savePosts(posts);
  renderFeed();
}

function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  section.classList.toggle('hidden');
}

function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const posts = DB.getPosts();
  const post = posts.find(p => p.id === postId);
  const user = DB.getCurrentUser();
  if (!post || !user) return;

  post.comments.push({
    id: generateId(),
    userId: user.id,
    fullname: user.fullname,
    text,
    createdAt: new Date().toISOString()
  });

  DB.savePosts(posts);
  input.value = '';
  renderFeed();
  setTimeout(() => {
    const section = document.getElementById(`comments-${postId}`);
    if (section) section.classList.remove('hidden');
  }, 50);
}

// ==================== CREATE POST ====================
function initCreate() {
  document.getElementById('submit-post').addEventListener('click', () => {
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').value;

    if (!content.trim()) {
      showToast('Please write something');
      return;
    }

    createPost(content, image);
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    showToast('Post published!');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-page="feed"]').classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('feed-page').classList.remove('hidden');
    renderFeed();
  });
}

// ==================== PROFILE ====================
function updateProfilePage() {
  const user = DB.getCurrentUser();
  if (!user) return;

  const avatarEl = document.getElementById('profile-avatar');
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="">`;
  } else {
    avatarEl.textContent = getInitials(user.fullname);
  }

  document.getElementById('profile-name').textContent = user.fullname;
  document.getElementById('profile-username').textContent = '@' + user.username;
  document.getElementById('profile-bio').textContent = user.bio || 'No bio yet';

  const posts = DB.getPosts().filter(p => p.userId === user.id);
  document.getElementById('posts-count').textContent = posts.length;
  document.getElementById('followers-count').textContent = user.followers.length;
  document.getElementById('following-count').textContent = user.following.length;

  const container = document.getElementById('profile-posts');
  if (posts.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-camera"></i><p>No posts yet</p></div>`;
  } else {
    const allPosts = DB.getPosts();
    DB.savePosts(posts);
    renderFeed();
    container.innerHTML = document.getElementById('feed-container').innerHTML;
    DB.savePosts(allPosts);
    document.getElementById('feed-container').innerHTML = '';
  }
}

function initProfileEdit() {
  const modal = document.getElementById('edit-modal');
  document.getElementById('edit-profile-btn').addEventListener('click', () => {
    const user = DB.getCurrentUser();
    document.getElementById('edit-fullname').value = user.fullname;
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-avatar').value = user.avatar || '';
    modal.classList.remove('hidden');
  });

  document.getElementById('cancel-edit').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('save-profile').addEventListener('click', () => {
    const user = DB.getCurrentUser();
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === user.id);

    user.fullname = document.getElementById('edit-fullname').value.trim() || user.fullname;
    user.bio = document.getElementById('edit-bio').value.trim();
    user.avatar = document.getElementById('edit-avatar').value.trim();

    users[idx] = user;
    DB.saveUsers(users);
    DB.setCurrentUser(user);

    const posts = DB.getPosts();
    posts.forEach(p => {
      if (p.userId === user.id) {
        p.fullname = user.fullname;
        p.avatar = user.avatar;
      }
    });
    DB.savePosts(posts);

    modal.classList.add('hidden');
    updateProfilePage();
    showToast('Profile updated!');
  });
}

// ==================== EXPLORE / FOLLOW ====================
function renderUsers() {
  const container = document.getElementById('users-list');
  const users = DB.getUsers();
  const current = DB.getCurrentUser();

  const others = users.filter(u => u.id !== current.id);

  if (others.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No other users yet. Share this app with friends!</p>
      </div>`;
    return;
  }

  container.innerHTML = others.map(user => {
    const isFollowing = current.following.includes(user.id);
    return `
      <div class="user-card">
        <div class="avatar">
          \( {user.avatar ? `<img src=" \){user.avatar}" alt="">` : getInitials(user.fullname)}
        </div>
        <div class="info">
          <h4>${user.fullname}</h4>
          <span>@${user.username}</span>
        </div>
        <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                onclick="toggleFollow('${user.id}')">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    `;
  }).join('');
}

function toggleFollow(userId) {
  const current = DB.getCurrentUser();
  const users = DB.getUsers();
  const target = users.find(u => u.id === userId);
  const currentIdx = users.findIndex(u => u.id === current.id);

  if (!target) return;

  const followingIdx = current.following.indexOf(userId);
  if (followingIdx === -1) {
    current.following.push(userId);
    target.followers.push(current.id);
  } else {
    current.following.splice(followingIdx, 1);
    const fIdx = target.followers.indexOf(current.id);
    if (fIdx !== -1) target.followers.splice(fIdx, 1);
  }

  users[currentIdx] = current;
  const targetIdx = users.findIndex(u => u.id === userId);
  users[targetIdx] = target;

  DB.saveUsers(users);
  DB.setCurrentUser(current);
  renderUsers();
  showToast(followingIdx === -1 ? 'Followed!' : 'Unfollowed');
}

// ==================== INIT ====================
function init() {
  if (DB.getUsers().length === 0) {
    const demoUser = {
      id: 'demo1',
      username: 'demo',
      email: 'demo@socialhub.com',
      password: 'demo123',
      fullname: 'Demo User',
      bio: 'Welcome to SocialHub! This is a demo account.',
      avatar: '',
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    };
    DB.saveUsers([demoUser]);

    DB.savePosts([{
      id: 'post1',
      userId: 'demo1',
      username: 'demo',
      fullname: 'Demo User',
      avatar: '',
      content: 'Welcome to SocialHub! 🎉\n\nThis is a simple social media platform built with pure HTML, CSS & JavaScript.\n\nYou can:\n• Create posts\n• Like & comment\n• Follow users\n• Edit your profile\n\nData is stored in your browser (localStorage). Perfect starting point to upgrade later with Firebase or a real backend!',
      image: null,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    }]);
  }

  initAuth();
  initNavigation();
  initTheme();
  initCreate();
  initProfileEdit();

  if (DB.getCurrentUser()) {
    showApp();
  }
}

window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.toggleFollow = toggleFollow;

document.addEventListener('DOMContentLoaded', init);
