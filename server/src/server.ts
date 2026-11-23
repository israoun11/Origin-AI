import { env } from './config/env';
import { connectDb } from './config/db';
import { createApp } from './app';

async function main() {
  await connectDb();
  createApp().listen(env.PORT, () => console.log(`ORIGIN API listening on :${env.PORT}`));
}
main().catch((e) => {
  console.error('Failed to start', e);
  process.exit(1);
});
