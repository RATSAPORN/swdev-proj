import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { User, Shop, Reservation } from "../models/index.js";
import { shops } from "./catalog.js";
export async function connectDatabase({ temporary = false } = {}) {
  let embedded;
  let uri = temporary ? undefined : process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "production")
      throw new Error("MONGODB_URI is required in production.");
    embedded = await MongoMemoryServer.create({
      instance: temporary
        ? {}
        : {
            dbPath: fileURLToPath(new URL("../../data", import.meta.url)),
            storageEngine: "wiredTiger",
          },
      binary: {
        downloadDir: fileURLToPath(
          new URL("../../.cache/mongodb", import.meta.url),
        ),
      },
    });
    uri = embedded.getUri("sabai");
  }
  await mongoose.connect(uri);
  await Promise.all([User.init(), Shop.init(), Reservation.init()]);
  //if ((await Shop.countDocuments()) === 0) await Shop.insertMany(shops);
  await Shop.bulkWrite(
  shops.map((s) => ({
    updateOne: {
      filter: { name: s.name },
      update: { $set: s },
      upsert: true,
    },
  })),
);
  if (!temporary && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 12)
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    if (!(await User.exists({ email })))
      await User.create({
        name: process.env.ADMIN_NAME || "Administrator",
        telephone: "Not provided",
        email,
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: "admin",
      });
  }
  console.log("📌 My MongoDB URI is:", uri);
  return {
    uri,
    close: async () => {
      await mongoose.disconnect();
      await embedded?.stop();
    },
  };
}
