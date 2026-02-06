require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'BiloGames API 🎮', status: 'running' });
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstname, lastname, username, birthDate } = req.body;
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validation nom/prénom (lettres uniquement)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
      return res.status(400).json({ error: 'First name and last name must contain only letters' });
    }
    
    // Validation mot de passe (8 chars, maj, min, special)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase and special character' });
    }
    
    // Vérifier si email existe
    const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Vérifier si username existe
    const usernameExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer utilisateur
    const result = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, username, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, firstname, lastname, username, birth_date`,
      [email, hashedPassword, firstname, lastname, username, birthDate]
    );
    
    const user = result.rows[0];
    
    // Générer token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username
      },
      token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver utilisateur
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Vérifier mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Générer token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET USER (protected)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, firstname, lastname, username, birth_date FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🎮 BiloGames API
  ────────────────
  🚀 Running on http://localhost:${PORT}
  `);
});
