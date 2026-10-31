import { Shop } from "../models/Shop.js";
import { services } from "../config/catalog.js";
export const getShops = async (req, res) =>
  res.json({ shops: await Shop.find().sort({ _id: 1 }), services });
