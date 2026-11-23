import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_URL: z.string().url(),
  SERVER_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('gpt-4.1-mini'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');

  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;