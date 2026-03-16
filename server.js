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

// BUG: No CORS headers (will cause issues if accessed cross-origin)

// API Routes
app.get('/api/tasks', (req, res) => {
  // BUG: No pagination — returns everything
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
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

app.put('/api/tasks/:id', (req, res) => {
  // BUG: parseInt without radix, no NaN check
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    // BUG: Returns 200 with error message instead of 404
    return res.json({ error: 'Task not found' });
  }

  Object.assign(task, req.body);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  // BUG: No check if task exists before deleting
  tasks = tasks.filter(t => t.id !== id);
  // BUG: Returns 200 with no body (should confirm deletion)
  res.end();
});

// BUG: No 404 handler for unknown API routes
// BUG: No global error handler

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
  // BUG: Hardcoded credentials, no hashing
  if (email === 'admin@test.com' && password === 'password123') {
    res.json({ success: true, token: 'fake-jwt-token-12345', user: { name: 'Admin', email } });
  } else {
    // BUG: Leaks whether email exists
    if (email === 'admin@test.com') {
      res.status(401).json({ error: 'Invalid password' });
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  }
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  // BUG: No validation at all — accepts empty fields
  // BUG: No duplicate email check
  // BUG: Password stored in plain text (conceptually)
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
