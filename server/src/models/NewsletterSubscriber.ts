import { Schema, model } from 'mongoose';

export const NewsletterSubscriber = model(
  'NewsletterSubscriber',
  new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true } }, { timestamps: true }),
);
