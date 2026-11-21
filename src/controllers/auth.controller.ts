import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { signToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, image, role, businessName } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    // Role validation: Admin cannot be created via public registration
    if (role === 'admin') {
      res.status(403).json({ success: false, message: 'Admin accounts cannot be created through public registration.' });
      return;
    }

    const assignedRole = role === 'vendor' ? 'vendor' : 'customer';

    // Password validation: Min 6 characters, one uppercase, one lowercase
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
      return;
    }
    if (!/[a-z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      image: image || '',
      role: assignedRole,
      businessName: assignedRole === 'vendor' ? businessName || '' : '',
      isBlocked: false,
      subscriptionPlan: 'free'
    });

    const token = signToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      isBlocked: newUser.isBlocked,
      subscriptionPlan: newUser.subscriptionPlan
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
        role: newUser.role,
        businessName: newUser.businessName,
        isBlocked: newUser.isBlocked,
        subscriptionPlan: newUser.subscriptionPlan
      }
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ success: false, message: 'Please sign in with your Google account.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        businessName: user.businessName,
        isBlocked: user.isBlocked,
        subscriptionPlan: user.subscriptionPlan
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, image, role } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required for Google Sign-in.' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const assignedRole = role === 'vendor' ? 'vendor' : 'customer';
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        image: image || '',
        role: assignedRole,
        isBlocked: false,
        subscriptionPlan: 'free'
      });
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      return;
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan
    });

    res.status(200).json({
      success: true,
      message: 'Google Sign-in successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        businessName: user.businessName,
        isBlocked: user.isBlocked,
        subscriptionPlan: user.subscriptionPlan
      }
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'Your account has been blocked.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        businessName: user.businessName,
        isBlocked: user.isBlocked,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};
