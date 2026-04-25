const API_URL = "https://your-backend-url.onrender.com"; // change after deploy

const socket = io(API_URL);

let currentUser = null;
let currentChatUser = null;

// ===== AUTH =====
async function handleLogin(e) {
  e.preventDefault();

  const identifier = document.getElementById('login-identifier').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch(API_URL + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const data = await res.json();

  if (!data.success) return alert(data.error);

  currentUser = data.user;
  localStorage.setItem("user", JSON.stringify(currentUser));

  socket.emit("join", currentUser.username);

  showMainApp();
}

// ===== USERS =====
async function loadUsers() {
  const res = await fetch(API_URL + '/users');
  const users = await res.json();

  const container = document.getElementById('users-list');
  container.innerHTML = "";

  users.forEach(u => {
    if (u.username === currentUser.username) return;

    const div = document.createElement("div");
    div.innerHTML = `<p onclick="openChat('${u.username}')">${u.username}</p>`;
    container.appendChild(div);
  });
}

// ===== OPEN CHAT =====
async function openChat(username) {
  currentChatUser = username;

  const res = await fetch(API_URL + '/data');
  const data = await res.json();

  const key = [currentUser.username, username].sort().join('|');
  const messages = data.messages[key] || [];

  const container = document.getElementById('chat-messages');
  container.innerHTML = "";

  messages.forEach(m => appendMessage(m));
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value;

  socket.emit("send_message", {
    from: currentUser.username,
    to: currentChatUser,
    text
  });

  input.value = "";
}

// ===== RECEIVE =====
socket.on("receive_message", (msg) => {
  appendMessage(msg);
});

// ===== APPEND =====
function appendMessage(msg) {
  const div = document.createElement("div");

  if (msg.image) {
    div.innerHTML = `<img src="${msg.image}" width="150">`;
  } else if (msg.file) {
    div.innerHTML = `<a href="${msg.file}" target="_blank">Download File</a>`;
  } else {
    div.textContent = msg.sender + ": " + msg.text;
  }

  document.getElementById('chat-messages').appendChild(div);
}
