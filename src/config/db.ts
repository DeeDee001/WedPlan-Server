import mongoose from 'mongoose';
import { ENV } from './env';

// Disable query buffering so disconnected queries fail fast with clear messages
mongoose.set('bufferCommands', false);

let isConnected = false;
export let lastDbError: string | null = null;

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    lastDbError = null;
    return true;
  }

  if (mongoose.connection.readyState === 2) {
    try {
      await mongoose.connection.asPromise();
      const state = mongoose.connection.readyState as number;
      isConnected = state === 1;
      return isConnected;
    } catch (e: any) {
      lastDbError = e?.message || 'Error waiting for MongoDB connection';
      return false;
    }
  }

  const uri = process.env.MONGODB_URI || ENV.MONGODB_URI;

  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    lastDbError = 'MONGODB_URI is missing or pointing to localhost. Please set MONGODB_URI in Vercel Environment Variables.';
    console.error('⚠️ ' + lastDbError);
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    lastDbError = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    lastDbError = error?.message || 'Unknown MongoDB connection error';
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};
