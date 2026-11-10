import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Access tokenni tekshirish
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Foydalanuvchini topish va req.user ga yuklash (paroldan tashqari)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
      }

      next();
    } catch (error) {
      console.error('Avtorizatsiya xatosi:', error.message);
      return res.status(401).json({
        message: 'Token yaroqsiz yoki muddati tugagan',
        code: 'TOKEN_EXPIRED'
      });
    }
  } else {
    return res.status(401).json({ message: 'Avtorizatsiya tokeni topilmadi' });
  }
};

