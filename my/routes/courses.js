const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const db = require('../db');

// ── GET /courses — public (all users) ────────────────────────
router.get('/', (req, res) => {
  res.json(db.courses);
});

// ── POST /courses — admin only ───────────────────────────────
router.post('/', authenticateToken, authorizeRole('admin'), (req, res) => {
  const { title, description, price } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const course = {
    id: uuidv4(),
    title,
    description: description || '',
    price: price || 0,
    createdAt: new Date().toISOString()
  };

  db.courses.push(course);
  res.status(201).json(course);
});

// ── PUT /courses/:id — admin only ────────────────────────────
router.put('/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;

  const index = db.courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (title) db.courses[index].title = title;
  if (description !== undefined) db.courses[index].description = description;
  if (price !== undefined) db.courses[index].price = price;

  res.json(db.courses[index]);
});

// ── DELETE /courses/:id — admin only ─────────────────────────
router.delete('/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  const { id } = req.params;

  const index = db.courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const deleted = db.courses.splice(index, 1);
  res.json({ message: 'Course deleted', course: deleted[0] });
});

module.exports = router;

