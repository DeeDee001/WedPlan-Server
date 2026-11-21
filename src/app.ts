import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { handleWebhook } from './controllers/payment.controller';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Middleware for CORS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or client url
      if (!origin || origin === ENV.CLIENT_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/testing to prevent CORS issues
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(morgan('dev'));

  // Stripe webhook route needs raw body for signature verification before JSON parsing
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

  // Regular JSON & urlencoded parser for other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  const healthHandler = async (req: Request, res: Response) => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'success' : 'database_disconnected',
      message: isDbConnected
        ? 'WedPlan API Server is running smoothly'
        : 'Server is running but MongoDB is not connected. Please verify MONGODB_URI in Vercel and whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.',
      databaseReadyState: mongoose.connection.readyState,
      dbError: isDbConnected ? null : require('./config/db').lastDbError,
      hasEnvUri: Boolean(process.env.MONGODB_URI),
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);
  app.get('/', healthHandler);

  // Database auto-reconnect middleware for serverless invocations
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
      const ok = await connectDB();
      if (!ok) {
        res.status(503).json({
          success: false,
          message: 'Database connection is not ready. Please verify MONGODB_URI is set in Vercel Project Settings and MongoDB Atlas Network Access allows 0.0.0.0/0.',
          error: require('./config/db').lastDbError
        });
        return;
      }
    }
    next();
  });

  // Mount API routes for both prefixed and direct paths on Vercel
  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
