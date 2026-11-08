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
    license: {
      type: String,
      match: /^(สส|นส)\d{2}(01|02)\d{5}-\d{2}$/,
      },
    capacity: { 
      type: Number, 
      default: 3, min: 1 
    },
    description: String,
    image: String,
    tags: [String],
  }),
);
