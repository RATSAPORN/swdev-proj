import { Router } from "express";
import { getShops } from "../controllers/shops.js";
const router = Router();
router.get("/", getShops);
export default router;
