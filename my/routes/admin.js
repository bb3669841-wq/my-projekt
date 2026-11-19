const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const db = require('../db');

// ── GET /admin/dashboard — admin only (Required by Task 2) ─────
router.get('/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
  res.json({
    message: 'Welcome to Admin Dashboard',
    authenticatedAs: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    stats: {
      totalUsers: db.users.length,
      totalCourses: db.courses.length,
      totalSessions: db.refreshTokens.length,
      totalAdmins: db.users.filter(u => u.role === 'admin').length,
      totalStudents: db.users.filter(u => u.role === 'user').length
    },
    security: {
      helmet: 'Faol (Xavfsiz HTTP headerlar)',
      cors: 'Faqat http://localhost:3000 ga ruxsat',
      rateLimit: 'Login 5 ta / daqiqa, Global 100 ta / daqiqa',
      ddosProtection: 'express-slow-down faol',
      tokens: {
        accessToken: '15 min (JSON)',
        refreshToken: '7 kun (httpOnly Cookie)'
      }
    },
    users: db.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    })),
    courses: db.courses
  });
});

// ── PATCH /admin/users/:id/role — change user role ────────────
router.patch('/users/:id/role', authenticateToken, authorizeRole('admin'), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role faqat "admin" yoki "user" bo\'lishi kerak' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  user.role = role;
  res.json({ message: 'Foydalanuvchi roli yangilandi', user: { id: user.id, email: user.email, role: user.role } });
});

// ── DELETE /admin/users/:id — delete user ─────────────────────
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ error: 'O\'zingizning hisobingizni o\'chira olmaysiz' });
  }

  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  const deleted = db.users.splice(index, 1);
  // Also remove refresh tokens for this user
  db.refreshTokens = db.refreshTokens.filter(rt => rt.userId !== id);

  res.json({ message: 'Foydalanuvchi o\'chirildi', user: deleted[0] });
});

module.exports = router;
