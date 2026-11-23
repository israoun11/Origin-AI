import { ApiError } from '../../utils/apiError';
import { BREW_GUIDES, Method } from './brewGuides';
import { generateJson } from './openai';
import { checkRanges, recipeSchema, Recipe } from './recipeSchema';
import { getBrewingGuide, getCoffeeDetails } from './tools';

export interface BaristaRequest {
  coffeeId?: string;
  generic?: { roast: string; process?: string; notes?: string[] };
  method: Method;
  cups: number;
  flavorProfile: string;
  strength: 'light' | 'balanced' | 'strong';
  equipment: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
}

const SYSTEM = `You are the ORIGIN AI Barista. Produce ONE brewing recipe as JSON only.
Use ONLY the coffee data and brewing guide supplied in the prompt; never invent product facts.
Keys: title, coffeeName, method, doseGrams, waterGrams, waterTempC, grindSize, brewTimeSeconds,
steps[{instruction, atSeconds}], adjustments[string], rationale.
Metric units, numbers not strings. waterGrams is total water (for espresso: target yield in grams).
Stay inside the guide's ranges. The rationale must explain how the recipe fits the user's preferences.`;

export async function generateRecipe(req: BaristaRequest): Promise<{ recipe: Recipe; coffeeId?: string }> {
  // Tool 1+2: real data, retrieved before the model is called
  const coffee = req.coffeeId
    ? await getCoffeeDetails(req.coffeeId)
    : { id: undefined, name: 'Your coffee', origin: 'Unknown', region: '', process: req.generic?.process ?? 'Unknown', roast: req.generic?.roast ?? 'Medium', altitude: '', flavorNotes: req.generic?.notes ?? [], recommendedMethods: [] };
  const guide = getBrewingGuide(req.method);

  const prompt = JSON.stringify({ coffee, brewingGuide: guide, user: { cups: req.cups, flavorProfile: req.flavorProfile, strength: req.strength, equipment: req.equipment, experience: req.experience } });

  let lastIssues: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generateJson(SYSTEM + (lastIssues.length ? `\nYour previous answer was rejected: ${lastIssues.join('; ')}. Fix it.` : ''), prompt);
    const parsed = recipeSchema.safeParse(raw);
    if (!parsed.success) { lastIssues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`); continue; }
    const recipe: Recipe = { ...parsed.data, method: req.method, coffeeName: coffee.name }; // authoritative values
    const issues = checkRanges(recipe, req.cups);
    if (issues.length === 0) return { recipe, coffeeId: coffee.id };
    lastIssues = issues;
  }
  throw new ApiError(502, 'The AI Barista could not produce a safe recipe. Please regenerate.');
}
export { BREW_GUIDES };
