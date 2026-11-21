import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { getVendorDashboard, getCustomerDashboard } from '../controllers/dashboard.controller';
import { verifyAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Profile update
router.put('/profile', verifyAuth, updateProfile);

// Dashboard routes
router.get('/dashboard/vendor', verifyAuth, requireRole(['vendor']), getVendorDashboard);
router.get('/dashboard/customer', verifyAuth, requireRole(['customer']), getCustomerDashboard);

export default router;
