import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

const configured = () => !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
const sign = (params: Record<string, string | number>) => {
  const s = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(s + env.CLOUDINARY_API_SECRET).digest('hex');
};

export interface Uploaded { url: string; publicId: string; width: number; height: number; bytes: number; format: string }

/** Persistent storage: files live on Cloudinary, only the permanent URL + metadata is stored in MongoDB. */
export async function uploadImage(buffer: Buffer, mime: string, folder: string): Promise<Uploaded> {
  if (!configured()) throw new ApiError(503, 'Image storage is not configured. Set the CLOUDINARY_* environment variables.');
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: `origin/${folder}`, timestamp };
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mime }), 'upload');
  form.append('api_key', env.CLOUDINARY_API_KEY!);
  form.append('timestamp', String(timestamp));
  form.append('folder', params.folder);
  form.append('signature', sign(params));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new ApiError(502, 'Image upload failed at the storage provider.');
  const d = (await res.json()) as { secure_url: string; public_id: string; width: number; height: number; bytes: number; format: string };
  return { url: d.secure_url, publicId: d.public_id, width: d.width, height: d.height, bytes: d.bytes, format: d.format };
}

export async function destroyImage(publicId: string): Promise<void> {
  if (!configured()) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY!);
  form.append('timestamp', String(timestamp));
  form.append('signature', sign({ public_id: publicId, timestamp }));
  await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: form }).catch(() => undefined);
}
