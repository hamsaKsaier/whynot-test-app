const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory task store
let tasks = [
  { id: 1, title: 'Review pull requests', completed: false, priority: 'high', assignee: 'Alice' },
  { id: 2, title: 'Fix login page CSS', completed: true, priority: 'medium', assignee: 'Bob' },
  { id: 3, title: 'Write unit tests', completed: false, priority: 'low', assignee: 'Charlie' },
  { id: 4, title: 'Deploy to staging', completed: false, priority: 'high', assignee: 'Alice' },
  { id: 5, title: 'Update documentation', completed: false, priority: 'medium', assignee: '' },
];
let nextId = 6;

// In-memory user store
let users = [];

// Valid tokens store (maps token -> user info)
const validTokens = new Set();
validTokens.add('fake-jwt-token-12345');

// Auth middleware — verifies Bearer token from Authorization header
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.slice(7);
  if (!validTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  next();
}

// API Routes
app.get('/api/tasks', requireAuth, (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, priority, assignee } = req.body;

  // BUG: No server-side validation — empty titles allowed
  const task = {
    id: nextId++,
    title: title || '',
    completed: false,
    priority: priority || 'medium',
    assignee: assignee || '',
  };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  Object.assign(task, req.body);
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  tasks = tasks.filter(t => t.id !== id);
  res.status(200).json({ success: true });
});

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// BUG: Login endpoint with hardcoded credentials and no rate limiting
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Check hardcoded admin credentials
  if (email === 'admin@test.com' && password === 'password123') {
    const token = 'fake-jwt-token-12345';
    validTokens.add(token);
    return res.json({ success: true, token, user: { name: 'Admin', email } });
  }

  // Check registered users
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = 'fake-jwt-token-12345';
  validTokens.add(token);
  res.json({ success: true, token, user: { name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    validTokens.delete(token);
  }
  res.json({ success: true });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  // BUG: No validation at all — accepts empty fields
  // BUG: Password stored in plain text (conceptually)

  // Check for duplicate email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }

  // Store the new user in memory
  const newUser = { name, email, password };
  users.push(newUser);

  res.status(201).json({ success: true, message: 'Account created!', user: { name, email } });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  // BUG: No validation, no sanitization (XSS risk)
  // BUG: No actual email sending
  console.log('Contact form:', { name, email, message });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Buggy Task Manager running on http://localhost:${PORT}`);
});
