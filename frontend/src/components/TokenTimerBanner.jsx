import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Key, ShieldCheck, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';

const TokenTimerBanner = () => {
  const { user, token, refreshExpiresAt } = useAuth();

  const [accessRemaining, setAccessRemaining] = useState(180); // 3 daqiqa
  const [refreshRemaining, setRefreshRemaining] = useState(7 * 24 * 3600); // 7 kun
  const [isRefreshing, setIsRefreshing] = useState(false);


  useEffect(() => {
    if (!token) {
      setAccessRemaining(180);
      return;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const expMs = payload.exp * 1000;

      const tick = () => {
        const diff = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
        setAccessRemaining(diff);
      };

      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    } catch (e) {
      console.error('Token dekodlashda xato:', e);
    }
  }, [token]);

  // 2. Refresh Token hisoblagichi (7 kun)
  useEffect(() => {
    if (!user) {
      setRefreshRemaining(7 * 24 * 3600);
      return;
    }

    const targetMs = refreshExpiresAt || (Date.now() + 7 * 24 * 3600 * 1000);
    const tick = () => {
      const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setRefreshRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [refreshExpiresAt, user]);

  const formatAccess = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRefresh = (totalSecs) => {
    const days = Math.floor(totalSecs / (24 * 3600));
    const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${days} kun ${hours}s ${minutes < 10 ? '0' : ''}${minutes}d ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

  // Sinov uchun Access tokenni qo'lda buzish
  const handleTamper = () => {
    setAccessToken('corrupted_invalid_token_test');
    setAccessRemaining(0);
  };

  // Qo'lda yangilash
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await api.post('/auth/refresh');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-teal-500/30 px-4 py-2.5 shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">

        {/* Chap qism: Sarlavha / Status */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            JWT Token Monitor:
          </span>
          {user ? (
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Sessiya Faol ({user.name})
            </span>
          ) : (
            <span className="text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Tizimga kirmagansiz (Login qiling)
            </span>
          )}
        </div>

        {/* O'rta qism: 2 TA JONLI TAYMER */}
        <div className="flex items-center flex-wrap gap-4">

          {/* 1. ACCESS TOKEN TAYMERI */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-teal-500/40 px-3 py-1.5 rounded-xl shadow-inner">
            <Clock className={`w-4 h-4 ${accessRemaining < 30 ? 'text-red-400 animate-bounce' : 'text-teal-400'}`} />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Access Token (3 min):</span>
              <span className={`font-mono font-bold text-sm leading-tight ${!user
                  ? 'text-slate-500'
                  : accessRemaining < 30
                    ? 'text-red-400 animate-pulse'
                    : 'text-teal-300'
                }`}>
                {user ? formatAccess(accessRemaining) : '03:00 (Kutilmoqda)'}
              </span>
            </div>
            {user && (
              <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1 hidden sm:block">
                <div
                  className={`h-full transition-all duration-1000 ${accessRemaining < 30 ? 'bg-red-500' : 'bg-teal-400'
                    }`}
                  style={{ width: `${Math.min(100, (accessRemaining / 180) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* 2. REFRESH TOKEN TAYMERI */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-inner">
            <Key className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Refresh Token (7 kun):</span>
              <span className={`font-mono font-bold text-sm leading-tight ${!user ? 'text-slate-500' : 'text-cyan-300'
                }`}>
                {user ? formatRefresh(refreshRemaining) : '7 kun (Kutilmoqda)'}
              </span>
            </div>
          </div>

        </div>

        {/* O'ng qism: Qo'shimcha tezkor harakatlar (agar kirgan bo'lsa) */}
        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTamper}
              title="Tokenni 0 ga tushirib buzish (Silent Refresh avtomatik ishlashini sinash uchun)"
              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Tokenni buzish
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Tokenni yangilash (/refresh)"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TokenTimerBanner;
