import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message, details: err.details });
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid identifier' });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
  if ((err as { code?: number })?.code === 11000) return res.status(409).json({ message: 'Duplicate value' });
  const name = (err as { name?: string })?.name; const msg = (err as Error)?.message ?? '';
  if (name === 'MulterError') return res.status(400).json({ message: msg.includes('File too large') ? 'Image is larger than 8 MB' : msg });
  if (msg.startsWith('Only JPEG')) return res.status(400).json({ message: msg });
  console.error(err);
  res.status(500).json({ message: env.NODE_ENV === 'production' ? 'Internal server error' : String((err as Error)?.message) });
}
