import mongoose from "mongoose";
const { Schema } = mongoose;
export const User = mongoose.model(
  "User",
  new Schema(
    {
      name: { type: String, required: true },
      telephone: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      passwordHash: { type: String, select: false, required: true },
      role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    { timestamps: true },
  ),
);
