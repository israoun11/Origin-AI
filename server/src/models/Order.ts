import { Schema, model } from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Refunded'] as const;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    items: [
      {
        _id: false,
        coffee: { type: Schema.Types.ObjectId, ref: 'Coffee', required: true },
        name: { type: String, required: true }, // historical snapshot
        slug: String,
        image: String,
        weight: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      notes: String,
    },
    paymentMethod: { type: String, enum: ['cod', 'simulated'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Unpaid' },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    stockRestored: { type: Boolean, default: false },
    internalNotes: [{ _id: false, text: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);
orderSchema.index({ 'customer.email': 1 });
export const Order = model('Order', orderSchema);
