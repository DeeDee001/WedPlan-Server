import { Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/booking.model';
import { Service } from '../models/service.model';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Submit a booking request (Customer only)
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceId, eventDate, eventLocation, message } = req.body;
    const customerId = req.user!.id;
    const customerRole = req.user!.role;

    if (customerRole !== 'customer') {
      res.status(403).json({
        success: false,
        message: 'Only customers can submit service booking requests.'
      });
      return;
    }

    if (!serviceId || !eventDate || !eventLocation) {
      res.status(400).json({
        success: false,
        message: 'Service ID, event date, and event location are required.'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      res.status(404).json({ success: false, message: 'Invalid service ID.' });
      return;
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({ success: false, message: 'Wedding service not found.' });
      return;
    }

    if (!['approved', 'active'].includes(service.status)) {
      res.status(400).json({
        success: false,
        message: 'This service is currently unavailable for booking.'
      });
      return;
    }

    // Rule: Prevent vendors from booking their own services
    if (service.vendorId.toString() === customerId) {
      res.status(400).json({
        success: false,
        message: 'You cannot book your own service.'
      });
      return;
    }

    // Rule: Prevent duplicate active booking requests for same service and event date
    const existingBooking = await Booking.findOne({
      serviceId,
      eventDate,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingBooking) {
      res.status(409).json({
        success: false,
        message: 'A booking request for this service on the selected event date already exists.'
      });
      return;
    }

    const newBooking = await Booking.create({
      serviceId,
      vendorId: service.vendorId,
      customerId,
      eventDate,
      eventLocation,
      message: message || '',
      status: 'pending'
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('serviceId', 'serviceName category price images')
      .populate('vendorId', 'name email businessName image');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully.',
      booking: populatedBooking
    });
  } catch (error: any) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get all booking requests for the logged in customer
 */
export const getCustomerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;

    const bookings = await Booking.find({ customerId })
      .populate('serviceId', 'serviceName category price location images')
      .populate('vendorId', 'name email businessName image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Cancel a pending booking request (Customer only)
 */
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Invalid booking ID.' });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Rule: Customer cannot cancel another customer's booking
    if (booking.customerId.toString() !== customerId) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot cancel another user\'s booking.' });
      return;
    }

    // Rule: Customer cannot cancel an already accepted, rejected, or cancelled booking
    if (booking.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that has already been ${booking.status}. Only pending requests can be cancelled.`
      });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking request has been cancelled.',
      booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get all booking requests for logged in vendor's services
 */
export const getVendorBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.user!.id;

    const bookings = await Booking.find({ vendorId })
      .populate('serviceId', 'serviceName category price location images')
      .populate('customerId', 'name email image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Update booking status: Accept or Reject (Vendor only)
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user!.id;

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected".'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Invalid booking ID.' });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found.' });
      return;
    }

    // Rule: Vendors cannot modify booking requests belonging to other vendors
    if (booking.vendorId.toString() !== vendorId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only manage bookings for your own services.'
      });
      return;
    }

    // Rule: Only pending requests can be accepted or rejected; once processed, cannot be changed
    if (booking.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `This booking is already marked as ${booking.status} and cannot be processed again.`
      });
      return;
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking request has been ${status}.`,
      booking
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
