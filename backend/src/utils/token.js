import jwt from 'jsonwebtoken';

// 3 daqiqalik Access Token yaratish
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '3m' }
  );
};

// 7 kunlik (1 hafta) Refresh Token yaratish
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Refresh tokenni HttpOnly cookie ga yozish
export const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true, // XSS hujumlaridan himoya: JavaScript orqali o'qib bo'lmaydi
    secure: process.env.NODE_ENV === 'production', // Faqat HTTPS da (productionda)
    sameSite: 'lax', // CSRF himoyasi va brauzerlararo so'rovlar uchun qulay
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 kun millisekundlarda
  });
};

