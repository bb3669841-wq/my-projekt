import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // 10 soniya kutib buffering bo'lib qolmasligi uchun
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth_system', {
      serverSelectionTimeoutMS: 2000 // Agar MongoDB yoqilmagan bo'lsa, tezda aniqlash
    });
    console.log(`[MongoDB] Ulanish muvaffaqiyatli: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB OGOHLANTIRISH] Mahalliy MongoDB ulanmadi (${error.message}).`);
    console.log(`[Smart Storage] Avtomatik ravishda Xavfsiz Lokal Baza (Local JSON Store) rejimiga o'tildi.`);
  }
};
