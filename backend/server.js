import dotenv from "dotenv";

import { mkdir } from "node:fs/promises";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
await mkdir(new URL("../data", import.meta.url), { recursive: true });

dotenv.config({
  path: new URL("./config/config.env", import.meta.url),
});
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)
  throw new Error("SESSION_SECRET is required in production.");
const database = await connectDatabase();
const app = createApp();
const server = app.listen(process.env.PORT || 3000, () =>
  console.log(`Sabai is ready at http://localhost:${process.env.PORT || 3000}`),
);
async function shutdown() {
  server.close(async () => {
    await app.locals.sessionStore.close();
    await database.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
