import { Router } from 'express';
import authRoutes from './auth.routes';
import serviceRoutes from './service.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

export default router;
