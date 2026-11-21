import { Schema, model, Document } from 'mongoose';

export type UserRole = 'admin' | 'vendor' | 'customer';
export type SubscriptionPlan = 'free' | 'premium';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  isBlocked: boolean;
  businessName?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false // Optional for OAuth accounts
    },
    image: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'customer'],
      default: 'customer'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    businessName: {
      type: String,
      trim: true,
      default: ''
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    subscriptionExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const User = model<IUser>('User', userSchema);
