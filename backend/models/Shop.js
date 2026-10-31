import mongoose from "mongoose";
const { Schema } = mongoose;
export const Shop = mongoose.model(
  "Shop",
  new Schema({
    name: String,
    neighborhood: String,
    address: String,
    telephone: String,
    opens: String,
    closes: String,
    description: String,
    image: String,
    tags: [String],
  }),
);
