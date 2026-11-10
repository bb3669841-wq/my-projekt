import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken } from '../api/axios';
import {
  ShieldCheck,
  User,
  Mail,
  Key,
  Clock,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  Terminal,
  LogOut,
  Calendar,
  Lock,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const { user, token, refreshExpiresAt, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);

  // 1. Access Token vaqti (3 daqiqa = 180 soniya)
  const [accessRemaining, setAccessRemaining] = useState(180);
  const [accessExpiresAtDate, setAccessExpiresAtDate] = useState(null);

  // 2. Refresh Token vaqti (7 kun)
  const [refreshRemainingSecs, setRefreshRemainingSecs] = useState(7 * 24 * 3600);
  const [refreshExpiresAtDate, setRefreshExpiresAtDate] = useState(null);

  // Log qo'shish
  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, message, type }, ...prev.slice(0, 8)]);
  };

  // Access Token exp vaqtini o'qish
  useEffect(() => {
    if (!token) return;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const expTimeMs = decodedPayload.exp * 1000;
      setAccessExpiresAtDate(new Date(expTimeMs));

      const updateAccessCountdown = () => {
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((expTimeMs - now) / 1000));
        setAccessRemaining(diffSeconds);
      };

      updateAccessCountdown();
      const interval = setInterval(updateAccessCountdown, 1000);
      return () => clearInterval(interval);
    } catch (e) {
      console.error('Access token dekodlash xatosi:', e);
    }
  }, [token]);

  // Refresh Token exp vaqtini o'qish
  useEffect(() => {
    // Agar refreshExpiresAt bo'lmasa, 7 kunlik standart vaqt qo'yamiz
    const targetMs = refreshExpiresAt || (Date.now() + 7 * 24 * 3600 * 1000);
    setRefreshExpiresAtDate(new Date(targetMs));

    const updateRefreshCountdown = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((targetMs - now) / 1000));
      setRefreshRemainingSecs(diffSeconds);
    };

    updateRefreshCountdown();
    const interval = setInterval(updateRefreshCountdown, 1000);
    return () => clearInterval(interval);
  }, [refreshExpiresAt]);

  // Vaqtni chiroyli formatlash: 02:45
  const formatAccessTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Refresh token formatlash: X kun, HH:MM:SS
  const formatRefreshTime = (totalSeconds) => {
    if (totalSeconds <= 0) return 'Muddati tugadi';
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours: hours < 10 ? `0${hours}` : hours,
      minutes: minutes < 10 ? `0${minutes}` : minutes,
      seconds: seconds < 10 ? `0${seconds}` : seconds
    };
  };

  // 1. Himoyalangan API ga so'rov yuborish
  const handleTestProtectedEndpoint = async () => {
    try {
      setLoadingReq(true);
      addLog("GET /api/auth/me so'rovi yuborilmoqda...", 'info');
      const res = await api.get('/auth/me');
      addLog(`200 OK: Muvaffaqiyatli! User: ${res.data.user.name}`, 'success');
    } catch (err) {
      addLog(`Xatolik: ${err.response?.status || err.message}`, 'error');
    } finally {
      setLoadingReq(false);
    }
  };

  // 2. Silent Refresh interceptorini test qilish (Access tokenni sun'iy ravishda buzish)
  const handleTamperToken = () => {
    setAccessToken('fake_corrupted_expired_token_123');
    setAccessRemaining(0);
    addLog(
      "Access token xotirada buzildi (tampered)! Endi 'Himoyalangan API ni chaqirish' tugmasini bosing.",
      'warning'
    );
  };

  // 3. Qo'lda yangi token so'rash
  const handleManualRefresh = async () => {
    try {
      setLoadingReq(true);
      addLog("POST /api/auth/refresh so'rovi yuborilmoqda...", 'info');
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.accessToken);
      addLog('Yangi 3 daqiqalik Access token qabul qilindi!', 'success');
    } catch (err) {
      addLog(`Refresh xatoligi: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoadingReq(false);
    }
  };

  const refreshTimeObj = formatRefreshTime(refreshRemainingSecs);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Sarlavha */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Himoyalangan Sessiya
            </span>
            <span className="text-slate-500 text-sm">• Real-vaqt Taymerlari Faol</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">Boshqaruv Paneli (Dashboard)</h1>
          <p className="text-slate-400 text-sm mt-1">
            Xush kelibsiz, <span className="text-teal-400 font-semibold">{user?.name}</span>! Access va Refresh tokenlarning qachon tugashini quyida jonli kuzatishingiz mumkin.
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Chiqish (Logout)</span>
        </button>
      </div>

      {/* 2 TA ASOSIY TAYMER KARTALARI (ACCESS TOKEN & REFRESH TOKEN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* 1-KARTA: ACCESS TOKEN TAYMERI */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-teal-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Muddati: 3 Daqiqa</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Access Token Taymeri</h3>
              </div>
            </div>

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              accessRemaining > 30 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20 animate-bounce'
            }`}>
              {accessRemaining > 30 ? 'Faol' : 'Tugamoqda!'}
            </span>
          </div>

          {/* Katta raqamli taymer */}
          <div className="my-6 text-center py-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium mb-1">Qolgan aniq vaqt:</div>
            <div className={`text-5xl font-extrabold font-mono tracking-wider ${
              accessRemaining < 30 ? 'text-red-400' : accessRemaining < 90 ? 'text-amber-400' : 'text-teal-400'
            }`}>
              {formatAccessTime(accessRemaining)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              (daqiqa : soniya)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress (180 soniya)</span>
              <span>{Math.round((accessRemaining / 180) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  accessRemaining < 30
                    ? 'bg-red-500'
                    : accessRemaining < 90
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (accessRemaining / 180) * 100)}%` }}
              />
            </div>
          </div>

          {/* Qo'shimcha Tafsilotlar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              Tugash vaqti:
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {accessExpiresAtDate ? accessExpiresAtDate.toLocaleTimeString() : 'Yuklanmoqda...'}
            </span>
          </div>
        </div>

        {/* 2-KARTA: REFRESH TOKEN TAYMERI */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Muddati: 7 Kun (1 Hafta)</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Refresh Token Taymeri</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" /> HttpOnly Cookie
            </span>
          </div>

          {/* 4 qismli blok taymer (Kun, Soat, Daqiqa, Soniya) */}
          <div className="my-6 grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                {refreshTimeObj.days}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Kun</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                {refreshTimeObj.hours}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Soat</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                {refreshTimeObj.minutes}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Daqiqa</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 animate-pulse">
                {refreshTimeObj.seconds}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Soniya</div>
            </div>
          </div>

          {/* Progress Bar (7 kun = 604800 soniya) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Haftalik Saqlanish</span>
              <span>{Math.round((refreshRemainingSecs / (7 * 24 * 3600)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, (refreshRemainingSecs / (7 * 24 * 3600)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Qo'shimcha Tafsilotlar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Tugash sanasi va soati:
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {refreshExpiresAtDate ? refreshExpiresAtDate.toLocaleDateString() + ' ' + refreshExpiresAtDate.toLocaleTimeString() : 'Yuklanmoqda...'}
            </span>
          </div>
        </div>

      </div>

      {/* PASTI: PROFIL MA'LUMOTLARI VA TEST QILISH VOSITALARI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Profil kartasi */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/70 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Profil Ma'lumotlari</h3>
              <p className="text-xs text-slate-400">Bazada saqlangan foydalanuvchi</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">To'liq ism</div>
              <div className="text-white font-semibold mt-0.5">{user?.name}</div>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Email manzil</div>
              <div className="text-white font-semibold mt-0.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email}
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Foydalanuvchi ID si</div>
              <div className="text-xs font-mono text-slate-300 mt-1 break-all bg-slate-950 p-2 rounded border border-slate-800">
                {user?.id || user?._id}
              </div>
            </div>
          </div>
        </div>

        {/* Sinov va Silent Refresh Testi */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Silent Refresh Testi</h3>
                <p className="text-xs text-slate-400">Interceptor va taymer yangilanishi</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTestProtectedEndpoint}
                disabled={loadingReq}
                className="w-full py-2.5 px-4 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Himoyalangan API ni chaqirish (/me)
              </button>

              <button
                onClick={handleTamperToken}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                title="Tokenni 0 ga tushiradi va buzadi"
              >
                <AlertTriangle className="w-4 h-4" />
                Access Tokenni buzish (Tamper)
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={loadingReq}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tokenni qo'lda yangilash (/refresh)
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/80 text-[11px] text-slate-400">
            <b>Tajriba:</b> "Tokenni buzish" tugmasini bosing — yuqoridagi 3 daqiqalik hisoblagich 0 bo'ladi. Keyin "Himoyalangan API ni chaqirish" tugmasini bosing: interceptor orqa fonda tokenni yangilaydi va taymer yana 03:00 dan hisoblashni boshlaydi!
          </div>
        </div>

        {/* Jonli Loglar Konsoli */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span>Axios So'rovlar Logi</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Tozalash
            </button>
          </div>

          <div className="font-mono text-xs space-y-2 flex-1 overflow-y-auto max-h-[220px]">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Hozircha amallar yo'q. Tugmalarni bosing...</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'warning'
                      ? 'text-amber-400'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
