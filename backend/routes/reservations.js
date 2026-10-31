import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../controllers/reservations.js";
const router = Router();
router.use(auth);
router.get("/", getReservations);
router.post("/", createReservation);
router.patch("/:id", updateReservation);
router.delete("/:id", deleteReservation);
export default router;
