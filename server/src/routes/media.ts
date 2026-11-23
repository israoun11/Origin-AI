import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { MediaAsset } from '../models/MediaAsset';
import { Coffee } from '../models/Coffee';
import { Origin } from '../models/Origin';
import { Article } from '../models/Article';
import { SiteSettings } from '../models/SiteSettings';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, notFound } from '../utils/apiError';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { destroyImage, uploadImage } from '../services/cloudinary';

const router = Router();
router.use(requireAdmin);
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => (ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP or AVIF images are allowed'))),
});
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', asyncHandler(async (req, res) => {
  const f: Record<string, unknown> = {};
  if (typeof req.query.folder === 'string' && req.query.folder) f.folder = req.query.folder;
  if (typeof req.query.q === 'string' && req.query.q) f.filename = new RegExp(esc(req.query.q), 'i');
  res.json({ items: await MediaAsset.find(f).sort({ createdAt: -1 }).limit(200), folders: await MediaAsset.distinct('folder') });
}));

router.post('/upload', upload.array('files', 12), asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) throw badRequest('No file received');
  const folder = String(req.body.folder || 'general').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
  const items = [];
  for (const f of files) {
    const u = await uploadImage(f.buffer, f.mimetype, folder);
    items.push(await MediaAsset.create({ ...u, filename: f.originalname, folder, alt: String(req.body.alt || '') }));
  }
  res.status(201).json({ items });
}));

const patch = z.object({ alt: z.string().max(200).optional(), folder: z.string().trim().min(1).max(40).optional(), filename: z.string().trim().min(1).max(120).optional() });
router.patch('/:id', validate(patch), asyncHandler(async (req, res) => {
  const a = await MediaAsset.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!a) throw notFound('Image not found');
  res.json({ asset: a });
}));

/** Replace keeps the same record, so every reference (products, origins, articles) points to the new file. */
router.post('/:id/replace', upload.single('file'), asyncHandler(async (req, res) => {
  const a = await MediaAsset.findById(req.params.id);
  if (!a) throw notFound('Image not found');
  if (!req.file) throw badRequest('No file received');
  const old = { publicId: a.publicId, url: a.url };
  const u = await uploadImage(req.file.buffer, req.file.mimetype, a.folder);
  a.set({ ...u, filename: req.file.originalname });
  await a.save();
  await Promise.all([
    Coffee.updateMany({ 'images.asset': a._id }, { $set: { 'images.$[i].url': u.url } }, { arrayFilters: [{ 'i.asset': a._id }] }),
    Origin.updateMany({ 'image.asset': a._id }, { $set: { 'image.url': u.url } }),
    Article.updateMany({ 'cover.asset': a._id }, { $set: { 'cover.url': u.url } }),
    replaceInSettings(old.url, u.url),
  ]);
  await destroyImage(old.publicId);
  res.json({ asset: a });
}));

async function replaceInSettings(from: string, to: string) {
  const s = await SiteSettings.findOne({ key: 'main' });
  if (!s) return;
  const json = JSON.stringify({ homepage: s.homepage, logo: s.logo });
  if (!json.includes(from)) return;
  const next = JSON.parse(json.split(from).join(to));
  s.homepage = next.homepage; if (next.logo) s.logo = next.logo;
  s.markModified('homepage'); await s.save();
}

/** Deleting detaches the image everywhere first so public pages never point to a dead URL. */
router.delete('/:id', asyncHandler(async (req, res) => {
  const a = await MediaAsset.findById(req.params.id);
  if (!a) throw notFound('Image not found');
  await Promise.all([
    Coffee.updateMany({}, { $pull: { images: { asset: a._id } } }),
    Origin.updateMany({ 'image.asset': a._id }, { $unset: { image: '' } }),
    Article.updateMany({ 'cover.asset': a._id }, { $unset: { cover: '' } }),
    replaceInSettings(a.url, ''),
  ]);
  await destroyImage(a.publicId);
  await a.deleteOne();
  res.status(204).end();
}));
export default router;
