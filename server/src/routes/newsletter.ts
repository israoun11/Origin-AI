import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';

const router = Router();
router.post('/', rateLimit({ windowMs: 60_000, limit: 10 }), validate(z.object({ email: z.string().trim().email().toLowerCase() })), asyncHandler(async (req, res) => {
  const existing = await NewsletterSubscriber.exists({ email: req.body.email });
  if (!existing) await NewsletterSubscriber.create({ email: req.body.email });
  // same answer either way: does not leak who is subscribed
  res.status(201).json({ message: 'Thank you, you are on the list.' });
}));
export default router;
