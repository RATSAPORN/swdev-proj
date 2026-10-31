import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shops.js";
import reservationRoutes from "./routes/reservations.js";
import adminRoutes from "./routes/admin.js";
import { fail } from "./utils/error.js";
import { errorHandler } from "./middleware/error.js";
export function createApp({
  secret = process.env.SESSION_SECRET || randomBytes(48).toString("hex"),
} = {}) {
  const app = express();
  const production = process.env.NODE_ENV === "production";
  if (production && secret.length < 32)
    throw new Error("Use a SESSION_SECRET of at least 32 characters.");
  if (production) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", "https://images.unsplash.com", "data:"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("X-Requested-With") !== "Sabai" ||
        req.get("Sec-Fetch-Site") === "cross-site")
    )
      return next(
        fail(
          403,
          "Request origin could not be verified. Refresh and try again.",
        ),
      );
    next();
  });
  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    dbName: mongoose.connection.name,
  });
  app.locals.sessionStore = store;
  app.use(
    session({
      name: "sabai.sid",
      secret,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: production,
        maxAge: 7 * 86400000,
      },
    }),
  );
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60000,
      limit: 50,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again in 15 minutes." },
    }),
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/shops", shopRoutes);
  app.use("/api/reservations", reservationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));
  app.use(errorHandler);
  return app;
}
