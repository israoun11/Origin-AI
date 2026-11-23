import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound } from '../utils/apiError';
import { optionalAuth, requireCustomer } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrder } from '../services/orderService';

const router = Router();

const body = z.object({
  items: z.array(z.object({
    coffeeId: z.string().min(1),
    weight: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(30),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(6).max(30),
  }),
  shippingAddress: z.object({
    country: z.string().trim().min(2),
    city: z.string().trim().min(2),
    address: z.string().trim().min(4),
    notes: z.string().trim().max(500).optional(),
  }),
  paymentMethod: z.enum(['cod', 'simulated']),
});

router.post('/', optionalAuth, validate(body), asyncHandler(async (req, res) => {
  const userId = req.auth?.role === 'customer' ? req.auth.id : undefined;
  const order = await createOrder(req.body, userId);
  res.status(201).json({ order });
}));

// Customer order history: ownership enforced via the user id in the query
router.get('/mine', requireCustomer, asyncHandler(async (req, res) => {
  res.json({ items: await Order.find({ user: req.auth!.id }).sort({ createdAt: -1 }) });
}));

router.get('/mine/:id', requireCustomer, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.auth!.id });
  if (!order) throw notFound('Order not found');
  res.json({ order });
}));

export default router;
