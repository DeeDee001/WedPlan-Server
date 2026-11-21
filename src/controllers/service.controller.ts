import { Response } from 'express';
import mongoose from 'mongoose';
import { Service, ServiceStatus } from '../models/service.model';
import { User } from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Free plan limit
const FREE_PLAN_SERVICE_LIMIT = 3;

/**
 * Create a new service (Vendor only)
 */
export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { serviceName, category, description, price, location, images, image } = req.body;
    const vendorId = req.user!.id;

    if (!serviceName || !category || !description || price === undefined || !location) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceName, category, description, price, and location are required.'
      });
      return;
    }

    const vendor = await User.findById(vendorId);
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor account not found.' });
      return;
    }

    // Check free plan limit (max 3 active or approved services)
    if (vendor.subscriptionPlan !== 'premium') {
      const activeCount = await Service.countDocuments({
        vendorId,
        status: { $in: ['approved', 'active', 'pending'] }
      });

      if (activeCount >= FREE_PLAN_SERVICE_LIMIT) {
        res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          message: `Free plan is limited to ${FREE_PLAN_SERVICE_LIMIT} services. Please upgrade to Premium to publish unlimited services.`
        });
        return;
      }
    }

    // Process images (handle array or single string)
    let imageList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      imageList = images;
    } else if (typeof image === 'string' && image) {
      imageList = [image];
    } else if (typeof images === 'string' && images) {
      imageList = [images];
    }

    const newService = await Service.create({
      vendorId,
      serviceName,
      category,
      description,
      price: Number(price),
      location,
      images: imageList,
      status: 'pending' // pending until approved by admin
    });

    res.status(201).json({
      success: true,
      message: 'Service submitted successfully and is awaiting admin approval.',
      service: newService
    });
  } catch (error: any) {
    console.error('Create Service Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get services of the logged in vendor
 */
export const getVendorServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.user!.id;
    const services = await Service.find({ vendorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Update a service (Vendor owner only)
 */
export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vendorId = req.user!.id;
    const { serviceName, category, description, price, location, images, image, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Invalid service ID.' });
      return;
    }

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    // Check ownership
    if (service.vendorId.toString() !== vendorId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to modify this service.' });
      return;
    }

    if (serviceName) service.serviceName = serviceName;
    if (category) service.category = category;
    if (description) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (location) service.location = location;

    if (Array.isArray(images)) {
      service.images = images;
    } else if (image) {
      service.images = [image];
    }

    // Vendor can toggle active/inactive if already approved
    if (status && ['active', 'inactive'].includes(status) && service.status !== 'pending' && service.status !== 'rejected') {
      service.status = status as ServiceStatus;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      service
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Delete a service (Vendor owner or Admin)
 */
export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Invalid service ID.' });
      return;
    }

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    // Check ownership or admin
    if (service.vendorId.toString() !== userId && userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot delete another vendor\'s service.' });
      return;
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Public: Get approved & active services with search, filter, and sorting
 */
export const getPublicServices = async (req: any, res: Response): Promise<void> => {
  try {
    const { search, category, location, sort, limit = 20, page = 1 } = req.query;

    const query: any = {
      status: { $in: ['approved', 'active'] }
    };

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { serviceName: searchRegex },
        { description: searchRegex }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (location && location !== 'All') {
      query.location = new RegExp(location as string, 'i');
    }

    // Sorting: price_asc, price_desc, newest
    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    }

    const pageSize = parseInt(limit as string, 10) || 20;
    const currentPage = parseInt(page as string, 10) || 1;
    const skip = (currentPage - 1) * pageSize;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('vendorId', 'name email image businessName subscriptionPlan')
        .sort(sortOption)
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
    console.error('Get Public Services Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Public: Get Featured Services for Homepage (at least 6 approved & active services)
 */
export const getFeaturedServices = async (req: any, res: Response): Promise<void> => {
  try {
    const services = await Service.find({
      status: { $in: ['approved', 'active'] }
    })
      .populate('vendorId', 'name email image businessName subscriptionPlan')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      services
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

/**
 * Get Service Details by ID
 */
export const getServiceById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Service not found with the provided ID.' });
      return;
    }

    const service = await Service.findById(id).populate(
      'vendorId',
      'name email image businessName subscriptionPlan'
    );

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found with the provided ID.' });
      return;
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
