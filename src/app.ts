import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
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
  const healthHandler = (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'WedPlan API Server is running smoothly',
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);
  app.get('/', healthHandler);

  // Mount API routes for both prefixed and direct paths on Vercel
  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
