import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getAdminReservations } from "../controllers/reservations.js";
const router = Router();
router.get("/reservations", auth, getAdminReservations);
export default router;
