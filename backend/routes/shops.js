import { Router } from "express";
import { getShops, getAvailability } from "../controllers/shops.js";
const router = Router();
router.get("/", getShops);
router.get("/:id/availability", getAvailability);
export default router;