import { Router } from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  verifySession
} from '../controllers/payment.controller';
import { verifyAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Stripe checkout session creation (Vendor only)
router.post('/create-checkout-session', verifyAuth, requireRole(['vendor']), createCheckoutSession);

// Session verification endpoint
router.get('/verify-session/:sessionId', verifyAuth, requireRole(['vendor', 'admin']), verifySession);

// Webhook endpoint (Public, called by Stripe)
router.post('/webhook', handleWebhook);

export default router;
