import { Router } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound } from '../utils/apiError';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { slugify } from '../utils/slug';

const router = Router();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', asyncHandler(async (req, res) => {
  const f: Record<string, unknown> = { published: true, publishedAt: { $lte: new Date() } };
  if (typeof req.query.category === 'string' && req.query.category) f.category = req.query.category;
  if (typeof req.query.q === 'string' && req.query.q) f.$or = [{ title: new RegExp(esc(req.query.q), 'i') }, { excerpt: new RegExp(esc(req.query.q), 'i') }];
  if (req.query.featured === 'true') f.featured = true;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const items = await Article.find(f).select('-blocks').sort({ featured: -1, publishedAt: -1 }).limit(limit);
  const categories = await Article.distinct('category', { published: true });
  res.json({ items, categories });
}));

router.get('/admin/list', requireAdmin, asyncHandler(async (_req, res) => {
  res.json({ items: await Article.find().select('-blocks').sort({ createdAt: -1 }) });
}));
router.get('/admin/:id', requireAdmin, asyncHandler(async (req, res) => {
  const a = await Article.findById(req.params.id);
  if (!a) throw notFound('Article not found');
  res.json({ article: a });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const a = await Article.findOne({ slug: req.params.slug, published: true });
  if (!a) throw notFound('Article not found');
  const related = await Article.find({ _id: { $ne: a._id }, published: true, category: a.category }).select('-blocks').limit(3);
  res.json({ article: a, related });
}));

const block = z.object({
  type: z.enum(['heading', 'paragraph', 'quote', 'list', 'image']),
  text: z.string().max(5000).optional(), items: z.array(z.string().max(500)).optional(),
  url: z.string().url().optional(), alt: z.string().max(200).optional(),
});
const body = z.object({
  title: z.string().trim().min(3).max(160), excerpt: z.string().trim().min(10).max(400),
  category: z.string().trim().min(2).max(40), blocks: z.array(block).default([]),
  cover: z.object({ asset: z.string().optional(), url: z.string().url(), alt: z.string().max(200).optional() }).optional(),
  readingTime: z.number().int().min(1).max(60).default(4), featured: z.boolean().default(false),
  published: z.boolean().default(false), publishedAt: z.coerce.date().optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});
async function uniq(title: string, ignore?: string) {
  const base = slugify(title); let slug = base, n = 1;
  while (await Article.exists({ slug, ...(ignore ? { _id: { $ne: ignore } } : {}) })) slug = `${base}-${++n}`;
  return slug;
}
router.post('/', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  res.status(201).json({ article: await Article.create({ ...req.body, slug: await uniq(req.body.title) }) });
}));
router.put('/:id', requireAdmin, validate(body), asyncHandler(async (req, res) => {
  const a = await Article.findByIdAndUpdate(req.params.id, { ...req.body, slug: await uniq(req.body.title, req.params.id) }, { new: true, runValidators: true });
  if (!a) throw notFound('Article not found');
  res.json({ article: a });
}));
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!(await Article.findByIdAndDelete(req.params.id))) throw notFound('Article not found');
  res.status(204).end();
}));
export default router;
