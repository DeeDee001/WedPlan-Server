import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';

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

  // Stripe webhook route needs raw body for signature verification
  // Mounted before express.json()
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

  // Regular JSON & urlencoded parser for other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'WedPlan API Server is running smoothly',
      timestamp: new Date().toISOString()
    });
  });

  return app;
};
