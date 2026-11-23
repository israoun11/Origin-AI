import { Router } from 'express';
import { z } from 'zod';
import { Coffee, METHODS, PROCESSES, ROASTS } from '../models/Coffee';
import { Origin } from '../models/Origin';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound, badRequest } from '../utils/apiError';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { slugify } from '../utils/slug';

const router = Router();

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  origin: z.string().trim().optional(), // origin slug
  roast: z.enum(ROASTS).optional(),
  process: z.enum(PROCESSES).optional(),
  note: z.string().trim().optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withComputed = (c: any) => {
  const o = typeof c.toObject === 'function' ? c.toObject() : c;
  const prices = (o.variants ?? []).map((v: any) => v.price);
  return {
    ...o,
    fromPrice: prices.length ? Math.min(...prices) : 0,
    inStock: (o.variants ?? []).some((v: any) => v.stock > 0),
  };
};

router.get('/', validate(listQuery, 'query'), asyncHandler(async (_req, res) => {
  const q = res.locals.query as z.infer<typeof listQuery>;
  const filter: Record<string, unknown> = { published: true };
  if (q.q) filter.$or = [{ name: new RegExp(escape(q.q), 'i') }, { flavorNotes: new RegExp(escape(q.q), 'i') }, { region: new RegExp(escape(q.q), 'i') }];
  if (q.origin) {
    const o = await Origin.findOne({ slug: q.origin });
    filter.origin = o ? o._id : null;
  }
  if (q.roast) filter.roast = q.roast;
  if (q.process) filter.process = q.process;
  if (q.note) filter.flavorNotes = new RegExp(`^${escape(q.note)}$`, 'i');
  if (q.featured) filter.featured = q.featured === 'true';

  const sortMap = { newest: { createdAt: -1 }, name: { name: 1 }, price_asc: { 'variants.0.price': 1 }, price_desc: { 'variants.0.price': -1 } } as const;
  const [items, total] = await Promise.all([
    Coffee.find(filter).populate('origin', 'country slug').sort(sortMap[q.sort] as any).skip((q.page - 1) * q.limit).limit(q.limit),
    Coffee.countDocuments(filter),
  ]);
  res.json({ items: items.map(withComputed), total, page: q.page, pages: Math.ceil(total / q.limit) });
}));

// Facets for the Discover page filters (built from real published data)
router.get('/filters', asyncHandler(async (_req, res) => {
  const [roasts, processes, notes, origins] = await Promise.all([
    Coffee.distinct('roast', { published: true }),
    Coffee.distinct('process', { published: true }),
    Coffee.distinct('flavorNotes', { published: true }),
    Origin.find({ published: true }).sort({ order: 1 }).select('country slug'),
  ]);
  res.json({ roasts, processes, notes: notes.sort(), origins });
}));

const variant = z.object({ weight: z.number().int().min(50).max(5000), price: z.number().min(0), stock: z.number().int().min(0) });
const image = z.object({ asset: z.string().optional(), url: z.string().url(), alt: z.string().max(200).default('') });
const body = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10),
  origin: z.string().min(1),
  region: z.string().trim().optional(),
  producer: z.string().trim().optional(),
  altitude: z.string().trim().optional(),
  process: z.enum(PROCESSES),
  roast: z.enum(ROASTS),
  flavorNotes: z.array(z.string().trim().min(1)).default([]),
  brewMethods: z.array(z.enum(METHODS)).default([]),
  variants: z.array(variant).min(1).refine((v) => new Set(v.map((x) => x.weight)).size === v.length, 'Duplicate weights'),
  images: z.array(image).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

router.get('/admin/list', requireAdmin, asyncHandler(async (_req, res) => {
  const items = await Coffee.find().populate('origin', 'country slug').sort({ createdAt: -1 });
  res.json({ items: items.map(withComputed) });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const coffee = await Coffee.findOne({ slug: req.params.slug, published: true }).populate('origin');
  if (!coffee) throw notFound('Coffee not found');
  const related = await Coffee.find({ _id: { $ne: coffee._id }, published: true, $or: [{ origin: (coffee.origin as any)._id }, { roast: coffee.roast }] })
    .limit(3).populate('origin', 'country slug');
  res.json({ coffee: withComputed(coffee), related: related.map(withComputed) });
}));

async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  let slug = base, n = 1;
  while (await Coffee.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) slug = `${base}-${++n}`;
  return slug;
}

router.post('/', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  if (!(await Origin.exists({ _id: req.body.origin }))) throw badRequest('Unknown origin');
  const coffee = await Coffee.create({ ...req.body, slug: await uniqueSlug(req.body.name) });
  res.status(201).json({ coffee });
}));

router.put('/:id', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  if (!(await Origin.exists({ _id: req.body.origin }))) throw badRequest('Unknown origin');
  const coffee = await Coffee.findByIdAndUpdate(req.params.id, { ...req.body, slug: await uniqueSlug(req.body.name, req.params.id) }, { new: true, runValidators: true });
  if (!coffee) throw notFound('Coffee not found');
  res.json({ coffee });
}));

router.post('/:id/duplicate', requireAdmin, asyncHandler(async (req, res) => {
  const src = await Coffee.findById(req.params.id);
  if (!src) throw notFound('Coffee not found');
  const { _id, createdAt, updatedAt, ...data } = src.toObject() as any;
  const name = `${src.name} (copy)`;
  const copy = await Coffee.create({ ...data, name, slug: await uniqueSlug(name), published: false, featured: false });
  res.status(201).json({ coffee: copy });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const r = await Coffee.findByIdAndDelete(req.params.id); // orders keep their own snapshots
  if (!r) throw notFound('Coffee not found');
  res.status(204).end();
}));

export default router;
