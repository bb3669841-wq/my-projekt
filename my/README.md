# 📚 EduHub — Zamonaviy O'quv Markazi Platformasi

EduHub o'quv markazi uchun xavfsiz autentifikatsiya, role-based authorization va kurslar CRUD API tizimi.

---

## 🚀 Texnologiyalar
- **Backend:** Node.js, Express.js
- **Xavfsizlik:** JWT (JSON Web Token), Bcrypt.js, Helmet, CORS, Express-Rate-Limit, Express-Slow-Down
- **Session & Cookie:** HttpOnly cookies (7 kunlik Refresh Token)
- **Email:** Nodemailer (6 xonali tasdiqlash kodi)
- **Frontend:** HTML5, CSS3 (Vercel/Linear dark modern design), JavaScript Vanilla SPA

---

## 📋 Amalga oshirilgan vazifalar

| # | Vazifa | Holat | Tavsif |
|---|--------|-------|--------|
| **1** | **Login & Register (JWT)** | ✅ Bajarildi | Email + password (bcrypt hash). Access token (15 min) JSON orqali, Refresh token (7 kun) httpOnly cookie orqali |
| **2** | **Role-Based Authorization** | ✅ Bajarildi | `user` va `admin` rollari. Faqat admin kirishi mumkin bo'lgan `GET /admin/dashboard` endpointi |
| **3** | **Session & Cookie** | ✅ Bajarildi | Refresh token httpOnly cookie orqali uzatiladi. `POST /auth/refresh` yangi access token qaytaradi |
| **4** | **Protection va Security** | ✅ Bajarildi | Helmet (xavfsiz headerlar), CORS (faqat `http://localhost:3000`), Rate limiting (`/auth/login` ga 1 daqiqada 5 ta), DDoS ga qarshi Slow-down |
| **5** | **Email Verification** | ✅ Bajarildi | Ro'yxatdan o'tganda emailga 6 xonali tasdiqlash kodi yuboriladi. `POST /auth/verify` orqali tasdiqlanadi |
| **6** | **Auth Required API (Protected)** | ✅ Bajarildi | `GET /profile` faqat access token bilan ochiladi. Token muddati tugasa, refresh token bilan avtomatik yangilanadi |
| **7** | **CRUD Kurslar Mini-API** | ✅ Bajarildi | `GET /courses` — barcha uchun ochiq. `POST`, `PUT`, `DELETE /courses/:id` — faqat admin uchun |

---

## ⚙️ O'rnatish va ishga tushirish

```bash
# 1. Bog'liqliklarni o'rnatish
npm install

# 2. Serverni ishga tushirish
npm start
# yoki dev rejimida:
npm run dev
```

Server ishga tushgach brauzerda oching:
👉 **http://localhost:3000**

---

## 🔑 Demo hisoblar

- **Admin hisob:**
  - Email: `admin@example.com`
  - Parol: `admin123`
  - Huquqi: To'liq admin panel, kurslarni qo'shish/tahrirlash/o'chirish, foydalanuvchilar rollarini o'zgartirish

- **Yangi foydalanuvchi:**
  - Ro'yxatdan o'tish sahifasida istalgan email bilan hisob ochishingiz mumkin.
  - Ro'yxatdan o'tgach, emailingizga 6 xonali kod keladi. Kodni kiritib profilingizga kirasiz.

---

## 📬 Haqiqiy Gmail orqali xat yuborish sozlamasi (.env)

Agar 6 xonali kod haqiqiy pochtangizga borishini xohlasangiz, `.env` fayliga Gmail ma'lumotlaringizni qo'shing:

```env
PORT=3000
ACCESS_TOKEN_SECRET=super_secret_access_key_change_me_in_production_2024
REFRESH_TOKEN_SECRET=super_secret_refresh_key_change_me_in_production_2024

# Haqiqiy Gmail:
EMAIL_USER=sizning_pochtangiz@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # Google Account -> Security -> App Passwords (16 xonali parol)
```
*Eslatma: Agar `.env` da email sozlanmagan bo'lsa, tizim demo rejimda ishlaydi va kodni ekranning o'zida ko'rsatib, 1-klikda to'ldirish imkonini beradi.*
