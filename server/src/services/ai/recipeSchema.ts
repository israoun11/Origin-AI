import { z } from 'zod';
import { METHODS } from '../../models/Coffee';
import { BREW_GUIDES, Method } from './brewGuides';

export const recipeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  coffeeName: z.string().trim().min(1).max(120),
  method: z.enum(METHODS),
  doseGrams: z.number().positive(),
  waterGrams: z.number().positive(),
  waterTempC: z.number(),
  grindSize: z.string().trim().min(2).max(120),
  brewTimeSeconds: z.number().int().positive(),
  steps: z.array(z.object({ instruction: z.string().trim().min(3).max(300), atSeconds: z.number().int().min(0).max(900) })).min(3).max(12),
  adjustments: z.array(z.string().trim().min(3).max(240)).min(1).max(6),
  rationale: z.string().trim().min(20).max(900),
});
export type Recipe = z.infer<typeof recipeSchema>;

/** Sanity ranges per method: rejects anything outside them before the recipe is shown or saved. */
export function checkRanges(r: Recipe, cups: number): string[] {
  const g = BREW_GUIDES[r.method as Method];
  const errs: string[] = [];
  const ratio = r.waterGrams / r.doseGrams;
  if (ratio < g.ratio.min - 0.01 || ratio > g.ratio.max + 0.01) errs.push(`ratio ${ratio.toFixed(1)} outside ${g.ratio.min}-${g.ratio.max}`);
  if (r.waterTempC < g.tempC.min || r.waterTempC > g.tempC.max) errs.push(`temperature outside ${g.tempC.min}-${g.tempC.max} C`);
  if (r.brewTimeSeconds < g.timeSeconds.min || r.brewTimeSeconds > g.timeSeconds.max) errs.push(`brew time outside ${g.timeSeconds.min}-${g.timeSeconds.max} s`);
  if (r.doseGrams > g.maxDoseGrams * Math.max(1, cups / 2) || r.doseGrams < 5) errs.push('dose outside sensible range');
  if (r.steps.some((s) => s.atSeconds > r.brewTimeSeconds + 60)) errs.push('step timing exceeds brew time');
  return errs;
}
