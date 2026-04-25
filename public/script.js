const socket = io();

let currentUser = null;
let currentChatUser = null;

// =========================
// PAGE NAVIGATION (AUTH)
// =========================
function showPage(pageId) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

// =========================
// FORM EVENTS
// =========================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("signup-form").addEventListener("submit", handleSignup);
});

// =========================
// LOGIN
// =========================
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

  if (!data.success) return alert("Login failed");

  currentUser = data.user;
  socket.emit("join", currentUser.username);

  showMainApp();
  loadUsers();
  loadProfileUI();
}

// =========================
// SIGNUP
// =========================
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

  if (!data.success) return alert("Signup failed");

  currentUser = data.user;
  socket.emit("join", currentUser.username);

  showMainApp();
  loadUsers();
  loadProfileUI();
}

// =========================
// SHOW MAIN APP
// =========================
function showMainApp() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
}

// =========================
// LOAD USERS
// =========================
async function loadUsers() {
  const res = await fetch('/users');
  const users = await res.json();

  const list = document.getElementById('users-list');
  list.innerHTML = "";

  users.forEach(u => {
    if (u.username === currentUser.username) return;

    const div = document.createElement("div");
    div.className = "user-item";
    div.innerHTML = `👤 ${u.username}`;
    div.onclick = () => openChat(u);

    list.appendChild(div);
  });
}

// =========================
// OPEN CHAT
// =========================
async function openChat(user) {
  currentChatUser = user;

  document.getElementById("chat-placeholder").classList.add("hidden");
  document.getElementById("chat-active").classList.remove("hidden");

  document.getElementById("chat-username").innerText = user.username;

  const res = await fetch(`/messages/${currentUser.username}/${user.username}`);
  const messages = await res.json();

  renderMessages(messages);
}

// =========================
// RENDER MESSAGES
// =========================
function renderMessages(messages) {
  const container = document.getElementById("chat-messages");
  container.innerHTML = "";

  messages.forEach(addMessage);
}

function addMessage(msg) {
  const container = document.getElementById("chat-messages");

  const div = document.createElement("div");
  div.className = "message";

  if (msg.file) {
    div.innerHTML = `📎 <a href="${msg.file}" target="_blank">File</a>`;
  } else {
    div.innerText = msg.text;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// =========================
// SEND MESSAGE
// =========================
function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value;

  if (!text || !currentChatUser) return;

  socket.emit("send_message", {
    from: currentUser.username,
    to: currentChatUser.username,
    text
  });

  input.value = "";
}

// Enter key send
function handleChatKeypress(e) {
  if (e.key === "Enter") sendMessage();
}

// =========================
// SOCKET RECEIVE
// =========================
socket.on("receive_message", (msg) => {
  addMessage(msg);
});

// =========================
// UI NAVIGATION (SIDEBAR)
// =========================
function showSection(section) {
  document.querySelectorAll(".app-section").forEach(s => s.classList.add("hidden"));
  document.getElementById(section + "-section").classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  event.target.closest(".nav-item").classList.add("active");
}

// =========================
// SIDEBAR MOBILE
// =========================
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("sidebar-overlay").classList.toggle("active");
}

// =========================
// PROFILE UI
// =========================
function loadProfileUI() {
  if (!currentUser) return;

  document.getElementById("sidebar-username").innerText = currentUser.username;
  document.getElementById("sidebar-avatar-text").innerText = currentUser.username[0].toUpperCase();

  document.getElementById("settings-username").innerText = currentUser.username;
  document.getElementById("settings-email").innerText = currentUser.email;
  document.getElementById("settings-joined").innerText = new Date(currentUser.createdAt).toLocaleDateString();
}

// =========================
// LOGOUT
// =========================
function logout() {
  location.reload();
}

// =========================
// THEME TOGGLE (optional local)
// =========================
function toggleTheme() {
  document.body.classList.toggle("light");
}
