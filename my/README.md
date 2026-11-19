# 📚 EduHub — Zamonaviy O'quv Markazi Platformasi

EduHub o'quv markazi uchun xavfsiz autentifikatsiya, role-based authorization va kurslar CRUD API tizimi.

---

## 🚀 Yangi Mantiq: Email orqali Parol yuborish tizimi

Foydalanuvchi ro'yxatdan o'tganda (Register):
1. Foydalanuvchi o'z **email** manzilini kiritadi.
2. Tizim avtomatik ravishda xavfsiz 6 xonali kirish parolini yaratadi, **bcrypt** bilan heshlaydi va **ushbu emailga yuboradi**.
3. Foydalanuvchi pochtasiga kelgan parolni saytga kirish (Login) oynasida kiritadi va saytga kiradi!
4. Parol yoddan ko'tarilsa yoki kelmasa — **«Parolni qayta yuborish»** tugmasi orqali yangi parol darhol emailga jo'natiladi.

---

## 📋 Amalga oshirilgan barcha talablar

| # | Vazifa | Holat | Tavsif |
|---|--------|-------|--------|
| **1** | **Login & Register (JWT)** | ✅ Bajarildi | Email + password (bcrypt hash). Access token (15 min) JSON orqali, Refresh token (7 kun) httpOnly cookie orqali |
| **2** | **Role-Based Authorization** | ✅ Bajarildi | `user` va `admin` rollari. Faqat admin kirishi mumkin bo'lgan `GET /admin/dashboard` endpointi |
| **3** | **Session & Cookie** | ✅ Bajarildi | Refresh token httpOnly cookie orqali uzatiladi. `POST /auth/refresh` yangi access token qaytaradi |
| **4** | **Protection va Security** | ✅ Bajarildi | Helmet (xavfsiz headerlar), CORS (faqat `http://localhost:3000`), Rate limiting (`/auth/login` ga 1 daqiqada 5 ta), DDoS ga qarshi Slow-down |
| **5** | **Email Verification / Password Delivery** | ✅ Bajarildi | Ro'yxatdan o'tganda emailga kirish paroli yuboriladi va faqat o'sha parol bilan tizimga kirish mumkin |
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

## 📧 Google orqali haqiqiy pochtaga xat yuborish (.env)

Sayt **Google orqali har qanday haqiqiy emailga** xat yuborishni qo'llab-quvvatlaydi.

### 1-Usul: Google App Password (Eng oson va tezkor, 1 daqiqa)
1. Google hisobingizga kiring: [myaccount.google.com/security](https://myaccount.google.com/security)
2. **2-Step Verification** (2 bosqichli tekshiruv) ni yoqing.
3. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) ga kiring.
4. "EduHub" deb nom berib **16 xonali maxsus parol** oling.
5. `.env` fayliga yozing:
   ```env
   EMAIL_USER=sizning_pochtangiz@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

### 2-Usul: Google Cloud Console (OAuth 2.0)
1. [console.cloud.google.com](https://console.cloud.google.com) da loyiha oching.
2. **Gmail API** ni yoqing (Enable).
3. **Credentials** bo'limida OAuth 2.0 Client ID (Web) yarating.
4. `.env` fayliga yozing:
   ```env
   EMAIL_USER=sizning_pochtangiz@gmail.com
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   ```

*Eslatma: Agar `.env` da Google sozlanmagan bo'lsa, tizim avtomatik ravishda Ethereal demo rejimida ishlaydi va parolni ekranning o'zida ko'rsatib, 1-klikda to'ldirish imkonini beradi.*

---

## 🔑 Demo hisoblar

- **Admin hisob:**
  - Email: `admin@example.com`
  - Parol: `admin123`
  - Huquqi: To'liq admin panel, kurslarni qo'shish/tahrirlash/o'chirish, foydalanuvchilar rollarini o'zgartirish
