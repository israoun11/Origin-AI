import { Router } from 'express';
import { z } from 'zod';
import { Order, ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order';
import { User } from '../models/User';
import { Coffee } from '../models/Coffee';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound } from '../utils/apiError';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { cancelOrder } from '../services/orderService';

const router = Router();
router.use(requireAdmin);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/stats', asyncHandler(async (_req, res) => {
  const [orders, customers, published, revenue, recent, low] = await Promise.all([
    Order.countDocuments(), User.countDocuments(), Coffee.countDocuments({ published: true }),
    Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find().sort({ createdAt: -1 }).limit(6),
    Coffee.find({ variants: { $elemMatch: { stock: { $lte: 5 } } } }).select('name slug variants'),
  ]);
  res.json({ orders, customers, publishedProducts: published, revenue: revenue[0]?.total ?? 0, recentOrders: recent, lowStock: low });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const f: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && req.query.status) f.status = req.query.status;
  if (typeof req.query.q === 'string' && req.query.q) { const r = new RegExp(esc(req.query.q), 'i'); f.$or = [{ orderNumber: r }, { 'customer.email': r }, { 'customer.name': r }]; }
  res.json({ items: await Order.find(f).sort({ createdAt: -1 }).limit(200) });
}));
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw notFound('Order not found');
  res.json({ order: o });
}));
const orderPatch = z.object({ status: z.enum(ORDER_STATUSES).optional(), paymentStatus: z.enum(PAYMENT_STATUSES).optional(), note: z.string().trim().min(1).max(500).optional() });
router.patch('/orders/:id', validate(orderPatch), asyncHandler(async (req, res) => {
  const { status, paymentStatus, note } = req.body;
  let order = await Order.findById(req.params.id);
  if (!order) throw notFound('Order not found');
  if (status === 'Cancelled') order = (await cancelOrder(req.params.id)) ?? order; // restores stock once
  else if (status) {
    if (order.status === 'Cancelled') { res.status(409).json({ message: 'A cancelled order cannot be reopened. Create a new order instead.' }); return; }
    order.status = status;
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (note) order.internalNotes.push({ text: note, at: new Date() });
  await order.save();
  res.json({ order });
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const f: Record<string, unknown> = {};
  if (typeof req.query.q === 'string' && req.query.q) { const r = new RegExp(esc(req.query.q), 'i'); f.$or = [{ name: r }, { email: r }]; }
  res.json({ items: await User.find(f).select('name email phone createdAt').sort({ createdAt: -1 }).limit(200) });
}));
router.get('/customers/:id', asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id).select('name email phone createdAt');
  if (!u) throw notFound('Customer not found');
  res.json({ customer: u, orders: await Order.find({ user: u._id }).sort({ createdAt: -1 }) });
}));

router.get('/newsletter', asyncHandler(async (req, res) => {
  const f: Record<string, unknown> = {};
  if (typeof req.query.q === 'string' && req.query.q) f.email = new RegExp(esc(req.query.q), 'i');
  res.json({ items: await NewsletterSubscriber.find(f).sort({ createdAt: -1 }).limit(1000) });
}));
router.get('/newsletter/export', asyncHandler(async (_req, res) => {
  const rows = await NewsletterSubscriber.find().sort({ createdAt: -1 });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
  res.send('email,subscribed_at\n' + rows.map((r) => `${r.email},${(r as any).createdAt.toISOString()}`).join('\n'));
}));
router.delete('/newsletter/:id', asyncHandler(async (req, res) => {
  if (!(await NewsletterSubscriber.findByIdAndDelete(req.params.id))) throw notFound('Subscriber not found');
  res.status(204).end();
}));
export default router;
