const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory database
const db = {
  users: [],
  courses: [],
  refreshTokens: [],
  verificationCodes: [] // { email, code, expiresAt }
};

// Seed admin user (password: admin123)
const adminPassword = bcrypt.hashSync('admin123', 10);
db.users.push({
  id: uuidv4(),
  email: 'admin@example.com',
  password: adminPassword,
  role: 'admin',
  emailVerified: true,
  createdAt: new Date().toISOString()
});

// Seed courses for EduHub
db.courses.push(
  {
    id: uuidv4(),
    title: 'JavaScript Full Course',
    description: 'JavaScript asoslaridan boshlab, DOM, ES6+, async/await va zamonaviy frameworklargacha.',
    price: 49.99,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'React.js — Zamonaviy UI',
    description: 'React hooks, state management, routing va real loyihalar bilan amaliy tajriba.',
    price: 59.99,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'Node.js Backend Development',
    description: 'Express.js, REST API, autentifikatsiya, database integratsiya va deployment.',
    price: 69.99,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'Python dasturlash asoslari',
    description: 'Python sintaksisi, OOP, fayllar bilan ishlash va kichik loyihalar yaratish.',
    price: 39.99,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'SQL va Ma\'lumotlar Bazasi',
    description: 'SQL so\'rovlar, PostgreSQL, normalizatsiya va real loyihalarda qo\'llash.',
    price: 34.99,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'Git & GitHub Masterclass',
    description: 'Version control, branching, merge, pull request va jamoaviy ishlash.',
    price: 19.99,
    createdAt: new Date().toISOString()
  }
);

module.exports = db;
