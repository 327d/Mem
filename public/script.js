const socket = io();

let currentUser = null;
let currentChatUser = null;

// ===== AUTH =====
async function handleLogin(e) {
  e.preventDefault();

  const identifier = document.getElementById('login-identifier').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const data = await res.json();

  if (!data.success) return alert('Login failed');

  currentUser = data.user;
  socket.emit('join', currentUser.username);

  showMainApp();
  loadUsers();
}

// ===== SIGNUP =====
async function handleSignup(e) {
  e.preventDefault();

  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!data.success) return alert('Signup failed');

  currentUser = data.user;
  socket.emit('join', currentUser.username);

  showMainApp();
  loadUsers();
}

// ===== LOAD USERS =====
async function loadUsers() {
  const res = await fetch('/users');
  const users = await res.json();

  const list = document.getElementById('users-list');
  list.innerHTML = '';

  users.forEach(u => {
    if (u.username === currentUser.username) return;

    const div = document.createElement('div');
    div.className = 'user-item';
    div.innerText = u.username;
    div.onclick = () => openChat(u);

    list.appendChild(div);
  });
}

// ===== OPEN CHAT =====
async function openChat(user) {
  currentChatUser = user;

  document.getElementById('chat-username').textContent = user.username;

  const res = await fetch(`/messages/${currentUser.username}/${user.username}`);
  const messages = await res.json();

  renderMessages(messages);
}

// ===== RENDER =====
function renderMessages(messages) {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';

  messages.forEach(addMessageToUI);
}

function addMessageToUI(msg) {
  const container = document.getElementById('chat-messages');

  const div = document.createElement('div');
  div.className = 'message';

  if (msg.file) {
    div.innerHTML = `<a href="${msg.file}" target="_blank">📎 File</a>`;
  } else {
    div.innerText = msg.text;
  }

  container.appendChild(div);
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value;

  if (!text) return;

  socket.emit('send_message', {
    from: currentUser.username,
    to: currentChatUser.username,
    text
  });

  input.value = '';
}

// ===== RECEIVE =====
socket.on('receive_message', (msg) => {
  addMessageToUI(msg);
});

// ===== FILE SEND =====
async function sendFile(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/upload', {
    method: 'POST',
    body: form
  });

  const data = await res.json();

  socket.emit('send_message', {
    from: currentUser.username,
    to: currentChatUser.username,
    file: data.url
  });
}

// ===== PROFILE PIC =====
async function uploadAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  form.append('username', currentUser.username);

  const res = await fetch('/upload-avatar', {
    method: 'POST',
    body: form
  });

  const data = await res.json();

  document.getElementById('sidebar-avatar').style.backgroundImage =
    `url(${data.url})`;
}

// ===== UI =====
function showMainApp() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
}
