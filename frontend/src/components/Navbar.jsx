import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, LayoutDashboard, Clock, Key } from 'lucide-react';

const Navbar = () => {
  const { user, token, refreshExpiresAt, logout } = useAuth();
  const navigate = useNavigate();

  const [accessSecs, setAccessSecs] = useState(180);
  const [refreshSecs, setRefreshSecs] = useState(7 * 24 * 3600);

  // Access Token hisoblagichi
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const update = () => {
        const diff = Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000));
        setAccessSecs(diff);
      };
      update();
      const intv = setInterval(update, 1000);
      return () => clearInterval(intv);
    } catch (e) {}
  }, [token]);

  // Refresh Token hisoblagichi
  useEffect(() => {
    if (!user) return;
    const targetMs = refreshExpiresAt || (Date.now() + 7 * 24 * 3600 * 1000);
    const update = () => {
      const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setRefreshSecs(diff);
    };
    update();
    const intv = setInterval(update, 1000);
    return () => clearInterval(intv);
  }, [refreshExpiresAt, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatMins = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDaysHours = (secs) => {
    const d = Math.floor(secs / (24 * 3600));
    const h = Math.floor((secs % (24 * 3600)) / 3600);
    return `${d}k ${h}s`;
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logotip */}
          <Link to="/" className="flex items-center gap-2 text-teal-400 font-bold text-xl tracking-tight">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <span>Secure<span className="text-white">Auth</span></span>
          </Link>

          {/* Menyu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Navbar mini token taymerlari */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-teal-400" title="Access Token muddati (3 daqiqa)">
                    <Clock className="w-3.5 h-3.5" />
                    <span>AT: <b>{formatMins(accessSecs)}</b></span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1.5 text-cyan-400" title="Refresh Token muddati (7 kun)">
                    <Key className="w-3.5 h-3.5" />
                    <span>RT: <b>{formatDaysHours(refreshSecs)}</b></span>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-slate-200">
                  <UserIcon className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-slate-100 max-w-[100px] truncate">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Chiqish</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Kirish
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-lg shadow-teal-500/20 font-semibold transition"
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
