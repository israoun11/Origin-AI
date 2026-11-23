import { Router } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { requireCustomer } from '../middleware/auth';

const router = Router();
router.use(requireCustomer);
const kinds = { coffee: 'favoriteCoffees', article: 'favoriteArticles' } as const;

router.get('/favorites', asyncHandler(async (req, res) => {
  const u = await User.findById(req.auth!.id)
    .populate({ path: 'favoriteCoffees', match: { published: true }, populate: { path: 'origin', select: 'country slug' } })
    .populate({ path: 'favoriteArticles', match: { published: true }, select: '-blocks' });
  res.json({ coffees: u?.favoriteCoffees ?? [], articles: u?.favoriteArticles ?? [] });
}));

router.get('/favorites/ids', asyncHandler(async (req, res) => {
  const u = await User.findById(req.auth!.id).select('favoriteCoffees favoriteArticles');
  res.json({ coffees: (u?.favoriteCoffees ?? []).map(String), articles: (u?.favoriteArticles ?? []).map(String) });
}));

router.post('/favorites/:kind/:id', asyncHandler(async (req, res) => {
  const field = kinds[req.params.kind as keyof typeof kinds];
  if (!field) { res.status(400).json({ message: 'Unknown kind' }); return; }
  await User.updateOne({ _id: req.auth!.id }, { $addToSet: { [field]: req.params.id } });
  res.status(204).end();
}));
router.delete('/favorites/:kind/:id', asyncHandler(async (req, res) => {
  const field = kinds[req.params.kind as keyof typeof kinds];
  if (!field) { res.status(400).json({ message: 'Unknown kind' }); return; }
  await User.updateOne({ _id: req.auth!.id }, { $pull: { [field]: req.params.id } });
  res.status(204).end();
}));
export default router;
