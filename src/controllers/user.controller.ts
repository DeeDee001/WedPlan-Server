import { Response } from 'express';
import { User } from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Update current user profile (name, image, businessName)
 * Strictly prevents modification of role or subscriptionPlan
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, image, businessName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (name) user.name = name.trim();
    if (image !== undefined) user.image = image;
    if (businessName !== undefined && user.role === 'vendor') {
      user.businessName = businessName.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        isBlocked: user.isBlocked
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
