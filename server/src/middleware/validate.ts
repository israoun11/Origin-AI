import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const r = schema.safeParse(req[source]);
    if (!r.success) return next(r.error);
    if (source === 'body') req.body = r.data;
    else res.locals.query = r.data;
    next();
  };
