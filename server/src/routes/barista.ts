import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { METHODS } from '../models/Coffee';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { generateRecipe } from '../services/ai/baristaAgent';
import { getAvailableCoffeeOptions } from '../services/ai/tools';

const router = Router();
const body = z.object({
  coffeeId: z.string().optional(),
  generic: z.object({ roast: z.string().max(40), process: z.string().max(40).optional(), notes: z.array(z.string().max(40)).max(8).optional() }).optional(),
  method: z.enum(METHODS),
  cups: z.number().int().min(1).max(8),
  flavorProfile: z.string().trim().min(2).max(60),
  strength: z.enum(['light', 'balanced', 'strong']),
  equipment: z.array(z.string().trim().max(60)).max(10).default([]),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
}).refine((b) => b.coffeeId || b.generic, { message: 'Select an ORIGIN coffee or a generic profile' });

router.get('/options', asyncHandler(async (_req, res) => {
  res.json({ coffees: await getAvailableCoffeeOptions(), methods: METHODS });
}));

router.post('/recipe', rateLimit({ windowMs: 60_000, limit: 10 }), validate(body), asyncHandler(async (req, res) => {
  res.json(await generateRecipe(req.body));
}));

export default router;
