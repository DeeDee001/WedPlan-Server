import { Response } from 'express';
import { User } from '../models/user.model';
import { Service } from '../models/service.model';
import { Booking } from '../models/booking.model';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Get Vendor Dashboard Metrics
 */
export const getVendorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.user!.id;

    const [
      vendor,
      totalServices,
      activeServices,
      pendingBookings,
      acceptedBookings
    ] = await Promise.all([
      User.findById(vendorId).select('subscriptionPlan subscriptionExpiresAt name businessName email image'),
      Service.countDocuments({ vendorId }),
      Service.countDocuments({ vendorId, status: { $in: ['approved', 'active'] } }),
      Booking.countDocuments({ vendorId, status: 'pending' }),
      Booking.countDocuments({ vendorId, status: 'accepted' })
    ]);

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      stats: {
        totalServices,
        activeServices,
        pendingBookings,
        acceptedBookings,
        subscriptionPlan: vendor.subscriptionPlan,
        subscriptionExpiresAt: vendor.subscriptionExpiresAt,
        vendorInfo: {
          name: vendor.name,
          businessName: vendor.businessName,
          email: vendor.email,
          image: vendor.image
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get Customer Dashboard Metrics
 */
export const getCustomerDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;

    const [
      totalBookings,
      pendingBookings,
      acceptedBookings,
      rejectedBookings
    ] = await Promise.all([
      Booking.countDocuments({ customerId }),
      Booking.countDocuments({ customerId, status: 'pending' }),
      Booking.countDocuments({ customerId, status: 'accepted' }),
      Booking.countDocuments({ customerId, status: 'rejected' })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        acceptedBookings,
        rejectedBookings
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
