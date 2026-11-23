import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth';
import coffeeRoutes from './routes/coffees';
import originRoutes from './routes/origins';
import orderRoutes from './routes/orders';
import baristaRoutes from './routes/barista';
import recipeRoutes from './routes/recipes';
import articleRoutes from './routes/articles';
import newsletterRoutes from './routes/newsletter';
import settingsRoutes from './routes/settings';
import mediaRoutes from './routes/media';
import adminRoutes from './routes/admin';
import meRoutes from './routes/me';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL.split(',').map((s) => s.trim()), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  const api = express.Router();
  api.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }), authRoutes);
  api.use('/coffees', coffeeRoutes);
  api.use('/origins', originRoutes);
  api.use('/orders', orderRoutes);
  api.use('/barista', baristaRoutes);
  api.use('/recipes', recipeRoutes);
  api.use('/articles', articleRoutes);
  api.use('/newsletter', newsletterRoutes);
  api.use('/settings', settingsRoutes);
  api.use('/media', mediaRoutes);
  api.use('/admin', adminRoutes);
  api.use('/me', meRoutes);
  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
