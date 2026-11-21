import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    if (!ENV.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI is not set in environment variables.');
      return;
    }
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // Don't kill process immediately to allow server to provide health status
  }
};
