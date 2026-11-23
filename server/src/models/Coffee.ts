import { Schema, model } from 'mongoose';

export const ROASTS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'] as const;
export const PROCESSES = ['Washed', 'Natural', 'Honey', 'Anaerobic'] as const;
export const METHODS = ['V60', 'French Press', 'AeroPress', 'Espresso', 'Chemex'] as const;

const variantSchema = new Schema(
  {
    weight: { type: Number, required: true, min: 50 }, // grams
    price: { type: Number, required: true, min: 0 }, // major currency units
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const coffeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    origin: { type: Schema.Types.ObjectId, ref: 'Origin', required: true, index: true },
    region: { type: String, trim: true },
    producer: { type: String, trim: true },
    altitude: { type: String, trim: true },
    process: { type: String, enum: PROCESSES, required: true },
    roast: { type: String, enum: ROASTS, required: true },
    flavorNotes: [{ type: String, trim: true }],
    brewMethods: [{ type: String, enum: METHODS }],
    variants: {
      type: [variantSchema],
      validate: [(v: unknown[]) => v.length > 0, 'At least one variant is required'],
    },
    images: [
      {
        _id: false,
        asset: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
        url: { type: String, required: true },
        alt: { type: String, default: '' },
      },
    ], // array order = gallery order; index 0 = primary image
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    seo: { title: String, description: String },
  },
  { timestamps: true },
);
coffeeSchema.index({ name: 'text', description: 'text', flavorNotes: 'text' });
coffeeSchema.index({ roast: 1, process: 1 });
export const Coffee = model('Coffee', coffeeSchema);
