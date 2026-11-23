# ORIGIN: specialty coffee platform

Monorepo: `client/` (React 18, TypeScript, Vite, Tailwind, Framer Motion, React Three Fiber) and `server/` (Express, TypeScript, Mongoose, Zod).

## Run locally
1. Install Node 20+ and have a MongoDB (local or Atlas) ready.
2. `npm run install:all`
3. `cp server/.env.example server/.env` and fill it in (see variables below).
4. `npm run seed` (creates 6 origins, 6 coffees, 5 articles, default homepage content and the admin account; safe to re-run).
5. Terminal A: `npm run dev:server` (API on :4000). Terminal B: `npm run dev:client` (site on :5173, `/api` proxied to the API).
6. Admin: http://localhost:5173/admin/login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Environment variables (server/.env)
| Variable | Required | Purpose |
|---|---|---|
| MONGODB_URI | yes | MongoDB connection string |
| JWT_SECRET | yes | 32+ random characters |
| CLIENT_URL | yes | Frontend origin for CORS (single URL) |
| SERVER_URL | no | Public API URL |
| ADMIN_EMAIL, ADMIN_PASSWORD (10+ chars) | for seed | Initial admin, created by `npm run seed` |
| GEMINI_API_KEY, GEMINI_MODEL | for AI Barista | Without a key the Barista answers with a clear 503 |
| CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET | for images | Persistent media storage; uploads return 503 until set |

Client (`client/.env`): `VITE_API_URL` only in production (e.g. `https://your-api.onrender.com/api/v1`).

## Images
No photographs ship with the project. Upload them in **Admin > Media library**, then assign them to coffees, origins, articles and homepage sections. Until then the site shows designed typographic fallbacks. Replacing a file keeps every reference; deleting detaches it everywhere.

## Deploy
- Database: MongoDB Atlas (allow Render's IPs, use the connection string as MONGODB_URI).
- API on Render: root `server`, build `npm install && npm run build`, start `npm start`, health check `/health`, set all server variables. Run `npm run seed` once (Render shell or locally against Atlas).
- Frontend on Vercel: root `client`, framework Vite, set `VITE_API_URL`. `vercel.json` rewrites nested routes to `index.html`. Set the API's `CLIENT_URL` to the Vercel URL.

## Tests
`npm test` runs unit tests for recipe range validation and slugs. API/E2E tests are not included yet.
