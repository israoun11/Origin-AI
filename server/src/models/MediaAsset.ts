import { Schema, model } from 'mongoose';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    filename: { type: String, required: true, trim: true },
    folder: { type: String, default: 'general', trim: true, index: true },
    alt: { type: String, default: '', trim: true },
    width: Number,
    height: Number,
    bytes: Number,
    format: String,
  },
  { timestamps: true },
);
mediaSchema.index({ filename: 'text', alt: 'text' });
export const MediaAsset = model('MediaAsset', mediaSchema);
