import { Router } from 'express';
import {
  createService,
  getVendorServices,
  updateService,
  deleteService,
  getPublicServices,
  getFeaturedServices,
  getServiceById
} from '../controllers/service.controller';
import { verifyAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', getPublicServices);
router.get('/featured', getFeaturedServices);
router.get('/:id', getServiceById);

// Vendor protected routes
router.post('/', verifyAuth, requireRole(['vendor']), createService);
router.get('/vendor/my-services', verifyAuth, requireRole(['vendor']), getVendorServices);
router.put('/:id', verifyAuth, requireRole(['vendor', 'admin']), updateService);
router.delete('/:id', verifyAuth, requireRole(['vendor', 'admin']), deleteService);

export default router;
