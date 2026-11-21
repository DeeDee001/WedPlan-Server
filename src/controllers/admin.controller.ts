import { Response } from 'express';
import { User } from '../models/user.model';
import { Service } from '../models/service.model';
import { Transaction } from '../models/transaction.model';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Get Admin Dashboard Overview Statistics
 */
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalVendors,
      totalCustomers,
      totalServices,
      pendingServices,
      totalTransactions,
      transactionsRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'customer' }),
      Service.countDocuments(),
      Service.countDocuments({ status: 'pending' }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalVendors,
        totalCustomers,
        totalServices,
        pendingServices,
        totalTransactions,
        totalRevenue: transactionsRevenue[0]?.total || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get all users with search and role filter
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { businessName: searchRegex }];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const pageSize = parseInt(limit as string, 10) || 20;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      users
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Block or Unblock a user
 */
export const toggleBlockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Protect against self-blocking admin
    if (user._id.toString() === req.user!.id) {
      res.status(400).json({ success: false, message: 'Admins cannot block their own account.' });
      return;
    }

    user.isBlocked = typeof isBlocked === 'boolean' ? isBlocked : !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get all services for moderation (Admin)
 */
export const getAllAdminServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ serviceName: searchRegex }, { description: searchRegex }, { location: searchRegex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const pageSize = parseInt(limit as string, 10) || 20;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('vendorId', 'name email businessName image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Service.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      services
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Update service approval status (Approve, Reject, or set status)
 */
export const updateServiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'active', 'inactive'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid service status provided.' });
      return;
    }

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    service.status = status;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service status updated to ${status}.`,
      service
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Admin: Get all platform transactions (Read-only)
 */
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageSize = parseInt(limit as string, 10) || 20;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('vendorId', 'name email businessName image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Transaction.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      transactions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
