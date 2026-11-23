export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
export const badRequest = (m: string, d?: unknown) => new ApiError(400, m, d);
export const unauthorized = (m = 'Authentication required') => new ApiError(401, m);
export const forbidden = (m = 'Forbidden') => new ApiError(403, m);
export const notFound = (m = 'Not found') => new ApiError(404, m);
export const conflict = (m: string) => new ApiError(409, m);
