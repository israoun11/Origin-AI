import { Schema, model } from 'mongoose';

const recipeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coffee: { type: Schema.Types.ObjectId, ref: 'Coffee' },
    coffeeName: { type: String, required: true },
    method: { type: String, required: true },
    title: { type: String, required: true },
    doseGrams: { type: Number, required: true },
    waterGrams: { type: Number, required: true },
    waterTempC: { type: Number, required: true },
    grindSize: { type: String, required: true },
    brewTimeSeconds: { type: Number, required: true },
    steps: [{ _id: false, instruction: String, atSeconds: Number }],
    adjustments: [String],
    rationale: { type: String, required: true },
    preferences: Schema.Types.Mixed,
  },
  { timestamps: true },
);
export const BrewRecipe = model('BrewRecipe', recipeSchema);
