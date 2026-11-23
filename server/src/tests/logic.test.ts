import { describe, expect, it } from 'vitest';
import { checkRanges, Recipe } from '../services/ai/recipeSchema';
import { slugify } from '../utils/slug';

const base: Recipe = {
  title: 'Bright morning V60', coffeeName: 'Yirgacheffe Aurora', method: 'V60', doseGrams: 15, waterGrams: 240, waterTempC: 94, grindSize: 'Medium-fine', brewTimeSeconds: 180,
  steps: [{ instruction: 'Rinse the filter', atSeconds: 0 }, { instruction: 'Bloom', atSeconds: 5 }, { instruction: 'Pour to 240 g', atSeconds: 60 }],
  adjustments: ['Grind finer if sour'], rationale: 'Matches a bright, fruity preference with a clean method.',
};

describe('checkRanges', () => {
  it('accepts a sensible V60 recipe', () => expect(checkRanges(base, 1)).toEqual([]));
  it('rejects an out-of-range temperature', () => expect(checkRanges({ ...base, waterTempC: 120 }, 1).length).toBeGreaterThan(0));
  it('rejects an absurd ratio', () => expect(checkRanges({ ...base, waterGrams: 900 }, 1).length).toBeGreaterThan(0));
  it('accepts an espresso 1:2 shot', () => expect(checkRanges({ ...base, method: 'Espresso', doseGrams: 18, waterGrams: 36, waterTempC: 93, brewTimeSeconds: 28, steps: [{ instruction: 'Dose', atSeconds: 0 }, { instruction: 'Start', atSeconds: 1 }, { instruction: 'Stop', atSeconds: 28 }] }, 1)).toEqual([]));
});
describe('slugify', () => { it('normalises accents and spaces', () => expect(slugify('Café Étoilé 250g')).toBe('cafe-etoile-250g')); });
