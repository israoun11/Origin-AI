import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'customer' | 'admin';
export interface TokenPayload { sub: string; role: Role }

export const signToken = (sub: string, role: Role): string =>
  jwt.sign({ sub, role }, env.JWT_SECRET, { expiresIn: role === 'admin' ? '8h' : '7d' });

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;
