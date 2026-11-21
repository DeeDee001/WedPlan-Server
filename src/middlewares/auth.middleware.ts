import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { User } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    let decoded: TokenPayload;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
      return;
    }

    // Verify user in DB to ensure not blocked or deleted
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'Access denied. Your account is currently suspended.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan
    };

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};
