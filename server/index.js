const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ===== FILE UPLOAD =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname, '../public')));

// ===== DB =====
const DB_FILE = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], messages: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== API =====
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  const db = loadDB();

  if (db.users.find(u => u.username === username)) {
    return res.json({ success: false });
  }

  const user = {
    username,
    email,
    password,
    avatar: '',
    createdAt: new Date()
  };

  db.users.push(user);
  saveDB(db);

  res.json({ success: true, user });
});

app.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  const db = loadDB();

  const user = db.users.find(
    u => u.username === identifier || u.email === identifier
  );

  if (!user || user.password !== password) {
    return res.json({ success: false });
  }

  res.json({ success: true, user });
});

app.get('/users', (req, res) => {
  const db = loadDB();
  res.json(db.users);
});

app.get('/messages/:user1/:user2', (req, res) => {
  const db = loadDB();
  const { user1, user2 } = req.params;
  const key = [user1, user2].sort().join('|');

  res.json(db.messages[key] || []);
});

// ===== UPLOAD FILE =====
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ===== PROFILE PIC =====
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  const db = loadDB();
  const { username } = req.body;

  const user = db.users.find(u => u.username === username);
  if (user) {
    user.avatar = `/uploads/${req.file.filename}`;
    saveDB(db);
  }

  res.json({ url: user.avatar });
});

// ===== SOCKET =====
let onlineUsers = {};

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    onlineUsers[username] = socket.id;
    io.emit('online_users', Object.keys(onlineUsers));
  });

  socket.on('send_message', ({ from, to, text, file }) => {
    const db = loadDB();
    const key = [from, to].sort().join('|');

    if (!db.messages[key]) db.messages[key] = [];

    const msg = {
      sender: from,
      text,
      file: file || null,
      timestamp: Date.now()
    };

    db.messages[key].push(msg);
    saveDB(db);

    const receiver = onlineUsers[to];

    if (receiver) {
      io.to(receiver).emit('receive_message', msg);
    }

    socket.emit('receive_message', msg);
  });

  socket.on('disconnect', () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit('online_users', Object.keys(onlineUsers));
  });
});

// ===== START =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
