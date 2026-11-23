import { Router } from 'express';
import { z } from 'zod';
import { BrewRecipe } from '../models/BrewRecipe';
import { asyncHandler } from '../utils/asyncHandler';
import { notFound } from '../utils/apiError';
import { requireCustomer } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkRanges, recipeSchema } from '../services/ai/recipeSchema';
import { saveRecipe } from '../services/ai/tools';
import { badRequest } from '../utils/apiError';

const router = Router();
router.use(requireCustomer);

const saveBody = z.object({ recipe: recipeSchema, coffeeId: z.string().optional(), preferences: z.record(z.unknown()).optional() });

router.get('/', asyncHandler(async (req, res) => {
  res.json({ items: await BrewRecipe.find({ user: req.auth!.id }).sort({ createdAt: -1 }) });
}));

router.post('/', validate(saveBody), asyncHandler(async (req, res) => {
  const cups = Number((req.body.preferences as { cups?: number } | undefined)?.cups ?? 4);
  const issues = checkRanges(req.body.recipe, cups); // never trust the client copy
  if (issues.length) throw badRequest('Recipe values are out of range', issues);
  res.status(201).json({ recipe: await saveRecipe(req.auth!.id, req.body.recipe, req.body) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const r = await BrewRecipe.findOne({ _id: req.params.id, user: req.auth!.id });
  if (!r) throw notFound('Recipe not found');
  res.json({ recipe: r });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const r = await BrewRecipe.findOneAndDelete({ _id: req.params.id, user: req.auth!.id });
  if (!r) throw notFound('Recipe not found');
  res.status(204).end();
}));

export default router;
