import { Schema, model, Document, Types } from 'mongoose';

export type ServiceStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';

export interface IService extends Document {
  vendorId: Types.ObjectId;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required']
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Photography & Videography',
        'Wedding Venues',
        'Decoration & Florist',
        'Catering Services',
        'Makeup & Styling',
        'Wedding Fashion'
      ]
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ serviceName: 'text', description: 'text', location: 'text' });
serviceSchema.index({ category: 1, status: 1 });

export const Service = model<IService>('Service', serviceSchema);
