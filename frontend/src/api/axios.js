import axios from 'axios';

// Backend asosiy manzili
const API_URL = 'http://localhost:5000/api';

// Asosiy Axios namunasi
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // HttpOnly cookielarni (Refresh token) avtomatik yuborish va qabul qilish
});

// Xotiradagi (in-memory) Access Tokenni boshqarish
let memoryToken = null;

export const setAccessToken = (token) => {
  memoryToken = token;
};

export const getAccessToken = () => {
  return memoryToken;
};

// Navbat (Queue) mexanizmi: bir vaqtning o'zida bir nechta so'rov 401 berganda kutib turish uchun
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 1. Request Interceptor: Har bir so'rovga Access Tokenni biriktirish
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: 401 xatolikda Silent Refresh qilish
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Agar xatolik 401 bo'lmasa yoki so'rov allaqachon qayta urinilgan bo'lsa
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Refresh va login so'rovlarining o'zi 401 bo'lsa, qayta urinmaslik (infinite loop oldini olish)
    if (
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // Agar allaqachon refresh jarayoni ketayotgan bo'lsa, navbatga yozilib kutib turamiz
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token orqali yangi Access token so'raymiz
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data.accessToken;

      // Xotiradagi tokenni yangilaymiz
      setAccessToken(newAccessToken);

      // Token yangilanganligi haqida hodisa tarqatamiz (taymerlar yangilanishi uchun)
      window.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: {
            token: newAccessToken,
            refreshExpiresAt: response.data.refreshExpiresAt
          }
        })
      );

      // Kutilayotgan so'rovlarni yangi token bilan bo'shatamiz
      processQueue(null, newAccessToken);

      // Dastlabki 401 olgan so'rovni yangi token bilan qayta yuboramiz
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token ham eskirgan bo'lsa yoki yaroqsiz bo'lsa
      processQueue(refreshError, null);
      setAccessToken(null);

      // Tizimdan chiqarish hodisasini yuboramiz (AuthContext buni ushlab oladi)
      window.dispatchEvent(new Event('auth:logout'));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

