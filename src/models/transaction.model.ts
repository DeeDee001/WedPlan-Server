import { Schema, model, Document, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface ITransaction extends Document {
  vendorId: Types.ObjectId;
  plan: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required']
    },
    plan: {
      type: String,
      required: true,
      default: 'premium'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true
    },
    stripeSubscriptionId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
