import { Router } from 'express';
import {
  createBooking,
  getCustomerBookings,
  cancelBooking,
  getVendorBookings,
  updateBookingStatus
} from '../controllers/booking.controller';
import { verifyAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Customer booking routes
router.post('/', verifyAuth, requireRole(['customer']), createBooking);
router.get('/customer', verifyAuth, requireRole(['customer']), getCustomerBookings);
router.patch('/:id/cancel', verifyAuth, requireRole(['customer']), cancelBooking);

// Vendor booking routes
router.get('/vendor', verifyAuth, requireRole(['vendor']), getVendorBookings);
router.patch('/:id/status', verifyAuth, requireRole(['vendor']), updateBookingStatus);

export default router;
