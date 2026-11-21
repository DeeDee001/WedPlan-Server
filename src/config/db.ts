import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || ENV.MONGODB_URI;

  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ MONGODB_URI is not configured in Vercel environment variables.');
      return;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging serverless function
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};
