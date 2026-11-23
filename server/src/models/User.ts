import { Schema, model, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    favoriteCoffees: [{ type: Schema.Types.ObjectId, ref: 'Coffee' }],
    favoriteArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
  },
  { timestamps: true },
);
export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
