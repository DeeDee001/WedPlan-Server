import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  toggleBlockUser,
  getAllAdminServices,
  updateServiceStatus,
  getAllTransactions
} from '../controllers/admin.controller';
import { verifyAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// All routes are strictly Admin protected
router.use(verifyAuth, requireRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/block', toggleBlockUser);
router.get('/services', getAllAdminServices);
router.patch('/services/:id/status', updateServiceStatus);
router.get('/transactions', getAllTransactions);

export default router;
