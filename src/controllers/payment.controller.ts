import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ENV } from '../config/env';
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';
import { AuthRequest } from '../middlewares/auth.middleware';

const getStripe = (): Stripe | null => {
  if (!ENV.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(ENV.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any
  });
};

/**
 * Create Stripe Checkout Session for Premium Vendor Upgrade
 */
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.user!.id;
    const vendor = await User.findById(vendorId);

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found.' });
      return;
    }

    if (vendor.role !== 'vendor') {
      res.status(403).json({ success: false, message: 'Only vendors can purchase a vendor premium subscription.' });
      return;
    }

    if (vendor.subscriptionPlan === 'premium') {
      res.status(400).json({ success: false, message: 'You already have an active Premium subscription.' });
      return;
    }

    const stripe = getStripe();
    if (!stripe) {
      // In development when STRIPE_SECRET_KEY is not yet set
      res.status(500).json({
        success: false,
        message: 'Stripe is not configured yet. Please configure STRIPE_SECRET_KEY in server environment variables.'
      });
      return;
    }

    const clientUrl = ENV.CLIENT_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'WedPlan Vendor Premium Subscription',
              description: 'Publish unlimited wedding services, premium vendor badge, and priority customer placement.'
            },
            unit_amount: 4900 // $49.00 USD
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: vendor.email,
      client_reference_id: vendor._id.toString(),
      metadata: {
        vendorId: vendor._id.toString(),
        plan: 'premium'
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('Create Checkout Session Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Handle Stripe Webhook Events
 * Webhook must verify signature using raw body and STRIPE_WEBHOOK_SECRET
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(500).send('Stripe is not configured.');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = ENV.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Fallback in test mode if webhook secret is not set
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const vendorId = session.metadata?.vendorId || session.client_reference_id;

    if (vendorId) {
      try {
        // Upgrade vendor subscription
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

        await User.findByIdAndUpdate(vendorId, {
          subscriptionPlan: 'premium',
          subscriptionExpiresAt: expiryDate
        });

        // Record or update transaction in transactions collection
        await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            vendorId,
            plan: 'premium',
            amount: (session.amount_total || 4900) / 100,
            currency: session.currency || 'usd',
            stripeSessionId: session.id,
            status: 'completed'
          },
          { upsert: true, new: true }
        );

        console.log(`🎉 Premium subscription activated for vendor ${vendorId}`);
      } catch (err) {
        console.error('Error processing checkout.session.completed:', err);
      }
    }
  }

  res.status(200).json({ received: true });
};

/**
 * Verify checkout session directly from Stripe (Server-verified confirmation)
 */
export const verifySession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const vendorId = req.user!.id;

    const stripe = getStripe();
    if (!stripe) {
      res.status(400).json({ success: false, message: 'Stripe is not configured.' });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const sessionVendorId = session.metadata?.vendorId || session.client_reference_id;

      if (sessionVendorId === vendorId || req.user!.role === 'admin') {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await User.findByIdAndUpdate(vendorId, {
          subscriptionPlan: 'premium',
          subscriptionExpiresAt: expiryDate
        });

        const transaction = await Transaction.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            vendorId,
            plan: 'premium',
            amount: (session.amount_total || 4900) / 100,
            currency: session.currency || 'usd',
            stripeSessionId: session.id,
            status: 'completed'
          },
          { upsert: true, new: true }
        );

        res.status(200).json({
          success: true,
          message: 'Payment verified and Premium subscription activated.',
          transaction
        });
        return;
      }
    }

    res.status(400).json({
      success: false,
      message: 'Payment has not been completed or verified yet.'
    });
  } catch (error: any) {
    console.error('Verify Session Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
