const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { generatePassword, sendPasswordEmail } = require('../services/email');

// ── Rate limit for /auth/login — 5 requests per minute ───────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Helper: generate tokens ──────────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
}

// ── POST /auth/register ──────────────────────────────────────
// On register: password is sent to the user's email, which they enter to log in
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;
    let password = req.body.password;

    if (!email) {
      return res.status(400).json({ error: 'Email kiritilishi shart' });
    }

    // Check if user exists
    const existing = db.users.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan. Kirish sahifasidan foydalaning.' });
    }

    // If password not provided or too short, generate 6-digit password
    if (!password || password.trim().length < 6) {
      password = generatePassword();
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      role: 'user',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // Send the password to the user's email
    let emailResult = null;
    try {
      emailResult = await sendPasswordEmail(email, password);
    } catch (emailErr) {
      console.error('Email yuborishda xato:', emailErr.message);
    }

    res.status(201).json({
      message: emailResult?.isReal 
        ? `Ro'yxatdan o'tdingiz! Kirish paroli ${email} pochtangizga yuborildi.` 
        : `Ro'yxatdan o'tdingiz! Kirish paroli emailingizga yuborildi.`,
      email,
      password,
      isReal: emailResult?.isReal || false,
      user: { id: newUser.id, email: newUser.email, role: newUser.role, emailVerified: true },
      emailPreviewUrl: emailResult?.previewUrl || null
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// ── POST /auth/resend-password ───────────────────────────────
router.post('/resend-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email kiritilishi shart' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const newPassword = generatePassword();
    user.password = await bcrypt.hash(newPassword, 10);

    let emailResult = null;
    try {
      emailResult = await sendPasswordEmail(email, newPassword);
    } catch (emailErr) {
      console.error('Email yuborishda xato:', emailErr.message);
    }

    res.json({
      message: `Yangi kirish paroli ${email} pochtangizga yuborildi!`,
      password: newPassword,
      isReal: emailResult?.isReal || false,
      emailPreviewUrl: emailResult?.previewUrl || null
    });
  } catch (err) {
    console.error('Resend password error:', err);
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// ── POST /auth/login ─────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Noto\'g\'ri email yoki parol' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Noto\'g\'ri email yoki parol' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    db.refreshTokens.push({ token: refreshToken, userId: user.id });

    // Set refresh token as httpOnly cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Tizimga muvaffaqiyatli kirdingiz!',
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified }
    });
  } catch (err) {
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// ── POST /auth/refresh ───────────────────────────────────────
router.post('/refresh', (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token topilmadi' });
  }

  const stored = db.refreshTokens.find(rt => rt.token === token);
  if (!stored) {
    return res.status(403).json({ error: 'Noto\'g\'ri refresh token' });
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      db.refreshTokens = db.refreshTokens.filter(rt => rt.token !== token);
      return res.status(403).json({ error: 'Refresh token muddati tugagan' });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  });
});

// ── POST /auth/logout ────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    db.refreshTokens = db.refreshTokens.filter(rt => rt.token !== token);
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Tizimdan chiqdingiz' });
});

module.exports = router;
