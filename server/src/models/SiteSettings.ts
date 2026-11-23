import { Schema, model } from 'mongoose';

const sectionSchema = new Schema({ key: String, visible: { type: Boolean, default: true }, order: Number, content: Schema.Types.Mixed }, { _id: false });

const settingsSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    brandName: { type: String, default: 'ORIGIN' },
    tagline: { type: String, default: 'Every cup has a story.' },
    logo: { url: String, alt: String },
    contactEmail: String,
    phone: String,
    currency: { type: String, default: 'USD' },
    shippingFee: { type: Number, default: 8, min: 0 },
    freeShippingThreshold: { type: Number, default: 60, min: 0 },
    social: { instagram: String, facebook: String, x: String },
    seo: { title: String, description: String },
    announcement: { enabled: { type: Boolean, default: false }, text: String },
    storeOpen: { type: Boolean, default: true },
    footer: { description: String, privacyUrl: String, termsUrl: String },
    homepage: { type: [sectionSchema], default: [] }, // editable homepage sections (step 4 CMS)
  },
  { timestamps: true },
);
export const SiteSettings = model('SiteSettings', settingsSchema);
import { DEFAULT_HOMEPAGE } from '../services/homepageDefaults';
export const getSettings = async () => {
  let s = await SiteSettings.findOne({ key: 'main' });

  if (!s) {
    s = await SiteSettings.create({ key: 'main' });
  }

  if (!s.homepage || s.homepage.length === 0) {
    await SiteSettings.updateOne(
      {
        _id: s._id,
        $or: [
          { homepage: { $exists: false } },
          { homepage: { $size: 0 } },
        ],
      },
      {
        $set: { homepage: DEFAULT_HOMEPAGE },
      },
    );

    s = await SiteSettings.findById(s._id);
  }
  if (!s) {
    throw new Error('Site settings could not be loaded');
  }

  return s;
};

