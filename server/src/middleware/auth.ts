import { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../utils/apiError';
import { Role, verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request { auth?: { id: string; role: Role } }
  }
}

function read(req: Request) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = verifyToken(h.slice(7));
    return { id: p.sub, role: p.role };
  } catch {
    return null;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const a = read(req);
  if (a) req.auth = a;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const a = read(req);
    if (!a) return next(unauthorized('Invalid or expired token'));
    if (a.role !== role) return next(forbidden());
    req.auth = a;
    next();
  };
}
export const requireAdmin = requireRole('admin');
export const requireCustomer = requireRole('customer');
