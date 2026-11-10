import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie
} from '../utils/token.js';

// @desc    Yangi foydalanuvchini ro'yxatdan o'tkazish
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Barcha maydonlar to'ldirilganligini tekshirish
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Iltimos, barcha maydonlarni to\'ldiring' });
    }

    // Email band emasligini tekshirish
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Ushbu email bilan allaqachon ro\'yxatdan o\'tilgan' });
    }

    // Yangi foydalanuvchi yaratish (parol pre('save') hooki orqali xeshlanadi)
    const user = await User.create({
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Ro\'yxatdan o\'tishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi: ' + error.message });
  }
};

// @desc    Tizimga kirish (Login)
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email va parolni kiriting' });
    }

    // Foydalanuvchini email orqali qidirish
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    // Parolni tekshirish
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    // Tokenlarni yaratish
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Refresh tokenni bazaga saqlash
    user.refreshToken = refreshToken;
    await user.save();

    // Refresh tokenni HttpOnly kuki sifatida yuborish
    setRefreshTokenCookie(res, refreshToken);

    // Refresh token muddati tugash vaqti (millisekundlarda)
    const refreshDecoded = jwt.decode(refreshToken);
    const refreshExpiresAt = refreshDecoded ? refreshDecoded.exp * 1000 : null;

    // Access token va foydalanuvchi ma'lumotlarini javobda qaytarish
    res.status(200).json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirildi',
      accessToken,
      refreshExpiresAt,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Kirishda xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi: ' + error.message });
  }
};

// @desc    Access tokenni yangilash (Silent refresh)
// @route   POST /api/auth/refresh
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token topilmadi' });
    }

    // Refresh tokenni tekshirish
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Refresh token yaroqsiz yoki muddati tugagan' });
    }

    // Foydalanuvchini topish va bazadagi token bilan solishtirish
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Xavfsizlik xatosi: Refresh token mos kelmadi' });
    }

    // Yangi 3 daqiqalik Access token yaratish
    const newAccessToken = generateAccessToken(user);

    const refreshDecoded = jwt.decode(refreshToken);
    const refreshExpiresAt = refreshDecoded ? refreshDecoded.exp * 1000 : null;

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshExpiresAt
    });
  } catch (error) {
    console.error('Refresh token xatosi:', error);
    res.status(500).json({ message: 'Server xatosi: ' + error.message });
  }
};

// @desc    Tizimdan chiqish (Logout)
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Bazadagi refresh tokenni o'chirish (tozalash)
      await User.findOneAndUpdate(
        { refreshToken },
        { refreshToken: null }
      );
    }

    // Brauzer kuki xotirasidan o'chirish
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Tizimdan muvaffaqiyatli chiqildi'
    });
  } catch (error) {
    console.error('Chiqishda xatolik:', error);
    res.status(500).json({ message: 'Server xatosi: ' + error.message });
  }
};

// @desc    Joriy foydalanuvchi ma'lumotlarini olish (Himoyalangan route)
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    let refreshExpiresAt = null;
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.exp) {
        refreshExpiresAt = decoded.exp * 1000;
      }
    }

    res.status(200).json({
      success: true,
      refreshExpiresAt,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi: ' + error.message });
  }
};

