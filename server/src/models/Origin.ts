import { Schema, model } from 'mongoose';

const originSchema = new Schema(
  {
    country: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    region: { type: String, trim: true },
    description: { type: String, required: true },
    tastingNotes: [{ type: String, trim: true }],
    image: {
      asset: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
      url: String,
      alt: String,
    },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Origin = model('Origin', originSchema);
