import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserRole, SubscriptionPlan } from '../models/user.model';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  subscriptionPlan: SubscriptionPlan;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};
