/* ===== CHAT APP - VANILLA JS ===== */

// ===== CONSTANTS =====
const SECRET_PASSWORD = 'danaz01';
const STORAGE_KEYS = {
  USERS: 'chatapp_users',
  MESSAGES: 'chatapp_messages',
  SETTINGS: 'chatapp_settings',
  CURRENT_USER: 'chatapp_current_user',
  FRIENDS: 'chatapp_friends'
};

// ===== STATE =====
let currentUser = null;
let currentChatUser = null;
let generatedVerifyCode = null;
let typingTimeout = null;
let onlineStatusInterval = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadTheme();
  loadCurrentUser();
  setupEventListeners();
  setupPasswordValidation();
  setupUsernameValidation();

  if (currentUser) {
    showMainApp();
  } else {
    showAuthContainer();
    showPage('login-page');
  }
}

// ===== DATA MANAGEMENT =====
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getMessages() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
}

function getFriends() {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS) || '{}');
  return all[currentUser?.username] || [];
}

function saveFriends(friends) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS) || '{}');
  all[currentUser.username] = friends;
  localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(all));
}

function getSettings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
}

function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

// ===== THEME =====
function loadTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.checked = theme === 'dark';
}

function toggleTheme() {
  const settings = getSettings();
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  settings.theme = newTheme;
  saveSettings(settings);
  showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
}

// ===== NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
  clearAuthErrors();
}

function showAuthContainer() {
  document.getElementById('auth-container').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  updateSidebarUser();
  showSection('home');
  startOnlineStatusSimulation();
}

function showSection(sectionId) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`${sectionId}-section`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${sectionId}"]`).classList.add('active');

  if (sectionId === 'home') renderUsersList();
  if (sectionId === 'friends') renderFriends();
  if (sectionId === 'settings') renderSettings();

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  toast.innerHTML = `${icons[type]}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ===== LOADING =====
function showLoading() {
  document.getElementById('loading-screen').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-screen').classList.add('hidden');
}

function setButtonLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  if (loading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
    btn.disabled = true;
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
    btn.disabled = false;
  }
}

// ===== AUTH: SIGN UP =====
function setupUsernameValidation() {
  const input = document.getElementById('signup-username');
  const errorEl = document.getElementById('signup-username-error');
  const successEl = document.getElementById('signup-username-success');

  input.addEventListener('input', () => {
    const username = input.value.trim();
    if (username.length < 3) {
      errorEl.textContent = 'Username must be at least 3 characters';
      successEl.classList.add('hidden');
      input.classList.add('error');
      input.classList.remove('success');
      return;
    }

    const users = getUsers();
    const taken = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (taken) {
      errorEl.textContent = 'Username already taken';
      successEl.classList.add('hidden');
      input.classList.add('error');
      input.classList.remove('success');
    } else {
      errorEl.textContent = '';
      successEl.classList.remove('hidden');
      input.classList.remove('error');
      input.classList.add('success');
    }
  });
}

function setupPasswordValidation() {
  const input = document.getElementById('signup-password');
  const bar = document.getElementById('strength-bar');

  input.addEventListener('input', () => {
    const val = input.value;
    updatePasswordRules(val);

    const hasLength = val.length >= 8 && val.length <= 16;
    const hasUpper = /[A-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[$&@£¥]/.test(val);

    const score = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    bar.className = 'strength-bar';
    if (score <= 1 && val.length > 0) bar.classList.add('weak');
    else if (score === 2 || score === 3) bar.classList.add('medium');
    else if (score === 4) bar.classList.add('strong');
  });
}

function updatePasswordRules(password) {
  document.getElementById('rule-length').classList.toggle('valid', password.length >= 8 && password.length <= 16);
  document.getElementById('rule-upper').classList.toggle('valid', /[A-Z]/.test(password));
  document.getElementById('rule-number').classList.toggle('valid', /[0-9]/.test(password));
  document.getElementById('rule-special').classList.toggle('valid', /[$&@£¥]/.test(password));
}

// Send verification code
function sendVerificationCode() {
  const emailInput = document.getElementById('signup-email');
  const email = emailInput.value.trim();
  const errorEl = document.getElementById('signup-email-error');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorEl.textContent = 'Please enter a valid email address';
    emailInput.classList.add('error');
    return;
  }

  errorEl.textContent = '';
  emailInput.classList.remove('error');

  // Generate code
  generatedVerifyCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Show code group
  document.getElementById('verify-code-group').classList.remove('hidden');
  document.getElementById('verify-code-hint').textContent = `Code sent! (Simulated: ${generatedVerifyCode})`;

  showToast('Verification code sent! Check the hint below.', 'success');
}

// Sign Up Form
function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Signup form
  document.getElementById('signup-form').addEventListener('submit', handleSignup);

  // Send code button
  document.getElementById('send-code-btn').addEventListener('click', sendVerificationCode);

  // Password toggle buttons
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
      } else {
        input.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
      }
    });
  });
}

function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();

  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type="submit"]');

  if (!identifier) {
    showFieldError('login-identifier', 'Please enter your email or username');
    return;
  }

  if (!password) {
    showFieldError('login-password', 'Please enter your password');
    return;
  }

  setButtonLoading(btn, true);

  setTimeout(() => {
    const users = getUsers();
    const user = users.find(u =>
      u.username.toLowerCase() === identifier.toLowerCase() ||
      u.email.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      setButtonLoading(btn, false);
      showFieldError('login-identifier', 'User not found');
      showToast('User not found', 'error');
      return;
    }

    if (user.password !== password) {
      setButtonLoading(btn, false);
      showFieldError('login-password', 'Incorrect password');
      showToast('Incorrect password', 'error');
      return;
    }

    currentUser = user;
    saveCurrentUser(user);
    setButtonLoading(btn, false);
    showToast('Welcome back!', 'success');
    showMainApp();
  }, 800);
}

function handleSignup(e) {
  e.preventDefault();
  clearAuthErrors();

  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const verifyCode = document.getElementById('signup-verify-code').value.trim();
  const password = document.getElementById('signup-password').value;
  const secret = document.getElementById('signup-secret').value;
  const btn = e.target.querySelector('button[type="submit"]');

  let hasError = false;

  // Username validation
  if (username.length < 3) {
    showFieldError('signup-username', 'Username must be at least 3 characters');
    hasError = true;
  } else {
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      showFieldError('signup-username', 'Username already taken');
      hasError = true;
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError('signup-email', 'Please enter a valid email');
    hasError = true;
  }

  // Verification code
  if (!generatedVerifyCode) {
    showFieldError('signup-verify-code', 'Please request a verification code');
    hasError = true;
  } else if (verifyCode !== generatedVerifyCode) {
    showFieldError('signup-verify-code', 'Incorrect verification code');
    hasError = true;
  }

  // Password validation
  const hasLength = password.length >= 8 && password.length <= 16;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[$&@£¥]/.test(password);

  if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
    showFieldError('signup-password', 'Password does not meet requirements');
    hasError = true;
  }

  // Secret password
  if (secret !== SECRET_PASSWORD) {
    showFieldError('signup-secret', 'Incorrect secret password');
    hasError = true;
  }

  if (hasError) {
    showToast('Please fix the errors above', 'error');
    return;
  }

  setButtonLoading(btn, true);

  setTimeout(() => {
    // Create user
    const newUser = {
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    const users = getUsers();
    users.push(newUser);
    saveUsers(users);

    // Create demo messages
    createDemoMessages(username);

    currentUser = newUser;
    saveCurrentUser(newUser);
    generatedVerifyCode = null;

    setButtonLoading(btn, false);
    showToast('Account created successfully!', 'success');
    showMainApp();
  }, 1000);
}

function createDemoMessages(username) {
  const demoUsers = ['Alice', 'Bob', 'Charlie', 'Diana'];
  const allMessages = getMessages();

  demoUsers.forEach(demo => {
    const key = [username, demo].sort().join('|');
    allMessages[key] = [
      {
        sender: demo,
        text: `Hey ${username}! Welcome to ChatApp!`,
        timestamp: Date.now() - 3600000
      },
      {
        sender: demo,
        text: 'How are you doing today?',
        timestamp: Date.now() - 3000000
      }
    ];
  });

  saveMessages(allMessages);
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (input) input.classList.add('error');
  if (errorEl) errorEl.textContent = message;
}

function clearAuthErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(input => input.classList.remove('error'));
  document.querySelectorAll('.success-message').forEach(el => el.classList.add('hidden'));
}

function loadCurrentUser() {
  currentUser = getCurrentUser();
}

function logout() {
  currentUser = null;
  saveCurrentUser(null);
  currentChatUser = null;
  clearInterval(onlineStatusInterval);
  showAuthContainer();
  showPage('login-page');
  showToast('Logged out successfully', 'info');
}

// ===== SIDEBAR =====
function updateSidebarUser() {
  if (!currentUser) return;
  document.getElementById('sidebar-username').textContent = currentUser.username;
  document.getElementById('sidebar-avatar-text').textContent = currentUser.username.charAt(0).toUpperCase();
}

// ===== HOME / CHAT =====
function renderUsersList() {
  const users = getUsers().filter(u => u.username !== currentUser.username);
  const container = document.getElementById('users-list');
  const searchTerm = document.getElementById('home-search')?.value.toLowerCase() || '';

  const filtered = users.filter(u => u.username.toLowerCase().includes(searchTerm));

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No users found</p>';
    return;
  }

  filtered.forEach(user => {
    const div = document.createElement('div');
    div.className = `user-item ${currentChatUser?.username === user.username ? 'active' : ''}`;
    div.onclick = () => openChat(user);

    const isOnline = Math.random() > 0.3;
    const lastMsg = getLastMessage(user.username);

    div.innerHTML = `
      <div class="user-avatar">
        <span>${user.username.charAt(0).toUpperCase()}</span>
        <div class="status-indicator ${isOnline ? 'online' : ''}"></div>
      </div>
      <div class="user-item-info">
        <h4>${user.username}</h4>
        <p>${lastMsg || (isOnline ? 'Online' : 'Offline')}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

function filterUsers(query) {
  renderUsersList();
}

function getLastMessage(username) {
  const messages = getMessagesForChat(username);
  if (messages.length === 0) return null;
  const last = messages[messages.length - 1];
  return last.text.length > 25 ? last.text.substring(0, 25) + '...' : last.text;
}

function openChat(user) {
  currentChatUser = user;
  document.getElementById('chat-placeholder').classList.add('hidden');
  document.getElementById('chat-active').classList.remove('hidden');

  document.getElementById('chat-username').textContent = user.username;
  document.getElementById('chat-avatar-text').textContent = user.username.charAt(0).toUpperCase();

  const isOnline = Math.random() > 0.3;
  const statusEl = document.getElementById('chat-user-status');
  statusEl.className = `status-indicator ${isOnline ? 'online' : ''}`;

  renderChatMessages();
  renderUsersList(); // Update active state

  // Scroll to bottom
  setTimeout(() => {
    const msgContainer = document.getElementById('chat-messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }, 50);
}

function getMessagesForChat(username) {
  const allMessages = getMessages();
  const key = [currentUser.username, username].sort().join('|');
  return allMessages[key] || [];
}

function renderChatMessages() {
  if (!currentChatUser) return;

  const container = document.getElementById('chat-messages');
  const messages = getMessagesForChat(currentChatUser.username);

  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No messages yet. Say hello!</p>';
    return;
  }

  messages.forEach(msg => {
    const isSent = msg.sender === currentUser.username;
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;

    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
      <div class="message-bubble">${escapeHtml(msg.text)}</div>
      <span class="message-time">${time}</span>
    `;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !currentChatUser) return;

  const allMessages = getMessages();
  const key = [currentUser.username, currentChatUser.username].sort().join('|');
  if (!allMessages[key]) allMessages[key] = [];

  allMessages[key].push({
    sender: currentUser.username,
    text,
    timestamp: Date.now()
  });

  saveMessages(allMessages);
  input.value = '';
  renderChatMessages();
  renderUsersList(); // Update last message preview

  // Simulate typing indicator and response
  simulateTypingAndResponse();
}

function handleChatKeypress(e) {
  if (e.key === 'Enter') sendMessage();
}

function simulateTypingAndResponse() {
  if (!currentChatUser) return;

  const indicator = document.getElementById('typing-indicator');
  indicator.classList.remove('hidden');

  if (typingTimeout) clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    indicator.classList.add('hidden');

    const responses = [
      'That sounds great!',
      'I agree with you.',
      'Interesting point!',
      'Can you tell me more?',
      'Thanks for sharing!',
      'Nice! 😊',
      'I see what you mean.',
      'Absolutely!'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    const allMessages = getMessages();
    const key = [currentUser.username, currentChatUser.username].sort().join('|');
    if (!allMessages[key]) allMessages[key] = [];

    allMessages[key].push({
      sender: currentChatUser.username,
      text: response,
      timestamp: Date.now()
    });

    saveMessages(allMessages);
    renderChatMessages();
    renderUsersList();
  }, 2000 + Math.random() * 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== FRIENDS =====
function renderFriends() {
  const allUsers = getUsers().filter(u => u.username !== currentUser.username);
  const friends = getFriends();

  const allContainer = document.getElementById('all-users-list');
  const friendsContainer = document.getElementById('friends-list');

  // Render all users
  allContainer.innerHTML = '';
  if (allUsers.length === 0) {
    allContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No other users</p>';
  } else {
    allUsers.forEach(user => {
      const isFriend = friends.includes(user.username);
      const div = document.createElement('div');
      div.className = 'friend-item';
      div.innerHTML = `
        <div class="user-avatar">
          <span>${user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div class="friend-item-info">
          <h4>${user.username}</h4>
          <p>${user.email}</p>
        </div>
        ${isFriend
          ? `<button class="added-btn" disabled>Added</button>`
          : `<button class="add-friend-btn" onclick="addFriend('${user.username}')">Add Friend</button>`
        }
      `;
      allContainer.appendChild(div);
    });
  }

  // Render friends list
  friendsContainer.innerHTML = '';
  document.getElementById('friend-count').textContent = `(${friends.length})`;

  if (friends.length === 0) {
    friendsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No friends yet</p>';
  } else {
    friends.forEach(friendName => {
      const user = allUsers.find(u => u.username === friendName);
      if (!user) return;
      const div = document.createElement('div');
      div.className = 'friend-item';
      div.innerHTML = `
        <div class="user-avatar">
          <span>${user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div class="friend-item-info">
          <h4>${user.username}</h4>
          <p>${user.email}</p>
        </div>
        <button class="add-friend-btn" style="background:var(--error);" onclick="removeFriend('${user.username}')">Remove</button>
      `;
      friendsContainer.appendChild(div);
    });
  }

  // Update badge
  const badge = document.getElementById('friends-badge');
  if (friends.length > 0) {
    badge.textContent = friends.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function addFriend(username) {
  const friends = getFriends();
  if (!friends.includes(username)) {
    friends.push(username);
    saveFriends(friends);
    showToast(`Added ${username} as a friend!`, 'success');
    renderFriends();
  }
}

function removeFriend(username) {
  let friends = getFriends();
  friends = friends.filter(f => f !== username);
  saveFriends(friends);
  showToast(`Removed ${username} from friends`, 'info');
  renderFriends();
}

// ===== SETTINGS =====
function renderSettings() {
  if (!currentUser) return;
  document.getElementById('settings-username').textContent = currentUser.username;
  document.getElementById('settings-email').textContent = currentUser.email;
  document.getElementById('settings-joined').textContent = new Date(currentUser.createdAt).toLocaleDateString();
}

function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This will remove all users, messages, and settings.')) {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    currentUser = null;
    currentChatUser = null;
    showToast('All data cleared', 'warning');
    showAuthContainer();
    showPage('login-page');
  }
}

// ===== ONLINE STATUS SIMULATION =====
function startOnlineStatusSimulation() {
  if (onlineStatusInterval) clearInterval(onlineStatusInterval);
  onlineStatusInterval = setInterval(() => {
    // Randomly update online statuses in the UI
    document.querySelectorAll('.status-indicator').forEach(el => {
      if (Math.random() > 0.7) {
        el.classList.toggle('online');
      }
    });

    // Update status text
    const sidebarStatus = document.getElementById('sidebar-status');
    if (Math.random() > 0.8) {
      sidebarStatus.classList.toggle('online');
      const text = document.querySelector('.user-status-text');
      text.textContent = sidebarStatus.classList.contains('online') ? 'Online' : 'Away';
      text.style.color = sidebarStatus.classList.contains('online') ? 'var(--success)' : 'var(--warning)';
    }
  }, 5000);
}
