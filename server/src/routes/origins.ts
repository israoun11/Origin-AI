import { Router } from 'express';
import { z } from 'zod';
import { Origin } from '../models/Origin';
import { Coffee } from '../models/Coffee';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound } from '../utils/apiError';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { slugify } from '../utils/slug';

const router = Router();
const image = z.object({ asset: z.string().optional(), url: z.string().url(), alt: z.string().max(200).optional() }).optional();
const body = z.object({
  country: z.string().trim().min(2),
  region: z.string().trim().optional(),
  description: z.string().trim().min(10),
  tastingNotes: z.array(z.string().trim().min(1)).default([]),
  image,
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});

router.get('/', asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { published: true };
  if (req.query.featured === 'true') filter.featured = true;
  res.json({ items: await Origin.find(filter).sort({ order: 1, country: 1 }) });
}));

router.get('/admin/all', requireAdmin, asyncHandler(async (_req, res) => {
  res.json({ items: await Origin.find().sort({ order: 1, country: 1 }) });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const origin = await Origin.findOne({ slug: req.params.slug, published: true });
  if (!origin) throw notFound('Origin not found');
  const coffees = await Coffee.find({ origin: origin._id, published: true }).select('name slug images roast flavorNotes variants');
  res.json({ origin, coffees });
}));

router.post('/', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  const origin = await Origin.create({ ...req.body, slug: slugify(req.body.country) });
  res.status(201).json({ origin });
}));

router.put('/:id', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  const origin = await Origin.findByIdAndUpdate(req.params.id, { ...req.body, slug: slugify(req.body.country) }, { new: true, runValidators: true });
  if (!origin) throw notFound('Origin not found');
  res.json({ origin });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  // safe deletion: refuse while coffees still reference this origin
  if (await Coffee.exists({ origin: req.params.id })) {
    res.status(409).json({ message: 'This origin still has coffees. Reassign or delete them first, or unpublish the origin.' });
    return;
  }
  const r = await Origin.findByIdAndDelete(req.params.id);
  if (!r) throw notFound('Origin not found');
  res.status(204).end();
}));

export default router;
