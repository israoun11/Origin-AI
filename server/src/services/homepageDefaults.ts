// Default editable homepage content. Stored in MongoDB (SiteSettings.homepage) on first read, then edited from the admin.
export const DEFAULT_HOMEPAGE = [
  { key: 'hero', visible: true, order: 0, content: { headline: 'Discover the Art of Coffee.', text: 'Exceptional beans. Distinctive origins. A more personal coffee experience.', primaryCta: { label: 'Explore Our Selection', href: '/coffee' }, secondaryCta: { label: 'Meet Your Barista', href: '/barista' }, image: null } },
  { key: 'intro', visible: true, order: 1, content: { headline: 'Not Just Coffee. A World of Origins.', text: 'Specialty coffee begins long before the cup: in the soil, the altitude, the variety and the hands that process each harvest. We select a small number of coffees and tell you honestly what makes each one distinct, so you can choose by taste rather than by label.', image: null, imageSecondary: null } },
  { key: 'origins', visible: true, order: 2, content: { headline: 'Six origins, six ways to taste the world', text: 'Follow a coffee back to where it grew.' } },
  { key: 'coffees', visible: true, order: 3, content: { headline: 'The current selection', text: 'Roasted in small batches and described plainly.', featuredIds: [] } },
  { key: 'barista', visible: true, order: 4, content: { headline: 'Your Coffee. Your Ritual. Your Perfect Brew.', text: 'Discover a brewing experience tailored to your taste, your coffee, and the equipment you use.', cta: { label: 'Meet Your AI Barista', href: '/barista' }, image: null } },
  { key: 'journal', visible: true, order: 5, content: { headline: 'The Brew Journal', text: 'Notes on origin, method and the small decisions that change a cup.', featuredIds: [] } },
  { key: 'philosophy', visible: true, order: 6, content: { headline: 'From farm to cup, nothing is accidental.', text: 'Craft, sourcing and quality are choices made at every step: how a lot is picked, how it is dried, how it is roasted and how it is brewed. ORIGIN exists to make those choices visible.', image: null } },
  { key: 'newsletter', visible: true, order: 7, content: { headline: 'Letters from the roastery', text: 'New arrivals and brewing notes, a few times a season.' } },
];
