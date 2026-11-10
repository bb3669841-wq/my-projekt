import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, RefreshCw, Key, ArrowRight } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-8">
        <ShieldCheck className="w-4 h-4" />
        Zamonaviy JWT Arxitekturasi
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
        Xavfsiz va To'liq <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">JWT Autentifikatsiya</span> Tizimi
      </h1>

      <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl">
        Node.js (Express), MongoDB, React (Vite) va Tailwind CSS asosida qurilgan. 
        3 daqiqalik Access Token, 1 haftalik HttpOnly Cookie Refresh Token va avtomatik Silent Refresh (Axios Interceptor) bilan to'liq jihozlangan.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {user ? (
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <span>Dashboardga o'tish</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <span>Tizimga kirish</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold transition"
            >
              Ro'yxatdan o'tish
            </Link>
          </>
        )}
      </div>

      {/* Texnologik xususiyatlar kartalari */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-20 text-left">
        <div className="p-6 bg-slate-800/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Bcrypt Parol Shifrlash</h3>
          <p className="text-slate-400 text-sm mt-2">
            Foydalanuvchi parollari ma'lumotlar bazasida 10 tuzli salt bilan xeshlangan holda xavfsiz saqlanadi.
          </p>
        </div>

        <div className="p-6 bg-slate-800/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">HttpOnly Cookie</h3>
          <p className="text-slate-400 text-sm mt-2">
            Refresh token brauzerning HttpOnly kuki xotirasida saqlanadi, bu esa XSS hujumlaridan to'liq himoya qiladi.
          </p>
        </div>

        <div className="p-6 bg-slate-800/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Silent Refresh Interceptor</h3>
          <p className="text-slate-400 text-sm mt-2">
            Access token har 3 daqiqada tugaganda Axios interceptor foydalanuvchini chalg'itmasdan yangilab turadi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

