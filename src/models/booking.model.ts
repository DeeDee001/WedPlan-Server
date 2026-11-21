import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface IBooking extends Document {
  serviceId: Types.ObjectId;
  vendorId: Types.ObjectId;
  customerId: Types.ObjectId;
  eventDate: string; // YYYY-MM-DD format
  eventLocation: string;
  message?: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required']
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required']
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    eventDate: {
      type: String,
      required: [true, 'Event date is required']
    },
    eventLocation: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to help query bookings by service and date
bookingSchema.index({ serviceId: 1, eventDate: 1, status: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
