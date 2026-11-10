import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken as setGlobalAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshExpiresAt, setRefreshExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateToken = (newToken) => {
    setToken(newToken);
    setGlobalAccessToken(newToken);
  };

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      if (res.data.refreshExpiresAt) {
        setRefreshExpiresAt(res.data.refreshExpiresAt);
      }
      return res.data.user;
    } catch (err) {
      setUser(null);
      return null;
    }
  };

  // Dastur ochilganda sessiyani tekshirish (Silent login)
  const checkAuth = useCallback(async () => {
    try {
      // Cookie orqali yangi access token olishga urinish
      const res = await api.post('/auth/refresh');
      const newAccessToken = res.data.accessToken;
      updateToken(newAccessToken);
      if (res.data.refreshExpiresAt) {
        setRefreshExpiresAt(res.data.refreshExpiresAt);
      }

      // Token olingach, foydalanuvchi ma'lumotlarini tortib olamiz
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${newAccessToken}` }
      });
      setUser(meRes.data.user);
      if (meRes.data.refreshExpiresAt) {
        setRefreshExpiresAt(meRes.data.refreshExpiresAt);
      }
    } catch (error) {
      updateToken(null);
      setUser(null);
      setRefreshExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleLogoutEvent = () => {
      updateToken(null);
      setUser(null);
      setRefreshExpiresAt(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);

    const handleRefreshedEvent = (e) => {
      if (e.detail?.token) {
        setToken(e.detail.token);
      }
      if (e.detail?.refreshExpiresAt) {
        setRefreshExpiresAt(e.detail.refreshExpiresAt);
      }
    };

    window.addEventListener('auth:token-refreshed', handleRefreshedEvent);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('auth:token-refreshed', handleRefreshedEvent);
    };
  }, [checkAuth]);

  // Login funksiyasi
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData, refreshExpiresAt: rExp } = res.data;
    updateToken(accessToken);
    setUser(userData);
    if (rExp) {
      setRefreshExpiresAt(rExp);
    }
    return res.data;
  };

  // Register funksiyasi
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  // Logout funksiyasi
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout so\'rovi xatosi:', err);
    } finally {
      updateToken(null);
      setUser(null);
      setRefreshExpiresAt(null);
    }
  };

  const value = {
    user,
    token,
    refreshExpiresAt,
    setRefreshExpiresAt,
    loading,
    login,
    register,
    logout,
    fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
