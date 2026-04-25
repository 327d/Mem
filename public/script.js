const socket = io();

let currentUser = null;
let currentChatUser = null;

/* =====================
   PAGE SWITCH
===================== */
function showPage(pageId) {
    document.querySelectorAll('.auth-page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

/* =====================
   INIT EVENTS
===================== */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
});

/* =====================
   LOGIN
===================== */
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

    if (!data.success) {
        alert('Login failed');
        return;
    }

    currentUser = data.user;
    socket.emit('join', currentUser.username);

    showMainApp();
    loadUsers();
}

/* =====================
   SIGNUP
===================== */
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

    if (!data.success) {
        alert('Signup failed (username may exist)');
        return;
    }

    currentUser = data.user;
    socket.emit('join', currentUser.username);

    showMainApp();
    loadUsers();
}

/* =====================
   MAIN APP UI
===================== */
function showMainApp() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

/* =====================
   LOAD USERS
===================== */
async function loadUsers() {
    const res = await fetch('/users');
    const users = await res.json();

    const list = document.getElementById('users-list');
    list.innerHTML = '';

    users.forEach(u => {
        if (u.username === currentUser.username) return;

        const div = document.createElement('div');
        div.textContent = u.username;
        div.style.cursor = "pointer";

        div.onclick = () => openChat(u);

        list.appendChild(div);
    });
}

/* =====================
   CHAT OPEN
===================== */
async function openChat(user) {
    currentChatUser = user;

    const res = await fetch(`/messages/${currentUser.username}/${user.username}`);
    const messages = await res.json();

    renderMessages(messages);
}

/* =====================
   MESSAGES
===================== */
function renderMessages(messages) {
    const box = document.getElementById('chat-messages');
    box.innerHTML = '';

    messages.forEach(msg => {
        const div = document.createElement('div');

        div.textContent = msg.text || "File message";
        box.appendChild(div);
    });
}

/* =====================
   SEND MESSAGE
===================== */
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value;

    if (!text || !currentChatUser) return;

    socket.emit('send_message', {
        from: currentUser.username,
        to: currentChatUser.username,
        text
    });

    input.value = '';
}

/* =====================
   RECEIVE MESSAGE
===================== */
socket.on('receive_message', (msg) => {
    const box = document.getElementById('chat-messages');

    const div = document.createElement('div');
    div.textContent = msg.text;

    box.appendChild(div);
});

/* =====================
   LOGOUT
===================== */
function logout() {
    location.reload();
}
