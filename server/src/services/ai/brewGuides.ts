import { METHODS } from '../../models/Coffee';
export type Method = (typeof METHODS)[number];

export interface BrewGuide {
  method: Method;
  ratio: { min: number; max: number; typical: number }; // grams of water per gram of coffee
  tempC: { min: number; max: number };
  timeSeconds: { min: number; max: number };
  grind: string;
  maxDoseGrams: number;
  notes: string[];
}

export const BREW_GUIDES: Record<Method, BrewGuide> = {
  V60: { method: 'V60', ratio: { min: 14, max: 17.5, typical: 16 }, tempC: { min: 90, max: 96 }, timeSeconds: { min: 120, max: 240 }, grind: 'Medium-fine, like table salt', maxDoseGrams: 40, notes: ['Rinse the filter', 'Bloom with 2-3x the coffee weight for 30-45 s', 'Pour in slow circles'] },
  'French Press': { method: 'French Press', ratio: { min: 12, max: 16, typical: 15 }, tempC: { min: 92, max: 96 }, timeSeconds: { min: 210, max: 300 }, grind: 'Coarse, like sea salt', maxDoseGrams: 80, notes: ['Steep without stirring after the first stir', 'Plunge gently', 'Pour out right away'] },
  AeroPress: { method: 'AeroPress', ratio: { min: 10, max: 16, typical: 13 }, tempC: { min: 80, max: 96 }, timeSeconds: { min: 60, max: 210 }, grind: 'Medium-fine', maxDoseGrams: 25, notes: ['Inverted or standard both work', 'Press slowly for 20-30 s'] },
  Espresso: { method: 'Espresso', ratio: { min: 1.5, max: 3, typical: 2 }, tempC: { min: 90, max: 96 }, timeSeconds: { min: 22, max: 35 }, grind: 'Fine, adjust to hit the target time', maxDoseGrams: 24, notes: ['Ratio is yield (liquid out) to dose', 'Adjust grind, not dose, to tune the shot time'] },
  Chemex: { method: 'Chemex', ratio: { min: 15, max: 17.5, typical: 16 }, tempC: { min: 92, max: 96 }, timeSeconds: { min: 210, max: 330 }, grind: 'Medium-coarse', maxDoseGrams: 60, notes: ['Use a thick Chemex filter and rinse it well', 'Bloom for 45 s'] },
};
