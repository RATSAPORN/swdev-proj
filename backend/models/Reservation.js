import mongoose from "mongoose";
const { Schema } = mongoose;
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    date: String,
    time: String,
    startsAt: Date,
    endsAt: Date,
    service: String,
    duration: Number,
    price: Number,
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    slot: { type: Number, min: 1, max: 3 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
// A unique database constraint prevents concurrent requests from exceeding three bookings.
schema.index(
  { user: 1, slot: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
export const Reservation = mongoose.model("Reservation", schema);
