import { Router } from 'express';
import { z } from 'zod';
import { getSettings } from '../models/SiteSettings';
import { Coffee } from '../models/Coffee';
import { Origin } from '../models/Origin';
import { Article } from '../models/Article';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

/** Public: global settings only (nav, footer, announcement, shipping). */
router.get('/', asyncHandler(async (_req, res) => {
  const s = (await getSettings()).toObject();
  const { homepage, _id, __v, ...rest } = s as Record<string, unknown>;
  res.json({ settings: rest });
}));

/** Public: everything the homepage renders, resolved from the database in one call. */
router.get('/homepage', asyncHandler(async (_req, res) => {
  const s = await getSettings();
  const sections = [...s.homepage].filter((x) => x.visible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const byKey = new Map(sections.map((x) => [x.key, x.content as Record<string, any>]));
  const coffeeIds: string[] = byKey.get('coffees')?.featuredIds ?? [];
  const articleIds: string[] = byKey.get('journal')?.featuredIds ?? [];
  const coffeeQ = coffeeIds.length ? { _id: { $in: coffeeIds }, published: true } : { published: true, featured: true };
  const articleQ = articleIds.length ? { _id: { $in: articleIds }, published: true } : { published: true };
  const [coffees, origins, articles] = await Promise.all([
    Coffee.find(coffeeQ).populate('origin', 'country slug').limit(6),
    Origin.find({ published: true, featured: true }).sort({ order: 1 }).limit(6),
    Article.find(articleQ).select('-blocks').sort({ featured: -1, publishedAt: -1 }).limit(4),
  ]);
  res.json({
    sections: sections.map((x) => ({ key: x.key, order: x.order, content: x.content })),
    coffees: coffees.map((c: any) => ({ ...c.toObject(), fromPrice: Math.min(...c.variants.map((v: any) => v.price)), inStock: c.variants.some((v: any) => v.stock > 0) })),
    origins, articles,
  });
}));

const homepageBody = z.array(z.object({ key: z.string(), visible: z.boolean(), order: z.number().int(), content: z.record(z.any()) }));
const settingsBody = z.object({
  brandName: z.string().trim().min(1).max(60), tagline: z.string().max(160).optional(),
  logo: z.object({ url: z.string().url().optional(), alt: z.string().optional() }).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')), phone: z.string().max(40).optional(),
  currency: z.string().length(3).toUpperCase(), shippingFee: z.number().min(0), freeShippingThreshold: z.number().min(0),
  social: z.object({ instagram: z.string().optional(), facebook: z.string().optional(), x: z.string().optional() }).optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  announcement: z.object({ enabled: z.boolean(), text: z.string().max(200).optional() }).optional(),
  storeOpen: z.boolean(),
  footer: z.object({ description: z.string().max(400).optional(), privacyUrl: z.string().optional(), termsUrl: z.string().optional() }).optional(),
});

router.get('/admin', requireAdmin, asyncHandler(async (_req, res) => { res.json({ settings: await getSettings() }); }));
router.put('/admin', requireAdmin, validate(settingsBody), asyncHandler(async (req, res) => {
  const s = await getSettings();
  s.set(req.body);
  await s.save();
  res.json({ settings: s });
}));
router.put('/admin/homepage', requireAdmin, validate(homepageBody), asyncHandler(async (req, res) => {
  const s = await getSettings();
  s.homepage = req.body;
  s.markModified('homepage');
  await s.save();
  res.json({ homepage: s.homepage });
}));
export default router;
