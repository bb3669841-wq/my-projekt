# Zamonaviy va Xavfsiz JWT Autentifikatsiya Tizimi (Full-Stack)

Ushbu loyiha zamonaviy sanoat xavfsizlik standartlariga javob beruvchi **Access Token + Refresh Token (HttpOnly Cookie)** mexanizmiga ega to'liq veb-ilova hisoblanadi.

---

## 🛠 Texnologiyalar Steki

- **Backend:**
  - **Node.js** & **Express.js** (ES Modules)
  - **MongoDB** & **Mongoose** (Ma'lumotlar bazasi va sxemalar)
  - **jsonwebtoken (JWT)** (Access & Refresh tokenlarni imzolash va tekshirish)
  - **bcryptjs** (Parollarni xavfsiz tuzli xeshlash)
  - **cookie-parser** (HttpOnly kuki bilan ishlash)
  - **cors** (Frontend bilan xavfsiz ma'lumot almashish)
  - **dotenv** (Konfiguratsiya o'zgaruvchilari)

- **Frontend:**
  - **React 18** (Vite build tool)
  - **Tailwind CSS** (Zamonaviy va responsiv dizayn)
  - **Axios** (Request/Response interceptors va Silent Refresh mexanizmi)
  - **React Router Dom v6** (Protected Routes va navigatsiya)
  - **Lucide React** (Zamonaviy UI piktogrammalari)

---

## 🔐 Xavfsizlik Arxitekturasi

1. **Access Token (3 daqiqa):**
   - Foydalanuvchining umumiy ma'lumotlari (`id`, `name`, `email`) bilan imzolanadi.
   - Xotirada (`in-memory`) saqlanadi (LocalStorage yoki SessionStorage ga yozilmaydi, bu XSS hujumlaridan himoya qiladi).
   - Har bir himoyalangan API so'rovga `Authorization: Bearer <token>` ko'rinishida yuboriladi.

2. **Refresh Token (7 kun / 1 hafta):**
   - Faqat foydalanuvchi ID si bilan imzolanadi.
   - MongoDB ma'lumotlar bazasida `refreshToken` maydonida saqlanadi.
   - Mijozga `HttpOnly; SameSite=Lax; Secure` cookie sifatida yuboriladi. Brauzerdagi JavaScript kodi uni o'qiy olmaydi.

3. **Silent Refresh (Axios Interceptors):**
   - 3 daqiqadan so'ng Access Token muddati tugaganda backend `401 Unauthorized` xatosini qaytaradi.
   - Axios response interceptor bu xatolikni ushlab oladi va avtomatik ravishda `/api/auth/refresh` endpointiga murojaat qiladi.
   - Yangi token olingach, navbatda turgan barcha so'rovlar yangi token bilan uzluksiz bajariladi.
   - Foydalanuvchi hech qanday uzilishsiz sahifada ishlashda davom etadi.

---

## 🚀 Ishga Tushirish Bo'yicha Qo'llanma

### 1. Backendni ishga tushirish

1. Terminalda `backend` papkasiga o'ting:
   ```bash
   cd backend
   ```
2. Kerakli paketlarni o'rnating:
   ```bash
   npm install
   ```
3. `.env` faylini tekshiring (MongoDB ishlab turganligiga ishonch hosil qiling):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/auth_system
   JWT_ACCESS_SECRET=access_token_super_secret_key_change_in_production_123456
   JWT_REFRESH_SECRET=refresh_token_super_secret_key_change_in_production_789012
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Serverni ishga tushiring:
   ```bash
   npm run dev
   # yoki
   npm start
   ```

Backend `http://localhost:5000` manzilida ishlaydi.

---

### 2. Frontendni ishga tushirish

1. Yangi terminal oynasida `frontend` papkasiga o'ting:
   ```bash
   cd frontend
   ```
2. Kerakli paketlarni o'rnating:
   ```bash
   npm install
   ```
3. Dasturni ishga tushiring:
   ```bash
   npm run dev
   ```

Frontend `http://localhost:5173` manzilida ochiladi.

---

## 🧪 Sinov Qadamlari

1. Brauzerda `http://localhost:5173` manziliga kiring.
2. **Ro'yxatdan o'tish** tugmasini bosing va yangi foydalanuvchi yarating.
3. Tizim sizni avtomatik ravishda `/dashboard` sahifasiga yo'naltiradi.
4. **Dashboardda:**
   - 3 daqiqalik Access Token hisoblagichini ko'rasiz.
   - **"Himoyalangan API ni chaqirish"** tugmasini bosib `/api/auth/me` muvaffaqiyatli ishlayotganini ko'ring.
   - **"Access Tokenni buzish"** tugmasini bosing va yana API ni chaqiring — Axios interceptor 401 ni ushlab, orqa fonda yangi token olib, so'rovni uzluksiz muvaffaqiyatli yakunlaganini jonli loglar oynasida ko'rasiz!
   - **"Chiqish (Logout)"** tugmasini bosing — sessiya tozalanadi va siz login sahifasiga qaytasiz.

