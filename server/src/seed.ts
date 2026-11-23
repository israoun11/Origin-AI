import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDb } from './config/db';
import { AdminUser } from './models/AdminUser';
import { Origin } from './models/Origin';
import { Coffee } from './models/Coffee';
import { SiteSettings } from './models/SiteSettings';
import { Article } from './models/Article';
import { slugify } from './utils/slug';

// Illustrative brand content only: no real sourcing partnerships or certifications are implied.
const origins = [
  { country: 'Ethiopia', region: 'Yirgacheffe', description: 'Birthplace of Arabica, where floral, tea-like cups come from heirloom varieties grown at altitude.', tastingNotes: ['Jasmine', 'Bergamot', 'Peach'] },
  { country: 'Colombia', region: 'Huila', description: 'Balanced, sweet and approachable: a benchmark for everyday brewing with caramel depth and bright fruit.', tastingNotes: ['Red apple', 'Caramel', 'Cocoa'] },
  { country: 'Brazil', region: 'Cerrado', description: 'Low acidity and a heavy body, ideal for espresso and for anyone who loves a round, nutty cup.', tastingNotes: ['Hazelnut', 'Milk chocolate', 'Brown sugar'] },
  { country: 'Guatemala', region: 'Antigua', description: 'Volcanic soils and cool nights shape a structured cup with gentle spice and cocoa sweetness.', tastingNotes: ['Dark chocolate', 'Orange zest', 'Toasted almond'] },
  { country: 'Kenya', region: 'Nyeri', description: 'Vivid, juicy and complex, with the blackcurrant acidity Kenyan coffees are known for.', tastingNotes: ['Blackcurrant', 'Grapefruit', 'Tomato leaf'] },
  { country: 'Indonesia', region: 'Sumatra', description: 'Earthy, syrupy and deeply aromatic, shaped by wet-hulling and humid highlands.', tastingNotes: ['Cedar', 'Dark cacao', 'Tobacco'] },
];

type Seed = { name: string; origin: string; region: string; producer: string; altitude: string; process: 'Washed' | 'Natural' | 'Honey' | 'Anaerobic'; roast: 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark'; flavorNotes: string[]; brewMethods: any[]; description: string; price250: number; featured?: boolean };
const coffees: Seed[] = [
  { name: 'Yirgacheffe Aurora', origin: 'Ethiopia', region: 'Yirgacheffe', producer: 'Illustrative cooperative lot', altitude: '1,900-2,200 m', process: 'Washed', roast: 'Light', flavorNotes: ['Jasmine', 'Bergamot', 'Peach'], brewMethods: ['V60', 'Chemex', 'AeroPress'], description: 'A delicate, tea-like cup with floral lift and a clean stone-fruit finish. Best brewed slowly to keep its clarity.', price250: 24, featured: true },
  { name: 'Huila Sunday', origin: 'Colombia', region: 'Huila', producer: 'Illustrative smallholder lot', altitude: '1,700 m', process: 'Washed', roast: 'Medium', flavorNotes: ['Red apple', 'Caramel', 'Cocoa'], brewMethods: ['V60', 'French Press', 'AeroPress'], description: 'Sweet, balanced and endlessly drinkable. A coffee for slow mornings and shared pots.', price250: 19, featured: true },
  { name: 'Cerrado Velvet', origin: 'Brazil', region: 'Cerrado', producer: 'Illustrative estate lot', altitude: '1,100 m', process: 'Natural', roast: 'Medium-Dark', flavorNotes: ['Hazelnut', 'Milk chocolate', 'Brown sugar'], brewMethods: ['Espresso', 'French Press', 'AeroPress'], description: 'Round and syrupy with low acidity. Built for espresso, and generous with milk.', price250: 17 },
  { name: 'Antigua Ember', origin: 'Guatemala', region: 'Antigua', producer: 'Illustrative estate lot', altitude: '1,600 m', process: 'Honey', roast: 'Medium', flavorNotes: ['Dark chocolate', 'Orange zest', 'Toasted almond'], brewMethods: ['Espresso', 'V60', 'French Press'], description: 'Structured and warm, with cocoa depth and a bright citrus edge.', price250: 20, featured: true },
  { name: 'Nyeri Garnet', origin: 'Kenya', region: 'Nyeri', producer: 'Illustrative washing-station lot', altitude: '1,800 m', process: 'Washed', roast: 'Medium-Light', flavorNotes: ['Blackcurrant', 'Grapefruit', 'Brown sugar'], brewMethods: ['V60', 'Chemex'], description: 'Juicy and vivid. A showcase of berry acidity with a long, sweet finish.', price250: 26, featured: true },
  { name: 'Sumatra Cedar', origin: 'Indonesia', region: 'Sumatra', producer: 'Illustrative smallholder lot', altitude: '1,400 m', process: 'Natural', roast: 'Dark', flavorNotes: ['Cedar', 'Dark cacao', 'Tobacco'], brewMethods: ['French Press', 'Espresso'], description: 'Earthy, heavy and deeply aromatic. A dark-roast coffee with real character.', price250: 18 },
];


const P = (text: string) => ({ type: 'paragraph' as const, text });
const H = (text: string) => ({ type: 'heading' as const, text });
const articles = [
  { title: 'Why altitude changes what you taste', category: 'Origins', readingTime: 5, featured: true, excerpt: 'Cooler nights slow a cherry down. The coffee gets denser, sweeter and more articulate.', blocks: [P('Coffee grown higher matures more slowly. The plant has more time to build sugars and organic acids, and the bean ends up denser and more complex.'), H('What it means in the cup'), P('High-grown coffees tend to taste brighter and more detailed. Lower-grown coffees tend to be rounder and heavier. Neither is better; they answer different moods.'), { type: 'quote' as const, text: 'Altitude does not guarantee quality, but it widens the range of what a farmer can achieve.' }] },
  { title: 'A practical guide to the V60', category: 'Brewing', readingTime: 6, featured: false, excerpt: 'One cone, one kettle and four variables: dose, grind, temperature and pour.', blocks: [P('The V60 rewards patience. It is a clear, clean brewer that shows off light roasts.'), H('Start here'), { type: 'list' as const, items: ['15 g coffee, 240 g water at 94 C', 'Medium-fine grind', 'Bloom with 45 g for 40 seconds', 'Pour in slow circles to 240 g by 2:15'] }, P('Too sour or thin? Grind finer. Too bitter or dry? Grind coarser. Change only one thing at a time.')] },
  { title: 'Washed, natural, honey: processing explained', category: 'Origins', readingTime: 5, featured: false, excerpt: 'How a cherry is dried shapes flavour as much as where it grew.', blocks: [P('After harvest, the fruit has to be removed from the seed. How that happens changes the cup.'), H('Three common methods'), { type: 'list' as const, items: ['Washed: clean, bright, transparent', 'Natural: fruity, sweet, heavier body', 'Honey: part of the fruit left on, balanced sweetness'] }, P('Processing is a lens: it changes what you notice about the same coffee.')] },
  { title: 'Espresso is a ratio, not a recipe', category: 'Brewing', readingTime: 4, featured: false, excerpt: 'Dose, yield and time: how to dial in without guessing.', blocks: [P('Start with a ratio of one part coffee to two parts liquid and aim for roughly 25 to 32 seconds.'), H('Dialling in'), P('If the shot runs too fast and tastes sharp, grind finer. If it crawls and tastes bitter, grind coarser. Keep dose constant and let the grinder do the adjusting.')] },
  { title: 'How to store coffee at home', category: 'Care', readingTime: 3, featured: false, excerpt: 'Air, light, heat and moisture: keep them away and your coffee lasts weeks longer.', blocks: [P('Roasted coffee is at its best in the first weeks after roasting, and degrades with exposure to air and heat.'), { type: 'list' as const, items: ['Keep it in an airtight container', 'Store away from light and the stove', 'Grind just before brewing', 'Avoid the freezer for daily-use coffee'] }] },
];

async function main() {
  await connectDb();

  await SiteSettings.updateOne(
    { key: 'main' },
    { $setOnInsert: { key: 'main', contactEmail: 'hello@origin.local', footer: { description: 'ORIGIN is a specialty coffee discovery and shopping platform. Demonstration brand content.' } } },
    { upsert: true },
  );

  const oMap = new Map<string, mongoose.Types.ObjectId>();
  for (const [i, o] of origins.entries()) {
    const doc = await Origin.findOneAndUpdate({ slug: slugify(o.country) }, { $setOnInsert: { ...o, slug: slugify(o.country), order: i, featured: true, published: true } }, { upsert: true, new: true });
    oMap.set(o.country, doc._id);
  }

  for (const c of coffees) {
    const { price250, origin, ...rest } = c;
    await Coffee.findOneAndUpdate(
      { slug: slugify(c.name) },
      { $setOnInsert: { ...rest, slug: slugify(c.name), origin: oMap.get(origin), published: true, featured: !!c.featured, variants: [
        { weight: 250, price: price250, stock: 40 },
        { weight: 1000, price: Math.round(price250 * 3.4), stock: 15 },
      ] } },
      { upsert: true },
    );
  }

  for (const a of articles) {
    await Article.findOneAndUpdate({ slug: slugify(a.title) }, { $setOnInsert: { ...a, slug: slugify(a.title), published: true, publishedAt: new Date() } }, { upsert: true });
  }

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    if (!(await AdminUser.exists({ email: env.ADMIN_EMAIL.toLowerCase() }))) {
      await AdminUser.create({ name: 'Administrator', email: env.ADMIN_EMAIL, passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12) });
      console.log(`Admin created: ${env.ADMIN_EMAIL}`);
    }
  } else console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin created.');

  console.log('Seed complete (idempotent: existing documents are not overwritten).');
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
