const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { generateCode, sendVerificationEmail } = require('../services/email');

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
// Registers user, sends 6-digit verification code to email
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kiritilishi shart' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    // Check if user exists
    const existing = db.users.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // Generate 6-digit code and send via email
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove any existing codes for this email
    db.verificationCodes = db.verificationCodes.filter(vc => vc.email !== email);

    // Store new code
    db.verificationCodes.push({ email, code, expiresAt });

    // Send email with code
    let emailResult = null;
    try {
      emailResult = await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.error('Email yuborishda xato:', emailErr.message);
    }

    res.status(201).json({
      message: emailResult?.isReal 
        ? `Ro'yxatdan o'tdingiz! ${email} pochtangizga 6 xonali kod yuborildi.` 
        : `Ro'yxatdan o'tdingiz! 6 xonali tasdiqlash kodi yuborildi.`,
      requiresVerification: true,
      code: code,
      isReal: emailResult?.isReal || false,
      user: { id: newUser.id, email: newUser.email, role: newUser.role, emailVerified: false },
      emailPreviewUrl: emailResult?.previewUrl || null
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// ── POST /auth/verify — Email verification with 6-digit code ─
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email va tasdiqlash kodi kiritilishi shart' });
    }

    // Find the stored code
    const stored = db.verificationCodes.find(
      vc => vc.email === email && vc.code === code
    );

    if (!stored) {
      return res.status(400).json({ error: 'Noto\'g\'ri tasdiqlash kodi' });
    }

    // Check expiration
    if (new Date() > new Date(stored.expiresAt)) {
      // Remove expired code
      db.verificationCodes = db.verificationCodes.filter(vc => vc.email !== email);
      return res.status(400).json({ error: 'Tasdiqlash kodining muddati tugagan. Yangi kod so\'rang.' });
    }

    // Mark user as verified
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    user.emailVerified = true;

    // Remove used code
    db.verificationCodes = db.verificationCodes.filter(vc => vc.email !== email);

    res.json({
      message: 'Email muvaffaqiyatli tasdiqlandi! ✅',
      user: { id: user.id, email: user.email, role: user.role, emailVerified: true }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Ichki server xatosi' });
  }
});

// ── POST /auth/resend-code — Resend verification code ────────
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email kiritilishi shart' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email allaqachon tasdiqlangan' });
    }

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove old code
    db.verificationCodes = db.verificationCodes.filter(vc => vc.email !== email);
    db.verificationCodes.push({ email, code, expiresAt });

    // Send email
    let emailResult = null;
    try {
      emailResult = await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.error('Email yuborishda xato:', emailErr.message);
    }

    res.json({
      message: emailResult?.isReal 
        ? `Yangi tasdiqlash kodi ${email} pochtangizga yuborildi!`
        : 'Yangi tasdiqlash kodi yuborildi!',
      code: code,
      isReal: emailResult?.isReal || false,
      emailPreviewUrl: emailResult?.previewUrl || null
    });
  } catch (err) {
    console.error('Resend error:', err);
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

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email tasdiqlanmagan. Iltimos, emailingizga yuborilgan kodni kiriting.',
        requiresVerification: true,
        email: user.email
      });
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
