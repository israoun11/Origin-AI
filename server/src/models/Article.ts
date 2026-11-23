import { Schema, model } from 'mongoose';

const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true },
    category: { type: String, required: true, trim: true, index: true },
    // Rich content as a sanitized block list: heading | paragraph | quote | list | image
    blocks: [
      {
        _id: false,
        type: { type: String, enum: ['heading', 'paragraph', 'quote', 'list', 'image'], required: true },
        text: String,
        items: [String],
        url: String,
        alt: String,
      },
    ],
    cover: { asset: { type: Schema.Types.ObjectId, ref: 'MediaAsset' }, url: String, alt: String },
    readingTime: { type: Number, default: 4 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: Date.now },
    seo: { title: String, description: String },
  },
  { timestamps: true },
);
articleSchema.index({ title: 'text', excerpt: 'text' });
export const Article = model('Article', articleSchema);
