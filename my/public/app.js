/* ═══════════════════════════════════════════════════════════════
   EduHub — O'quv Markazi Frontend Application & Admin Panel
   ═══════════════════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────────────────────

let state = {
  user: null,
  accessToken: null,
  currentPage: 'home',
  adminTab: 'overview', // 'overview' | 'courses' | 'users' | 'security'
  loginEmail: null,      // Pre-filled login email
  lastSentPassword: null,// Password sent to email
  emailPreviewUrl: null, // Ethereal preview link
  isRealEmail: false     // Whether real email was sent
};

const bannerColors = ['green', 'purple', 'blue'];

// ── API Helper ────────────────────────────────────────────────
async function api(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  };

  if (state.accessToken) {
    config.headers['Authorization'] = `Bearer ${state.accessToken}`;
  }

  const res = await fetch(url, config);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { error: 'Javobni o\'qib bo\'lmadi' };
  }

  // Token expired (403), try refresh
  if (res.status === 403 && url !== '/auth/refresh' && !url.includes('/admin/')) {
    const refreshed = await refreshToken();
    if (refreshed) {
      config.headers['Authorization'] = `Bearer ${state.accessToken}`;
      const retry = await fetch(url, config);
      return { ok: retry.ok, status: retry.status, data: await retry.json() };
    }
  }

  return { ok: res.ok, status: res.status, data };
}

async function refreshToken() {
  try {
    const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      state.accessToken = data.accessToken;
      return true;
    }
  } catch (e) {}
  logout(true);
  return false;
}

// ── Toast ─────────────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<strong>${icons[type] || 'ℹ'}</strong> ${message}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Navigation ────────────────────────────────────────────────
function navigate(page) {
  state.currentPage = page;
  render();
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  document.getElementById('navLinks')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobile() {
  document.getElementById('navLinks')?.classList.toggle('open');
}

// ── Auth ──────────────────────────────────────────────────────
function logout(silent) {
  fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  state.user = null;
  state.accessToken = null;
  updateNav();
  if (!silent) {
    navigate('home');
    toast('Tizimdan chiqdingiz', 'success');
  }
}

// ── Quick Admin Login helper (1-click for testing) ───────────
async function quickAdminLogin() {
  const { ok, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
  });

  if (ok) {
    state.user = data.user;
    state.accessToken = data.accessToken;
    toast('Admin sifatida kirdingiz! 🛡️', 'success');
    navigate('admin');
  } else {
    toast(data.error || 'Kirishda xatolik', 'error');
  }
}

// Quick Demo User Login
async function quickUserLogin() {
  // Try register first or login
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@example.com', password: 'user123' })
  });

  const { ok, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@example.com', password: 'user123' })
  });

  if (ok) {
    state.user = data.user;
    state.accessToken = data.accessToken;
    toast('Student sifatida kirdingiz (Oddiy user)', 'info');
    navigate('profile');
  } else {
    toast(data.error || 'Kirishda xatolik', 'error');
  }
}

function updateNav() {
  const authNav = document.getElementById('authNav');
  if (!authNav) return;

  if (state.user) {
    authNav.innerHTML = `
      <a href="#" onclick="navigate('profile')" class="nav-link" data-page="profile">
        <span>👤 ${escapeHtml(state.user.email.split('@')[0])}</span>
        <span class="badge ${state.user.role === 'admin' ? 'badge-admin' : 'badge-user'}" style="margin-left:4px">${state.user.role}</span>
      </a>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Chiqish</button>
    `;
  } else {
    authNav.innerHTML = `
      <a href="#" onclick="navigate('login')" class="btn btn-ghost btn-sm">Kirish</a>
      <a href="#" onclick="navigate('register')" class="btn btn-primary btn-sm">Ro'yxatdan o'tish</a>
    `;
  }
}

// ── Page Render ───────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  updateNav();

  switch (state.currentPage) {
    case 'home':     app.innerHTML = renderHome(); break;
    case 'login':    app.innerHTML = renderLogin(); break;
    case 'register': app.innerHTML = renderRegister(); break;
    case 'verify':   app.innerHTML = renderVerify(); break;
    case 'profile':  renderProfile(app); break;
    case 'admin':    renderAdmin(app); break;
    case 'courses':  renderCourses(app); break;
    default:         app.innerHTML = renderHome();
  }
}

// ── HOME ──────────────────────────────────────────────────────
function renderHome() {
  return `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="dot"></span>
          EduHub Zamonaviy O'quv Markazi
        </div>
        <h1>Kelajak kasblarini<br><span class="gradient-text">EduHub bilan o'rganing</span></h1>
        <p>Xavfsiz JWT autentifikatsiya, Role-Based ruxsatlar va to'liq CRUD API bilan jihozlangan eng zamonaviy ta'lim platformasi.</p>
        <div class="hero-buttons">
          <a href="#" onclick="navigate('courses')" class="btn btn-primary btn-lg">Kurslarni ko'rish →</a>
          <a href="#" onclick="navigate('admin')" class="btn btn-secondary btn-lg">⚙️ Admin Panel</a>
        </div>

        <div class="hero-stats">
          <div class="hero-stat">
            <div class="stat-number green">1,200+</div>
            <div class="stat-label">O'quvchilar</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number purple">6+</div>
            <div class="stat-label">Asosiy Kurslar</div>
          </div>
          <div class="hero-stat">
            <div class="stat-number blue">100%</div>
            <div class="stat-label">Xavfsiz Tizim</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Access Box for Testing & Evaluation -->
    <section class="section" style="padding-bottom: 30px;">
      <div class="card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(16, 185, 129, 0.05)); border-color: rgba(139, 92, 246, 0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <span class="badge badge-admin" style="margin-bottom:8px">Topshiriq 2 & 7: Admin Panel & CRUD</span>
            <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:4px">Admin Panelga Tezkor O'tish</h3>
            <p style="color:var(--text-secondary); font-size:0.9rem">Faqat "admin" roli kira oladigan <code>GET /admin/dashboard</code> va kurslarni boshqarish paneli.</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="quickAdminLogin()">⚡ 1-Click Admin Kirish</button>
            <button class="btn btn-secondary" onclick="navigate('admin')">Admin Panelni ochish</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Tizim imkoniyatlari va <span class="gradient-text">Xavfsizlik</span></h2>
        <p>Loyiha talablariga to'liq mos keluvchi arxitektura</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon green">1️⃣</div>
          <h3>Login & Register (JWT)</h3>
          <p>Foydalanuvchi paroli bcrypt bilan heshlanadi. Access token (15 daqiqa) JSON orqali, refresh token (7 kun) esa httpOnly cookie'da saqlanadi.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon purple">2️⃣</div>
          <h3>Role-Based Authorization</h3>
          <p>Foydalanuvchi roli <code>user</code> yoki <code>admin</code> bo'ladi. <code>GET /admin/dashboard</code> faqat admin uchun ochiq!</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon blue">3️⃣</div>
          <h3>Session & Cookie</h3>
          <p>Refresh token httpOnly cookie orqali uzatiladi. <code>POST /auth/refresh</code> yordamida token avtomatik yangilanadi.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon green">4️⃣</div>
          <h3>Himoya va Xavfsizlik</h3>
          <p>Helmet xavfsiz sarlavhalari, faqat <code>localhost:3000</code> ga ruxsat beruvchi CORS, daqiqasiga 5 so'rovli Rate Limit va DDoS ga qarshi Slow-down.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon purple">6️⃣</div>
          <h3>Himoyalangan Profil (Protected)</h3>
          <p><code>GET /profile</code> faqat to'g'ri access token bilan ochiladi. Token tugaganda refresh token bilan yangilanadi.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon blue">7️⃣</div>
          <h3>Courses CRUD Mini-API</h3>
          <p><code>GET /courses</code> barchaga ochiq. Kurs qo'shish (POST), tahrirlash (PUT) va o'chirish (DELETE) faqat admin uchun!</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>© 2024 <a href="#" onclick="navigate('home')">EduHub</a> — Zamonaviy O'quv Markazi Platformasi</p>
    </footer>
  `;
}

// ── LOGIN ─────────────────────────────────────────────────────
function renderLogin() {
  const currentEmail = state.loginEmail || 'admin@example.com';
  const isAfterRegister = !!state.lastSentPassword;

  return `
    <div class="auth-page">
      <div class="auth-card" style="max-width:440px">
        <div class="auth-logo">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          EduHub
        </div>
        <h2>Tizimga kirish</h2>
        <p class="auth-subtitle">Emailingizga kelgan parol bilan kiring</p>

        ${isAfterRegister ? `
          <div style="padding:14px 16px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:var(--r-sm);margin-bottom:20px;">
            <div style="font-size:0.85rem;color:var(--accent-light);font-weight:600;margin-bottom:6px">
              📬 Parol <strong>${escapeHtml(state.loginEmail)}</strong> pochtangizga yuborildi!
            </div>
            ${!state.isRealEmail && state.lastSentPassword ? `
              <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);padding:8px 12px;border-radius:6px;margin-top:8px">
                <span style="font-size:0.82rem;color:var(--text-40)">Emailga borgan parol:</span>
                <span style="font-family:'JetBrains Mono',monospace;font-weight:800;color:var(--accent-light);font-size:1.1rem;letter-spacing:2px">${state.lastSentPassword}</span>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="autoFillLoginPassword('${state.lastSentPassword}')" style="width:100%;margin-top:8px">
                ⚡ Parolni avtomatik kiritish (1-klik)
              </button>
            ` : ''}
            ${state.emailPreviewUrl ? `
              <div style="margin-top:8px;font-size:0.75rem;text-align:center">
                <a href="${state.emailPreviewUrl}" target="_blank" rel="noopener" style="color:var(--accent-light);text-decoration:underline">📬 Ethereal xatini ochish</a>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <form class="auth-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="loginEmail" placeholder="siz@example.com" value="${escapeHtml(currentEmail)}" required>
          </div>
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <label class="form-label">Emailga kelgan parol</label>
              <button type="button" onclick="resendPassword()" style="background:none;border:none;color:var(--accent-light);font-size:0.72rem;cursor:pointer;padding:0">
                🔄 Parolni qayta yuborish
              </button>
            </div>
            <div class="form-input-group">
              <input type="password" class="form-input" id="loginPassword" placeholder="Emailingizdagi parolni kiriting" value="${isAfterRegister ? state.lastSentPassword : (currentEmail === 'admin@example.com' ? 'admin123' : '')}" required autofocus>
              <button type="button" class="toggle-password" onclick="togglePass('loginPassword', this)">Ko'rish</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" id="loginBtn">Kirish</button>
        </form>

        <div style="display:flex; gap:8px; margin-top:16px;">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="quickAdminLogin()">⚡ Admin sifatida kirish</button>
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="navigate('register')">✉️ Yangi hisob ochish</button>
        </div>

        <div class="auth-footer">
          Hisobingiz yo'qmi? <a href="#" onclick="navigate('register')">Ro'yxatdan o'ting</a>
        </div>
        <div class="demo-box">
          <strong>Demo Admin:</strong> admin@example.com / admin123
        </div>
      </div>
    </div>
  `;
}

function autoFillLoginPassword(pwd) {
  const pwdInput = document.getElementById('loginPassword');
  if (pwdInput) pwdInput.value = pwd;
  toast('Parol kiritildi! Endi "Kirish" tugmasini bosing', 'info');
}

async function resendPassword() {
  const emailInput = document.getElementById('loginEmail');
  const email = emailInput ? emailInput.value.trim() : state.loginEmail;

  if (!email) {
    toast('Iltimos, emailingizni kiriting', 'error');
    return;
  }

  toast('Yangi parol emailingizga yuborilmoqda...', 'info');
  const { ok, data } = await api('/auth/resend-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  if (ok) {
    state.lastSentPassword = data.password;
    state.emailPreviewUrl = data.emailPreviewUrl || null;
    state.isRealEmail = data.isReal || false;
    toast(data.message || 'Yangi parol yuborildi! 📬', 'success');
    render();
  } else {
    toast(data.error || 'Parolni yuborishda xatolik', 'error');
  }
}

function togglePass(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Yashirish';
  } else {
    input.type = 'password';
    btn.textContent = 'Ko\'rish';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Kirish...';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const { ok, data } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (ok) {
    state.user = data.user;
    state.accessToken = data.accessToken;
    state.lastSentPassword = null;
    toast(`Xush kelibsiz, ${data.user.email}! 🎉`, 'success');

    // If admin, go straight to Admin Panel!
    if (data.user.role === 'admin') {
      navigate('admin');
    } else {
      navigate('profile');
    }
  } else {
    toast(data.error || 'Kirish xatosi. Emailingizga borgan parolni to\'g\'ri kiriting.', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Kirish';
  }
}

// ── REGISTER ──────────────────────────────────────────────────
function renderRegister() {
  return `
    <div class="auth-page">
      <div class="auth-card" style="max-width:440px">
        <div class="auth-logo">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          EduHub
        </div>
        <h2>Ro'yxatdan o'tish</h2>
        <p class="auth-subtitle">Emailingizni kiriting — kirish paroli pochtangizga yuboriladi</p>

        <div style="padding:12px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--r-sm);margin-bottom:20px;font-size:0.82rem;color:var(--accent-light);line-height:1.5">
          ℹ️ <strong>Mantiq:</strong> Ro'yxatdan o'tganda siz kiritgan emailga kirish paroli yuboriladi. Shu parol orqali saytga kirasiz.
        </div>

        <form class="auth-form" onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Email manzil</label>
            <input type="email" class="form-input" id="regEmail" placeholder="sizning_emailingiz@gmail.com" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Parol (Ixtiyoriy)</label>
            <div class="form-input-group">
              <input type="password" class="form-input" id="regPassword" placeholder="Bo'sh qolsa, 6 xonali parol emailga boradi">
              <button type="button" class="toggle-password" onclick="togglePass('regPassword', this)">Ko'rish</button>
            </div>
            <span style="font-size:0.75rem;color:var(--text-40)">Bo'sh qoldirishingiz mumkin — parol emailingizga boradi.</span>
          </div>
          <button type="submit" class="btn btn-primary" id="regBtn" style="padding:12px">
            ✉️ Ro'yxatdan o'tish va parolni emailga olish
          </button>
        </form>

        <div class="auth-footer">
          Hisobingiz bormi? <a href="#" onclick="navigate('login')">Kirish</a>
        </div>
      </div>
    </div>
  `;
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('regBtn');

  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Parol emailga yuborilmoqda...';

  const { ok, data } = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (ok) {
    state.loginEmail = email;
    state.lastSentPassword = data.password;
    state.emailPreviewUrl = data.emailPreviewUrl || null;
    state.isRealEmail = data.isReal || false;
    toast(data.message || 'Kirish paroli emailingizga yuborildi! 📬', 'success');
    navigate('login');
  } else {
    toast(data.error || 'Ro\'yxatdan o\'tish xatosi', 'error');
    btn.disabled = false;
    btn.innerHTML = '✉️ Ro\'yxatdan o\'tish va parolni emailga olish';
  }
}

// ── VERIFY EMAIL ──────────────────────────────────────────────
function renderVerify() {
  const email = state.verifyEmail || '';
  return `
    <div class="auth-page">
      <div class="auth-card" style="max-width:460px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:64px;height:64px;background:var(--accent-glow);border:1px solid rgba(16,185,129,0.2);border-radius:50%;display:grid;place-items:center;font-size:1.8rem;margin:0 auto 16px">📧</div>
          <h2 style="margin-bottom:4px">Emailni tasdiqlash</h2>
          <p class="auth-subtitle" style="margin-bottom:0">${escapeHtml(email)} manziliga<br>6 xonali tasdiqlash kodi yuborildi</p>
        </div>

        ${state.isRealEmail ? `
          <div style="padding:12px 16px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:var(--r-sm);margin-bottom:20px;text-align:center;font-size:0.85rem;color:var(--accent-light)">
            📬 <strong>Pochtani tekshiring!</strong> Kod <strong>${escapeHtml(email)}</strong> ga yuborildi (agar kelmasa, Spam papkasini ham tekshiring).
          </div>
        ` : (state.lastCode ? `
          <div style="padding:14px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--r-sm);margin-bottom:20px;text-align:center;">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-40);margin-bottom:4px">Tasdiqlash kodi</div>
            <div style="font-size:1.8rem;font-weight:900;letter-spacing:6px;color:var(--accent-light);font-family:'JetBrains Mono',monospace;margin-bottom:10px">${state.lastCode}</div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="fillVerificationCode('${state.lastCode}')" style="width:100%">
              ⚡ Kodni avtomatik kiritish
            </button>
          </div>
        ` : '')}

        <form class="auth-form" onsubmit="handleVerify(event)">
          <div class="form-group">
            <label class="form-label">Tasdiqlash kodi</label>
            <div style="display:flex;gap:6px;justify-content:center" id="codeInputs">
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="0" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0" autofocus>
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="1" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0">
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="2" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0">
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="3" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0">
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="4" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0">
              <input type="text" maxlength="1" class="form-input verify-digit" data-idx="5" oninput="onDigitInput(this)" onkeydown="onDigitKeydown(event, this)" style="width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;padding:0">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" id="verifyBtn">Tasdiqlash</button>
        </form>

        <div style="text-align:center; margin-top:16px">
          <button class="btn btn-ghost btn-sm" onclick="resendCode()">🔄 Kodni qaytadan yuborish</button>
        </div>

        ${state.emailPreviewUrl ? `
          <div class="demo-box" style="margin-top:16px; text-align:center">
            <strong>📬 Ethereal xati:</strong><br>
            <a href="${state.emailPreviewUrl}" target="_blank" rel="noopener" style="color:var(--accent-light); word-break:break-all; font-size:0.72rem">${state.emailPreviewUrl}</a>
          </div>
        ` : ''}

        <div style="text-align:center; margin-top:12px; padding-top:14px; border-top:1px solid var(--border)">
          <p style="color:var(--text-40); font-size:0.8rem">⏱️ Kod 5 daqiqa davomida amal qiladi</p>
        </div>
      </div>
    </div>
  `;
}

function fillVerificationCode(code) {
  if (!code) return;
  const digits = String(code).split('');
  digits.forEach((d, idx) => {
    const input = document.querySelector(`.verify-digit[data-idx="${idx}"]`);
    if (input) input.value = d;
  });
  toast('Kod kiritildi! "Tasdiqlash" tugmasini bosing', 'info');
}

// Auto-advance digit inputs
function onDigitInput(el) {
  el.value = el.value.replace(/[^0-9]/g, '');
  if (el.value && el.dataset.idx < 5) {
    const next = document.querySelector(`.verify-digit[data-idx="${Number(el.dataset.idx) + 1}"]`);
    if (next) next.focus();
  }
}

function onDigitKeydown(e, el) {
  if (e.key === 'Backspace' && !el.value && el.dataset.idx > 0) {
    const prev = document.querySelector(`.verify-digit[data-idx="${Number(el.dataset.idx) - 1}"]`);
    if (prev) { prev.focus(); prev.value = ''; }
  }
}

function getCodeFromInputs() {
  return Array.from(document.querySelectorAll('.verify-digit')).map(i => i.value).join('');
}

async function handleVerify(e) {
  e.preventDefault();
  const code = getCodeFromInputs();

  if (code.length !== 6) {
    toast('Iltimos, 6 xonali kodni to\'liq kiriting', 'error');
    return;
  }

  const btn = document.getElementById('verifyBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Tekshirilmoqda...';

  const { ok, data } = await api('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email: state.verifyEmail, code })
  });

  if (ok) {
    toast('Email muvaffaqiyatli tasdiqlandi! ✅', 'success');
    state.verifyEmail = null;
    state.emailPreviewUrl = null;
    navigate('login');
  } else {
    toast(data.error || 'Tasdiqlash xatosi', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Tasdiqlash';
    // Clear inputs
    document.querySelectorAll('.verify-digit').forEach(i => { i.value = ''; });
    document.querySelector('.verify-digit[data-idx="0"]')?.focus();
  }
}

async function resendCode() {
  if (!state.verifyEmail) {
    toast('Email manzili topilmadi', 'error');
    return;
  }

  const { ok, data } = await api('/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email: state.verifyEmail })
  });

  if (ok) {
    state.emailPreviewUrl = data.emailPreviewUrl || null;
    state.lastCode = data.code || state.lastCode;
    state.isRealEmail = data.isReal || false;
    toast(data.message || 'Yangi kod yuborildi! 📧', 'success');
    navigate('verify'); // re-render to show new preview link
  } else {
    toast(data.error || 'Kodni yuborishda xatolik', 'error');
  }
}

// ── PROFILE ───────────────────────────────────────────────────
async function renderProfile(container) {
  if (!state.user) { navigate('login'); return; }

  const isAdmin = state.user.role === 'admin';

  container.innerHTML = `
    <div class="profile-page">
      <div class="profile-header">
        <div class="profile-avatar">${state.user.email[0].toUpperCase()}</div>
        <div class="profile-info" style="flex:1">
          <h1>${escapeHtml(state.user.email)}</h1>
          <p>
            <span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">${state.user.role.toUpperCase()}</span>
          </p>
        </div>
        ${isAdmin ? '<button class="btn btn-primary" onclick="navigate(\'admin\')">⚙️ Admin Panelga o\'tish</button>' : ''}
      </div>

      <div class="profile-grid" id="profileCards">
        ${[1,2,3,4].map(() => `
          <div class="stat-card">
            <div class="skeleton" style="width:100px;height:12px;margin-bottom:12px"></div>
            <div class="skeleton" style="width:180px;height:22px"></div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:24px;">
        <h3 style="font-size:1.1rem; margin-bottom:8px">🔐 Himoyalangan API Tekshiruvi (GET /profile)</h3>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px">
          Ushbu sahifa faqat <code>Authorization: Bearer &lt;accessToken&gt;</code> sarlavhasi bilan ishlaydi (Topshiriq 6).
        </p>
        <button class="btn btn-secondary btn-sm" onclick="testProfileAPI()">⚡ GET /profile ni qayta so'rash</button>
        <div id="profileApiResult" style="margin-top:12px"></div>
      </div>
    </div>
  `;

  const { ok, data } = await api('/profile');
  if (ok) {
    document.getElementById('profileCards').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Email manzil</div>
        <div class="stat-value">${escapeHtml(data.email)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Foydalanuvchi roli</div>
        <div class="stat-value"><span class="badge ${data.role === 'admin' ? 'badge-admin' : 'badge-user'}">${data.role}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ro'yxatdan o'tgan sana</div>
        <div class="stat-value">${new Date(data.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Foydalanuvchi ID (UUID)</div>
        <div class="stat-value" style="font-size:0.75rem;word-break:break-all;color:var(--text-secondary);font-family:monospace">${data.id}</div>
      </div>
    `;
  } else {
    toast('Profil yuklanmadi', 'error');
  }
}

async function testProfileAPI() {
  const resultEl = document.getElementById('profileApiResult');
  resultEl.innerHTML = '<div class="spinner"></div> So\'rov yuborilmoqda...';
  const res = await api('/profile');
  resultEl.innerHTML = `
    <div class="code-box">HTTP Status: ${res.status} ${res.ok ? 'OK (Muvaffaqiyatli)' : 'Error'}\n${JSON.stringify(res.data, null, 2)}</div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ── ADMIN PANEL (FULL IMPLEMENTATION) ──────────────────────────
// ═══════════════════════════════════════════════════════════════

async function renderAdmin(container) {
  // If user is not logged in or NOT an admin:
  if (!state.user || state.user.role !== 'admin') {
    renderAdminGate(container);
    return;
  }

  // Admin is authenticated! Render the dashboard layout:
  container.innerHTML = `
    <div class="admin-page">
      <!-- Admin Header -->
      <div class="admin-header-row">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px">
            <span class="badge badge-admin">Boshqaruv Markazi</span>
            <span style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; color:var(--accent-hover)">
              <span class="admin-pulse"></span> GET /admin/dashboard
            </span>
          </div>
          <h1 class="page-title">EduHub Admin Panel</h1>
          <p class="page-subtitle" style="margin-bottom:0">Tizim holati, foydalanuvchilar va kurslarni boshqarish</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="refreshAdminData()">🔄 Yangilash</button>
          <button class="btn btn-primary btn-sm" onclick="showCourseModal()">+ Yangi kurs</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button class="admin-tab ${state.adminTab === 'overview' ? 'active' : ''}" onclick="switchAdminTab('overview')">
          📊 Umumiy statistika
        </button>
        <button class="admin-tab ${state.adminTab === 'courses' ? 'active' : ''}" onclick="switchAdminTab('courses')">
          📚 Kurslar boshqaruvi
        </button>
        <button class="admin-tab ${state.adminTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">
          👥 Foydalanuvchilar
        </button>
        <button class="admin-tab ${state.adminTab === 'security' ? 'active' : ''}" onclick="switchAdminTab('security')">
          🛡️ API & Token Tekshiruvi
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="adminTabContent">
        <div style="padding:60px 0; text-align:center">
          <div class="spinner" style="margin:0 auto; width:32px; height:32px; border-color:var(--border); border-top-color:var(--accent)"></div>
          <p style="margin-top:16px; color:var(--text-secondary)">Admin ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    </div>
  `;

  // Fetch admin dashboard data from GET /admin/dashboard
  await loadAdminTabData();
}

// ── Admin Gate (Access Control Screen) ─────────────────────────
function renderAdminGate(container) {
  const isLogged = !!state.user;
  container.innerHTML = `
    <div class="admin-gate-page">
      <div class="admin-gate-card">
        <div class="admin-gate-icon">🔒</div>
        <span class="badge badge-admin" style="margin-bottom:12px">Topshiriq 2: Role-Based Authorization</span>
        <h2>Admin Panelga Kirish Cheklangan</h2>
        <p>
          Ushbu sahifa <code>GET /admin/dashboard</code> endpointi orqali himoyalangan.<br>
          Faqat <strong>"admin"</strong> roliga ega bo'lgan foydalanuvchilar kirishi mumkin.
        </p>

        ${isLogged ? `
          <div style="padding:14px; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.25); border-radius:var(--radius-sm); margin-bottom:20px; font-size:0.88rem; color:#fca5a5;">
            Siz hozir <strong>${escapeHtml(state.user.email)}</strong> (${state.user.role}) sifatida kirdingiz. Sizning rolingizda admin huquqi yo'q (403 Forbidden).
          </div>
        ` : `
          <div style="padding:14px; background:var(--accent-subtle); border:1px solid var(--border-accent); border-radius:var(--radius-sm); margin-bottom:20px; font-size:0.88rem; color:var(--text-secondary);">
            Siz hozir tizimga kirmagansiz (401 Unauthorized). Admin hisob bilan kiring.
          </div>
        `}

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-primary" onclick="quickAdminLogin()" style="width:100%">
            ⚡ 1-Click Admin Kirish (admin@example.com)
          </button>
          <button class="btn btn-secondary" onclick="navigate('login')" style="width:100%">
            Kirish sahifasiga o'tish
          </button>
          <button class="btn btn-ghost btn-sm" onclick="testAdminForbidden()" style="margin-top:6px">
            🧪 403 Forbidden xatosini serverdan tekshirish
          </button>
        </div>

        <div id="forbiddenTestResult" style="margin-top:16px"></div>
      </div>
    </div>
  `;
}

async function testAdminForbidden() {
  const el = document.getElementById('forbiddenTestResult');
  el.innerHTML = '<div class="spinner"></div> Tekshirilmoqda...';
  const res = await api('/admin/dashboard');
  el.innerHTML = `
    <div class="code-box" style="text-align:left; color:#fca5a5;">
Status: ${res.status} (${res.status === 403 ? '403 Forbidden (To\'g\'ri ishladi!)' : (res.status === 401 ? '401 Unauthorized' : res.status)})
Javob: ${JSON.stringify(res.data, null, 2)}
    </div>
  `;
}

// ── Switch Admin Tabs ─────────────────────────────────────────
function switchAdminTab(tabName) {
  state.adminTab = tabName;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.admin-tab')).find(b => b.textContent.includes(
    tabName === 'overview' ? 'Umumiy' : (tabName === 'courses' ? 'Kurslar' : (tabName === 'users' ? 'Foydalanuvchilar' : 'API'))
  ));
  if (activeBtn) activeBtn.classList.add('active');
  loadAdminTabData();
}

async function refreshAdminData() {
  toast('Ma\'lumotlar yangilanmoqda...', 'info');
  await loadAdminTabData();
  toast('Yangilandi ✓', 'success');
}

// ── Load and Render Tab Data ──────────────────────────────────
let cachedAdminData = null;

async function loadAdminTabData() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  const { ok, data } = await api('/admin/dashboard');
  if (!ok) {
    content.innerHTML = `
      <div class="card" style="text-align:center; padding:40px;">
        <h3 style="color:var(--error); margin-bottom:8px">Xatolik: ${data.error || 'Admin ma\'lumotlarini olib bo\'lmadi'}</h3>
        <p style="color:var(--text-secondary)">Sizda admin ruxsati mavjud emas yoki sessiya muddati tugagan.</p>
      </div>
    `;
    return;
  }

  cachedAdminData = data;

  switch (state.adminTab) {
    case 'overview': content.innerHTML = renderAdminOverview(data); break;
    case 'courses':  content.innerHTML = renderAdminCourses(data); break;
    case 'users':    content.innerHTML = renderAdminUsers(data); break;
    case 'security': content.innerHTML = renderAdminSecurity(data); break;
    default:         content.innerHTML = renderAdminOverview(data);
  }
}

// ── TAB 1: OVERVIEW ───────────────────────────────────────────
function renderAdminOverview(data) {
  return `
    <!-- Top Stats Row -->
    <div class="stats-row">
      <div class="admin-stat">
        <div class="stat-number green">${data.stats.totalUsers}</div>
        <div class="stat-label">Jami Foydalanuvchilar</div>
      </div>
      <div class="admin-stat">
        <div class="stat-number purple">${data.stats.totalCourses}</div>
        <div class="stat-label">Faol Kurslar</div>
      </div>
      <div class="admin-stat">
        <div class="stat-number blue">${data.stats.totalSessions}</div>
        <div class="stat-label">Faol Sessiyalar (Tokens)</div>
      </div>
      <div class="admin-stat">
        <div class="stat-number" style="color:#f59e0b">${data.stats.totalAdmins}</div>
        <div class="stat-label">Adminlar Soni</div>
      </div>
    </div>

    <!-- Security & Status Grid -->
    <h3 class="section-title">🛡️ Topshiriq 4: Xavfsizlik Middlewarelari Holati</h3>
    <div class="security-grid">
      <div class="security-card">
        <div class="sec-icon">🪖</div>
        <h4>Helmet</h4>
        <p>Xavfsiz HTTP sarlavhalari (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security va h.k.)</p>
        <div class="sec-status">● ${data.security.helmet}</div>
      </div>
      <div class="security-card">
        <div class="sec-icon">🌐</div>
        <h4>CORS Himoyasi</h4>
        <p>Faqat ruxsat berilgan manbadan so'rovlarni qabul qilish sozlamasi.</p>
        <div class="sec-status">● ${data.security.cors}</div>
      </div>
      <div class="security-card">
        <div class="sec-icon">⏱️</div>
        <h4>Rate Limiting</h4>
        <p><code>/auth/login</code> uchun 1 daqiqada 5 ta so'rov chegarasi. DDoS ga qarshi himoya.</p>
        <div class="sec-status">● ${data.security.rateLimit}</div>
      </div>
      <div class="security-card">
        <div class="sec-icon">🐢</div>
        <h4>DDoS Slow-Down</h4>
        <p>Katta hajmdagi shubhali so'rovlarni bosqichma-bosqich sekinlashtirish middleware.</p>
        <div class="sec-status">● ${data.security.ddosProtection}</div>
      </div>
    </div>

    <!-- Quick Action Cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:16px; margin-top:24px;">
      <div class="card">
        <h4 style="font-size:1.05rem; font-weight:700; margin-bottom:8px">📚 Yangi Kurs Yaratish</h4>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin-bottom:16px">Platformaga yangi dars yoki kurs qo'shish (POST /courses).</p>
        <button class="btn btn-primary btn-sm" onclick="showCourseModal()">+ Kurs qo'shish</button>
      </div>

      <div class="card">
        <h4 style="font-size:1.05rem; font-weight:700; margin-bottom:8px">👥 Foydalanuvchilarni Ko'rish</h4>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin-bottom:16px">Barcha ro'yxatdan o'tgan foydalanuvchilar va ularning rollari.</p>
        <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('users')">Foydalanuvchilarga o'tish →</button>
      </div>
    </div>
  `;
}

// ── TAB 2: COURSES MANAGEMENT ─────────────────────────────────
function renderAdminCourses(data) {
  const courses = data.courses || [];
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h3 class="section-title" style="margin-bottom:2px">Kurslar Ro'yxati va CRUD Boshqaruvi</h3>
        <p style="color:var(--text-secondary); font-size:0.88rem">Topshiriq 7: POST, PUT, DELETE operatsiyalari faqat admin uchun</p>
      </div>
      <button class="btn btn-primary" onclick="showCourseModal()">+ Yangi kurs qo'shish</button>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Kurs nomi</th>
            <th>Tavsif</th>
            <th>Narxi</th>
            <th>Sana</th>
            <th style="text-align:right">Amallar</th>
          </tr>
        </thead>
        <tbody>
          ${courses.map(c => `
            <tr>
              <td style="font-weight:700; color:var(--text-primary)">${escapeHtml(c.title)}</td>
              <td style="max-width:320px; color:var(--text-secondary); font-size:0.85rem">${escapeHtml(c.description || '-')}</td>
              <td><span class="badge badge-price">\$${Number(c.price).toFixed(2)}</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted)">${new Date(c.createdAt).toLocaleDateString()}</td>
              <td style="text-align:right">
                <div style="display:inline-flex; gap:6px;">
                  <button class="btn btn-secondary btn-sm" onclick='showEditModal(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Tahrirlash</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteCourseAdmin('${c.id}')">O'chirish</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function deleteCourseAdmin(id) {
  if (!confirm('Haqiqatdan ham bu kursni o\'chirmoqchimisiz?')) return;
  const { ok, data } = await api(`/courses/${id}`, { method: 'DELETE' });
  if (ok) {
    toast('Kurs o\'chirildi ✓', 'success');
    await loadAdminTabData();
  } else {
    toast(data.error || 'O\'chirishda xatolik', 'error');
  }
}

// ── TAB 3: USERS MANAGEMENT ───────────────────────────────────
function renderAdminUsers(data) {
  const users = data.users || [];
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h3 class="section-title" style="margin-bottom:2px">Foydalanuvchilar va Rollarni Boshqarish</h3>
        <p style="color:var(--text-secondary); font-size:0.88rem">Topshiriq 2: "user" va "admin" rollari boshqaruvi</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showNewUserModal()">+ Yangi foydalanuvchi</button>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rol</th>
            <th>Foydalanuvchi ID</th>
            <th>Ro'yxatdan o'tgan</th>
            <th style="text-align:right">Ruxsatni o'zgartirish</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td style="font-weight:600">
                ${escapeHtml(u.email)}
                ${u.id === state.user.id ? '<span style="font-size:0.75rem; color:var(--accent-hover); margin-left:6px">(Siz)</span>' : ''}
              </td>
              <td>
                <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span>
              </td>
              <td style="font-family:monospace; font-size:0.78rem; color:var(--text-muted)">${u.id.substring(0, 13)}...</td>
              <td style="font-size:0.82rem; color:var(--text-muted)">${new Date(u.createdAt).toLocaleDateString()}</td>
              <td style="text-align:right">
                <div style="display:inline-flex; gap:6px;">
                  ${u.role === 'admin' ? `
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserRole('${u.id}', 'user')" ${u.id === state.user.id ? 'disabled' : ''}>
                      User qilish
                    </button>
                  ` : `
                    <button class="btn btn-primary btn-sm" onclick="toggleUserRole('${u.id}', 'admin')">
                      Admin qilish
                    </button>
                  `}
                  <button class="btn btn-danger btn-sm" onclick="deleteUserAdmin('${u.id}')" ${u.id === state.user.id ? 'disabled' : ''}>
                    O'chirish
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function toggleUserRole(userId, newRole) {
  const { ok, data } = await api(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role: newRole })
  });

  if (ok) {
    toast(`Foydalanuvchi roli "${newRole}" ga o'zgartirildi ✓`, 'success');
    await loadAdminTabData();
  } else {
    toast(data.error || 'Rolni o\'zgartirishda xatolik', 'error');
  }
}

async function deleteUserAdmin(userId) {
  if (!confirm('Foydalanuvchini o\'chirishni tasdiqlaysizmi?')) return;
  const { ok, data } = await api(`/admin/users/${userId}`, { method: 'DELETE' });
  if (ok) {
    toast('Foydalanuvchi o\'chirildi ✓', 'success');
    await loadAdminTabData();
  } else {
    toast(data.error || 'O\'chirishda xatolik', 'error');
  }
}

function showNewUserModal() {
  showModal('Yangi foydalanuvchi qo\'shish', `
    <form onsubmit="handleCreateUserAdmin(event)">
      <div class="auth-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="newAdminUserEmail" placeholder="user@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Parol</label>
          <input type="password" class="form-input" id="newAdminUserPass" placeholder="Kamida 6 ta belgi" required minlength="6">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor qilish</button>
          <button type="submit" class="btn btn-primary">Yaratish</button>
        </div>
      </div>
    </form>
  `);
}

async function handleCreateUserAdmin(e) {
  e.preventDefault();
  const email = document.getElementById('newAdminUserEmail').value;
  const password = document.getElementById('newAdminUserPass').value;

  const { ok, data } = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (ok) {
    toast('Foydalanuvchi muvaffaqiyatli yaratildi 🎉', 'success');
    closeModal();
    await loadAdminTabData();
  } else {
    toast(data.error || 'Yaratishda xatolik', 'error');
  }
}

// ── TAB 4: API & SECURITY INSPECTOR ───────────────────────────
function renderAdminSecurity(data) {
  // Decode JWT access token to show live payload
  let decodedPayload = {};
  let decodedHeader = {};
  if (state.accessToken) {
    try {
      const parts = state.accessToken.split('.');
      decodedHeader = JSON.parse(atob(parts[0]));
      decodedPayload = JSON.parse(atob(parts[1]));
    } catch (e) {}
  }

  const expDate = decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toLocaleTimeString() : 'Noma\'lum';

  return `
    <h3 class="section-title">🔍 Jonli Token & API Tekshiruvi</h3>
    <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:24px">
      Hozirgi sessiyadagi JWT Access Token va Refresh Token holati.
    </p>

    <!-- JWT Token Visualizer -->
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h4 style="font-weight:700; font-size:1rem">🔑 Hozirgi Access Token (Decoded JWT)</h4>
        <span class="badge badge-user">Muddati: ${expDate} gacha (15 daqiqa)</span>
      </div>

      <div class="jwt-box">
        <div class="jwt-part">
          <span class="jwt-part-title jwt-header">Header (Algoritm & Tur)</span>
          <div style="color:#fda4af">${JSON.stringify(decodedHeader)}</div>
        </div>
        <div class="jwt-part">
          <span class="jwt-part-title jwt-payload">Payload (Foydalanuvchi ma'lumotlari & Rol)</span>
          <div style="color:#d8b4fe">${JSON.stringify(decodedPayload, null, 2)}</div>
        </div>
        <div class="jwt-part">
          <span class="jwt-part-title jwt-signature">Refresh Token (Topshiriq 3)</span>
          <div style="color:#67e8f9">httpOnly Cookie orqali saqlanmoqda (JavaScript orqali o'qib bo'lmaydi - XSS himoyasi)</div>
        </div>
      </div>
    </div>

    <!-- Live API Tester Buttons -->
    <div class="card">
      <h4 style="font-weight:700; font-size:1rem; margin-bottom:12px">⚡ API Endpointlarini Sinash</h4>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
        <button class="btn btn-secondary btn-sm" onclick="runLiveApiTest('/admin/dashboard', 'GET')">
          GET /admin/dashboard
        </button>
        <button class="btn btn-secondary btn-sm" onclick="runLiveApiTest('/auth/refresh', 'POST')">
          POST /auth/refresh
        </button>
        <button class="btn btn-secondary btn-sm" onclick="runLiveApiTest('/profile', 'GET')">
          GET /profile
        </button>
        <button class="btn btn-secondary btn-sm" onclick="runLiveApiTest('/courses', 'GET')">
          GET /courses
        </button>
      </div>

      <div id="liveApiConsole" class="code-box">Tugmalardan birini bosing...</div>
    </div>
  `;
}

async function runLiveApiTest(endpoint, method) {
  const consoleEl = document.getElementById('liveApiConsole');
  consoleEl.innerHTML = `Yuborilmoqda: ${method} ${endpoint}...`;

  const startTime = Date.now();
  const res = await api(endpoint, { method });
  const duration = Date.now() - startTime;

  consoleEl.innerHTML = `[${new Date().toLocaleTimeString()}] ${method} ${endpoint}\nStatus: ${res.status} (${duration}ms)\n\nJavob:\n${JSON.stringify(res.data, null, 2)}`;
}

// ── COURSES (PUBLIC PAGE) ─────────────────────────────────────
async function renderCourses(container) {
  const isAdmin = state.user && state.user.role === 'admin';

  container.innerHTML = `
    <div class="courses-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">EduHub Kurslari</h1>
          <p class="page-subtitle" style="margin-bottom:0">Topshiriq 7: Barcha foydalanuvchilar uchun ochiq (GET /courses)</p>
        </div>
        ${isAdmin ? '<button class="btn btn-primary" onclick="showCourseModal()">+ Kurs qo\'shish</button>' : ''}
      </div>
      <div class="courses-grid" id="coursesGrid">
        ${[1,2,3].map((_, i) => `
          <div class="course-card">
            <div class="course-card-banner ${bannerColors[i % 3]}"></div>
            <div class="course-card-body">
              <div class="skeleton" style="width:70%;height:20px;margin-bottom:12px"></div>
              <div class="skeleton" style="width:100%;height:14px;margin-bottom:6px"></div>
              <div class="skeleton" style="width:85%;height:14px;margin-bottom:24px"></div>
              <div class="skeleton" style="width:80px;height:28px"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <footer class="footer">
      <p>© 2024 <a href="#" onclick="navigate('home')">EduHub</a> — Barcha huquqlar himoyalangan</p>
    </footer>
  `;

  const { ok, data } = await api('/courses');
  if (ok) {
    const grid = document.getElementById('coursesGrid');

    if (data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📭</div>
          <h3>Hozircha kurslar mavjud emas</h3>
          <p>Admin kurs qo'shganda bu yerda paydo bo'ladi.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.map((c, i) => `
      <div class="course-card">
        <div class="course-card-banner ${bannerColors[i % 3]}"></div>
        <div class="course-card-body">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.description)}</p>
          <div class="course-meta">
            <span class="course-price">\$${Number(c.price).toFixed(2)}</span>
            ${isAdmin ? `
              <div class="course-actions">
                <button class="btn btn-secondary btn-sm" onclick='showEditModal(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Tahrirlash</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.id}')">O'chirish</button>
              </div>
            ` : '<button class="btn btn-secondary btn-sm" onclick="toast(\'Kursga yozilish tez orada faollashadi\', \'info\')">Batafsil</button>'}
          </div>
        </div>
      </div>
    `).join('');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ── Course Modals ─────────────────────────────────────────────
function showCourseModal() {
  showModal('Yangi kurs qo\'shish (POST /courses)', `
    <form onsubmit="handleAddCourse(event)">
      <div class="auth-form">
        <div class="form-group">
          <label class="form-label">Kurs nomi</label>
          <input type="text" class="form-input" id="courseTitle" placeholder="Masalan: Flutter & Dart Mobile" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tavsif</label>
          <textarea class="form-input" id="courseDesc" placeholder="Kurs haqida qisqacha ma'lumot..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Narxi (\$)</label>
          <input type="number" class="form-input" id="coursePrice" placeholder="49.99" step="0.01" min="0">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor qilish</button>
          <button type="submit" class="btn btn-primary">Qo'shish</button>
        </div>
      </div>
    </form>
  `);
}

function showEditModal(course) {
  showModal(`Kursni tahrirlash (PUT /courses/${course.id})`, `
    <form onsubmit="handleEditCourse(event, '${course.id}')">
      <div class="auth-form">
        <div class="form-group">
          <label class="form-label">Kurs nomi</label>
          <input type="text" class="form-input" id="editTitle" value="${escapeHtml(course.title)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tavsif</label>
          <textarea class="form-input" id="editDesc">${escapeHtml(course.description)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Narxi (\$)</label>
          <input type="number" class="form-input" id="editPrice" value="${course.price}" step="0.01" min="0">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor qilish</button>
          <button type="submit" class="btn btn-primary">Saqlash</button>
        </div>
      </div>
    </form>
  `);
}

async function handleAddCourse(e) {
  e.preventDefault();
  const { ok, data } = await api('/courses', {
    method: 'POST',
    body: JSON.stringify({
      title: document.getElementById('courseTitle').value,
      description: document.getElementById('courseDesc').value,
      price: parseFloat(document.getElementById('coursePrice').value) || 0
    })
  });

  if (ok) {
    toast('Kurs qo\'shildi! 🎉', 'success');
    closeModal();
    if (state.currentPage === 'admin') {
      await loadAdminTabData();
    } else {
      renderCourses(document.getElementById('app'));
    }
  } else {
    toast(data.error || 'Kurs qo\'shishda xatolik', 'error');
  }
}

async function handleEditCourse(e, id) {
  e.preventDefault();
  const { ok, data } = await api(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: document.getElementById('editTitle').value,
      description: document.getElementById('editDesc').value,
      price: parseFloat(document.getElementById('editPrice').value) || 0
    })
  });

  if (ok) {
    toast('Kurs yangilandi ✓', 'success');
    closeModal();
    if (state.currentPage === 'admin') {
      await loadAdminTabData();
    } else {
      renderCourses(document.getElementById('app'));
    }
  } else {
    toast(data.error || 'Yangilashda xatolik', 'error');
  }
}

async function deleteCourse(id) {
  if (!confirm('Bu kursni o\'chirishni xohlaysizmi?')) return;

  const { ok } = await api(`/courses/${id}`, { method: 'DELETE' });
  if (ok) {
    toast('Kurs o\'chirildi ✓', 'success');
    renderCourses(document.getElementById('app'));
  } else {
    toast('O\'chirishda xatolik', 'error');
  }
}

// ── Modal Helpers ─────────────────────────────────────────────
function showModal(title, content) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  overlay.innerHTML = `<div class="modal"><h2>${title}</h2>${content}</div>`;
  document.body.appendChild(overlay);
}

function closeModal() {
  document.getElementById('modalOverlay')?.remove();
}

// ── Auto-refresh token ───────────────────────────────────────
setInterval(async () => {
  if (state.user) await refreshToken();
}, 13 * 60 * 1000);

// ── Init ──────────────────────────────────────────────────────
(async function init() {
  try {
    const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      state.accessToken = data.accessToken;

      const profileRes = await fetch('/profile', {
        headers: { 'Authorization': `Bearer ${state.accessToken}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        state.user = { id: profile.id, email: profile.email, role: profile.role };
      }
    }
  } catch (e) {}

  render();
})();
