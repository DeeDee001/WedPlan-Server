import { Router } from 'express';
import { register, login, googleAuth, getMe } from '../controllers/auth.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/signup', register);
router.post('/login', login);
router.post('/signin', login);
router.post('/google', googleAuth);
router.get('/me', verifyAuth, getMe);

export default router;
