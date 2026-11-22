import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedplan',
  JWT_SECRET: process.env.JWT_SECRET || 'wedplan_jwt_secret_key_change_in_production_2026',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'wedplan_jwt_secret_key_change_in_production_2026',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@wedplan.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ''
};
