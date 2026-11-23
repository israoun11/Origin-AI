import { Types } from 'mongoose';
import { Coffee } from '../models/Coffee';
import { Order } from '../models/Order';
import { getSettings } from '../models/SiteSettings';
import { badRequest, conflict } from '../utils/apiError';

export interface OrderInput {
  items: { coffeeId: string; weight: number; quantity: number }[];
  customer: { name: string; email: string; phone: string };
  shippingAddress: { country: string; city: string; address: string; notes?: string };
  paymentMethod: 'cod' | 'simulated';
}

const orderNumber = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ORG-${d}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

/** Prices, totals and stock are always computed server-side from the database. */
export async function createOrder(input: OrderInput, userId?: string) {
  const settings = await getSettings();
  if (!settings.storeOpen) throw badRequest('The store is currently closed for orders');

  // merge duplicate lines (same coffee + weight)
  const merged = new Map<string, { coffeeId: string; weight: number; quantity: number }>();
  for (const i of input.items) {
    const k = `${i.coffeeId}:${i.weight}`;
    const prev = merged.get(k);
    merged.set(k, prev ? { ...prev, quantity: prev.quantity + i.quantity } : { ...i });
  }

  const ids = [...new Set([...merged.values()].map((i) => i.coffeeId))];
  const coffees = await Coffee.find({ _id: { $in: ids }, published: true });
  const byId = new Map(coffees.map((c) => [c._id.toString(), c]));

  const lines = [...merged.values()].map((i) => {
    const c = byId.get(i.coffeeId);
    if (!c) throw badRequest('One of the products is no longer available');
    const v = c.variants.find((x) => x.weight === i.weight);
    if (!v) throw badRequest(`${c.name}: ${i.weight}g is not available`);
    if (v.stock < i.quantity) throw conflict(`${c.name} (${i.weight}g): only ${v.stock} left in stock`);
    return {
      coffee: c._id,
      name: c.name,
      slug: c.slug,
      image: c.images[0]?.url,
      weight: i.weight,
      unitPrice: v.price,
      quantity: i.quantity,
    };
  });

  // Atomic stock reservation with rollback on partial failure.
  const reserved: typeof lines = [];
  try {
    for (const l of lines) {
      const r = await Coffee.updateOne(
        { _id: l.coffee, variants: { $elemMatch: { weight: l.weight, stock: { $gte: l.quantity } } } },
        { $inc: { 'variants.$.stock': -l.quantity } },
      );
      if (r.modifiedCount !== 1) throw conflict(`${l.name} (${l.weight}g) just went out of stock`);
      reserved.push(l);
    }

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    return await Order.create({
      orderNumber: orderNumber(),
      user: userId ? new Types.ObjectId(userId) : undefined,
      items: lines,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'Unpaid', // never pretend a payment was processed
      subtotal,
      shipping,
      total: subtotal + shipping,
      currency: settings.currency,
    });
  } catch (e) {
    await restoreLines(reserved);
    throw e;
  }
}

async function restoreLines(lines: { coffee: Types.ObjectId; weight: number; quantity: number }[]) {
  for (const l of lines) {
    await Coffee.updateOne({ _id: l.coffee, 'variants.weight': l.weight }, { $inc: { 'variants.$.stock': l.quantity } });
  }
}

/** Idempotent: stock is restored at most once per order. */
export async function cancelOrder(orderId: string) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockRestored: false, status: { $ne: 'Delivered' } },
    { $set: { status: 'Cancelled', stockRestored: true } },
    { new: true },
  );
  if (!order) return null;
  await restoreLines(order.items);
  return order;
}
