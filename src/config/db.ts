import mongoose from 'mongoose';
import { ENV } from './env';

// Disable query buffering so disconnected queries fail fast with clear messages
mongoose.set('bufferCommands', false);

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || ENV.MONGODB_URI;

  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ MONGODB_URI is missing or pointing to localhost in Vercel environment variables.');
      return false;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};
