require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter (configure with your SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email helper
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"BiloGames" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

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

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'BiloGames API 🎮', status: 'running' });
});

// ============================================
// REGISTER (email/password) - email_verified = false
// ============================================
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
    
    // Créer utilisateur avec email_verified = false
    const result = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, username, birth_date, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) 
       RETURNING id, email, firstname, lastname, username, birth_date, email_verified, created_at`,
      [email, hashedPassword, firstname, lastname, username, birthDate]
    );
    
    const user = result.rows[0];
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// LOGIN (email/password)
// ============================================
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
    
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GOOGLE AUTH - Vérifier le token et retourner les données
// Ne crée PAS de compte, renvoie juste les infos pour le formulaire
// ============================================
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }
    
    let googleId, email, given_name, family_name;
    
    // Essayer de vérifier comme ID token d'abord
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      given_name = payload.given_name;
      family_name = payload.family_name;
    } catch (idTokenError) {
      // Si ce n'est pas un ID token, c'est un access token - appeler l'API Google
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`);
        if (!response.ok) {
          throw new Error('Invalid access token');
        }
        const userInfo = await response.json();
        googleId = userInfo.sub;
        email = userInfo.email;
        given_name = userInfo.given_name;
        family_name = userInfo.family_name;
      } catch (accessTokenError) {
        return res.status(401).json({ error: 'Invalid Google token' });
      }
    }
    
    // Chercher si l'utilisateur existe déjà avec ce google_id OU cet email
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );
    
    if (result.rows.length > 0) {
      // Utilisateur existe déjà - connexion directe
      const user = result.rows[0];
      
      // Si l'utilisateur existait par email mais pas de google_id, on lie le compte
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, email_verified = true WHERE id = $2',
          [googleId, user.id]
        );
      }
      
      const token = generateToken(user);
      
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          emailVerified: true,
          createdAt: user.created_at
        },
        token,
        isExistingUser: true
      });
    }
    
    // Nouvel utilisateur - renvoyer les données Google pour préremplir le formulaire
    // PAS de création de compte ici
    res.json({
      message: 'Please complete registration',
      googleData: {
        googleId,
        email,
        firstname: given_name || '',
        lastname: family_name || ''
      },
      isExistingUser: false
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// ============================================
// GOOGLE REGISTER - Créer le compte après complétion du formulaire
// email_verified = true car c'est Google
// ============================================
app.post('/api/auth/google/register', async (req, res) => {
  try {
    const { googleId, email, firstname, lastname, username, password, birthDate } = req.body;
    
    // Validations
    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google data missing' });
    }
    
    // Validation nom/prénom (lettres uniquement)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
      return res.status(400).json({ error: 'First name and last name must contain only letters' });
    }
    
    // Validation username
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    // Validation mot de passe (8 chars, maj, min, special)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase and special character' });
    }
    
    // Validation date de naissance
    if (!birthDate) {
      return res.status(400).json({ error: 'Birth date is required' });
    }
    
    // Vérifier si email existe déjà
    const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    
    // Vérifier si username existe déjà
    const usernameExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Vérifier si google_id existe déjà
    const googleIdExists = await pool.query('SELECT id FROM users WHERE google_id = $1', [googleId]);
    if (googleIdExists.rows.length > 0) {
      return res.status(400).json({ error: 'This Google account is already linked to another user' });
    }
    
    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer le compte avec email_verified = true (car Google)
    const result = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, username, birth_date, google_id, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) 
       RETURNING id, email, firstname, lastname, username, birth_date, google_id, email_verified, created_at`,
      [email, hashedPassword, firstname, lastname, username, birthDate, googleId]
    );
    
    const user = result.rows[0];
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Google register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GET USER (protected)
// ============================================
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, firstname, lastname, username, birth_date, email_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        birthDate: user.birth_date,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// UPDATE USER (protected)
// ============================================
app.put('/api/auth/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, email, firstname, lastname, username, newPassword, birthDate } = req.body;
    
    // Récupérer l'utilisateur actuel
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = userResult.rows[0];
    
    // Vérifier le mot de passe actuel
    const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Préparer les champs à mettre à jour
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;
    let emailChanged = false;
    
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      // Vérifier si l'email existe déjà
      const emailExists = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
      // Si l'email change, il devient non vérifié
      updateFields.push(`email_verified = false`);
      emailChanged = true;
    }
    
    if (firstname) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
      if (!nameRegex.test(firstname)) {
        return res.status(400).json({ error: 'First name must contain only letters' });
      }
      updateFields.push(`firstname = $${paramCount}`);
      updateValues.push(firstname);
      paramCount++;
    }
    
    if (lastname) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
      if (!nameRegex.test(lastname)) {
        return res.status(400).json({ error: 'Last name must contain only letters' });
      }
      updateFields.push(`lastname = $${paramCount}`);
      updateValues.push(lastname);
      paramCount++;
    }
    
    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      // Vérifier si le username existe déjà
      const usernameExists = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (usernameExists.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateFields.push(`username = $${paramCount}`);
      updateValues.push(username);
      paramCount++;
    }
    
    if (newPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase and special character' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateFields.push(`password = $${paramCount}`);
      updateValues.push(hashedPassword);
      paramCount++;
    }
    
    if (birthDate) {
      updateFields.push(`birth_date = $${paramCount}`);
      updateValues.push(birthDate);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Ajouter updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Exécuter la mise à jour
    updateValues.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, email, firstname, lastname, username, birth_date, email_verified, created_at`,
      updateValues
    );
    
    const user = result.rows[0];
    
    // Générer un nouveau token si le username ou l'email a changé
    const token = generateToken(user);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        birthDate: user.birth_date,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DELETE USER (protected)
// ============================================
app.delete('/api/auth/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// SEND EMAIL VERIFICATION CODE (protected)
// ============================================
app.post('/api/auth/send-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Supprimer les anciens codes
    await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [userId]);
    
    // Générer un nouveau code (expire dans 15 minutes)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO email_verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [userId, code, expiresAt]
    );
    
    // Envoyer l'email
    const emailSent = await sendEmail(
      user.email,
      'Verify your BiloGames account',
      `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366F1;">🎮 BiloGames</h2>
        <p>Hello ${user.firstname},</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366F1;">${code}</span>
        </div>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
      `
    );
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
    
    res.json({ message: 'Verification code sent to your email' });
    
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// VERIFY EMAIL CODE (protected)
// ============================================
app.post('/api/auth/verify-email', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Invalid code format' });
    }
    
    // Vérifier le code
    const codeResult = await pool.query(
      'SELECT * FROM email_verification_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()',
      [userId, code]
    );
    
    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    // Marquer l'email comme vérifié
    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
    
    // Supprimer le code utilisé
    await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [userId]);
    
    // Récupérer l'utilisateur mis à jour
    const userResult = await pool.query(
      'SELECT id, email, firstname, lastname, username, birth_date, email_verified, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    const token = generateToken(user);
    
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        birthDate: user.birth_date,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// REQUEST PASSWORD RESET (public)
// ============================================
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Vérifier si l'utilisateur existe
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Pour des raisons de sécurité, on renvoie toujours le même message
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If this email exists, a reset code has been sent' });
    }
    
    const user = userResult.rows[0];
    
    // Supprimer les anciens codes
    await pool.query('DELETE FROM password_reset_codes WHERE email = $1', [email]);
    
    // Générer un nouveau code (expire dans 15 minutes)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );
    
    // Envoyer l'email
    await sendEmail(
      email,
      'Reset your BiloGames password',
      `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366F1;">🎮 BiloGames</h2>
        <p>Hello ${user.firstname},</p>
        <p>You requested to reset your password. Your code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366F1;">${code}</span>
        </div>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
      `
    );
    
    res.json({ message: 'If this email exists, a reset code has been sent' });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// VERIFY RESET CODE (public)
// ============================================
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code || code.length !== 6) {
      return res.status(400).json({ error: 'Email and valid code are required' });
    }
    
    // Vérifier le code
    const codeResult = await pool.query(
      'SELECT * FROM password_reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false',
      [email, code]
    );
    
    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    res.json({ message: 'Code verified', valid: true });
    
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// RESET PASSWORD (public)
// ============================================
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validation mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase and special character' });
    }
    
    // Vérifier le code
    const codeResult = await pool.query(
      'SELECT * FROM password_reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false',
      [email, code]
    );
    
    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour le mot de passe
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    // Marquer le code comme utilisé
    await pool.query('UPDATE password_reset_codes SET used = true WHERE email = $1 AND code = $2', [email, code]);
    
    res.json({ message: 'Password reset successfully' });
    
  } catch (error) {
    console.error('Reset password error:', error);
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
