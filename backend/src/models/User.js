import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Ma'lumotlar papkasi va faylini tekshirish/yaratish
const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

const readUsersFromFile = () => {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
};

const writeUsersToFile = (users) => {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Faylga yozishda xatolik:', err);
  }
};

// Mongoose modeli
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    refreshToken: { type: String, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

// Lokal xotira foydalanuvchi ob'ektini o'rash (wrap)
const wrapLocalUser = (rawUser) => {
  if (!rawUser) return null;

  const user = { ...rawUser };
  user._id = user._id || user.id;
  user.id = user._id;

  user.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  user.save = async function () {
    const users = readUsersFromFile();
    const idx = users.findIndex((u) => (u._id || u.id) === (this._id || this.id));
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        name: this.name,
        email: this.email,
        password: this.password,
        refreshToken: this.refreshToken,
        updatedAt: new Date().toISOString()
      };
      writeUsersToFile(users);
    }
    return this;
  };

  return user;
};

// Mongoose zanjirini (.select()) qo'llab-quvvatlovchi Thenable sinfi
class ThenableQuery {
  constructor(fn) {
    this._fn = fn;
    this._excludePassword = false;
  }
  select(fields) {
    if (fields && fields.includes('-password')) {
      this._excludePassword = true;
    }
    return this;
  }
  async then(resolve, reject) {
    try {
      const res = await this._fn(this._excludePassword);
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else throw err;
    }
  }
}

// Lokal Baza boshqaruvchi (Fallback)
const LocalUserStore = {
  async findOne(query) {
    const users = readUsersFromFile();
    let found = null;
    if (query.email) {
      found = users.find((u) => u.email.toLowerCase() === query.email.toLowerCase());
    } else if (query.refreshToken) {
      found = users.find((u) => u.refreshToken === query.refreshToken);
    }
    return wrapLocalUser(found);
  },

  findById(id) {
    return new ThenableQuery(async (excludePassword) => {
      const users = readUsersFromFile();
      const found = users.find((u) => (u._id || u.id) === id);
      if (!found) return null;

      const wrapped = wrapLocalUser(found);
      if (excludePassword) {
        delete wrapped.password;
      }
      return wrapped;
    });
  },

  async create(data) {
    const users = readUsersFromFile();
    
    // Email band emasligini tekshirish
    const exists = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      const err = new Error('Ushbu email bilan allaqachon ro\'yxatdan o\'tilgan');
      err.code = 11000;
      throw err;
    }

    // Parolni xeshlash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      refreshToken: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsersToFile(users);

    return wrapLocalUser(newUser);
  },

  async findOneAndUpdate(filter, update) {
    const users = readUsersFromFile();
    let idx = -1;

    if (filter.refreshToken) {
      idx = users.findIndex((u) => u.refreshToken === filter.refreshToken);
    } else if (filter._id) {
      idx = users.findIndex((u) => (u._id || u.id) === filter._id);
    }

    if (idx !== -1) {
      if (update.refreshToken !== undefined) {
        users[idx].refreshToken = update.refreshToken;
      }
      users[idx].updatedAt = new Date().toISOString();
      writeUsersToFile(users);
      return wrapLocalUser(users[idx]);
    }
    return null;
  }
};

// Gibrid eksport: MongoDB ulangan bo'lsa Mongoose, ulanmagan bo'lsa LocalStore
const SmartUser = new Proxy(
  {},
  {
    get(target, prop) {
      // 1 = connected
      const isMongoConnected = mongoose.connection.readyState === 1;
      const activeModel = isMongoConnected ? MongooseUser : LocalUserStore;

      const value = activeModel[prop];
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    }
  }
);

export default SmartUser;
