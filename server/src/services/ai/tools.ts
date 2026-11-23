import { Types } from 'mongoose';
import { Coffee } from '../../models/Coffee';
import { BrewRecipe } from '../../models/BrewRecipe';
import { notFound } from '../../utils/apiError';
import { BREW_GUIDES, Method } from './brewGuides';
import type { Recipe } from './recipeSchema';

/** Real backend tools used by the AI Barista. The model never invents catalogue data. */
export async function getCoffeeDetails(coffeeId: string) {
  if (!Types.ObjectId.isValid(coffeeId)) throw notFound('Coffee not found');
  const c = await Coffee.findOne({ _id: coffeeId, published: true }).populate('origin', 'country region');
  if (!c) throw notFound('Coffee not found');
  const o = c.origin as unknown as { country?: string; region?: string } | null;
  return {
    id: c.id as string,
    name: c.name,
    origin: o?.country ?? '',
    region: c.region ?? o?.region ?? '',
    process: c.process,
    roast: c.roast,
    altitude: c.altitude ?? '',
    flavorNotes: c.flavorNotes,
    recommendedMethods: c.brewMethods,
  };
}

export const getBrewingGuide = (method: Method) => BREW_GUIDES[method];

export async function getAvailableCoffeeOptions() {
  const items = await Coffee.find({ published: true }).populate('origin', 'country').sort({ name: 1 });
  return items.map((c) => ({
    id: c.id as string,
    name: c.name,
    origin: (c.origin as unknown as { country?: string } | null)?.country ?? '',
    roast: c.roast,
    flavorNotes: c.flavorNotes,
    brewMethods: c.brewMethods,
  }));
}

export async function saveRecipe(userId: string, recipe: Recipe, extra: { coffeeId?: string; preferences?: unknown }) {
  return BrewRecipe.create({
    user: userId,
    coffee: extra.coffeeId && Types.ObjectId.isValid(extra.coffeeId) ? extra.coffeeId : undefined,
    coffeeName: recipe.coffeeName,
    method: recipe.method,
    title: recipe.title,
    doseGrams: recipe.doseGrams,
    waterGrams: recipe.waterGrams,
    waterTempC: recipe.waterTempC,
    grindSize: recipe.grindSize,
    brewTimeSeconds: recipe.brewTimeSeconds,
    steps: recipe.steps,
    adjustments: recipe.adjustments,
    rationale: recipe.rationale,
    preferences: extra.preferences,
  });
}
