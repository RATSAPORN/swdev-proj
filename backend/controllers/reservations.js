import mongoose from "mongoose";
import { Shop, Reservation } from "../models/index.js";
import { services } from "../config/catalog.js";
import { booking } from "../config/validation.js";
import { fail } from "../utils/error.js";
const validatedBooking = async (body, excludeId = null) => {
  const data = booking.parse(body);
  const shop = await Shop.findById(data.shop);
  if (!shop) throw fail(404, "This shop could not be found.");
  const service = services.find((s) => s.id === data.service);
  if (
    !service ||
    !service.prices[data.duration] ||
    !shop.tags.includes(service.category)
  )
    throw fail(400, "Choose an available treatment and duration.");
  const startsAt = new Date(`${data.date}T${data.time}:00+07:00`);
  if (
    !Number.isFinite(+startsAt) ||
    startsAt.toISOString().slice(0, 10) !== data.date ||
    startsAt <= new Date()
  )
    throw fail(400, "Choose a valid future date and time.");
  const minute = (value) =>
    Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  if (
    minute(data.time) < minute(shop.opens) ||
    minute(data.time) + data.duration > minute(shop.closes)
  )
    throw fail(400, "The treatment must fit within shop opening hours.");
    const endsAt = new Date(+startsAt + data.duration * 60000);
    const taken = await Reservation.countDocuments({
      shop: shop._id,
      active: true,
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (taken >= shop.capacity)
      throw fail(409, "This time slot is fully booked. Please choose another time.");
  return {
    ...data,
    startsAt,
    endsAt,
    price: service.prices[data.duration],
  };
};
const placeReservation = async (user, data, id = null) => {
  await Reservation.updateMany(
    { user, active: true, endsAt: { $lte: new Date() } },
    { active: false },
  );
  for (let slot = 1; slot <= 3; slot++) {
    try {
      const fields = { ...data, user, slot, active: true };
      const reservation = id
        ? await Reservation.findOneAndUpdate(
            { _id: id, user },
            { $set: fields },
            { new: true, runValidators: true },
          )
        : await Reservation.create(fields);
      if (!reservation) throw fail(404, "Reservation not found.");
      return reservation.populate("shop");
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw fail(
    409,
    "You can have up to 3 upcoming reservations. Cancel one before booking another.",
  );
};
const ownedReservation = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw fail(404, "Reservation not found.");
  const item = await Reservation.findOne({
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id }),
  });
  if (!item) throw fail(404, "Reservation not found.");
  return item;
};
export const getReservations = async (req, res) =>
  res.json({
    reservations: await Reservation.find({ user: req.user._id })
      .populate("shop")
      .sort({ startsAt: 1 }),
  });
export const getAdminReservations = async (req, res) => {
  if (req.user.role !== "admin")
    throw fail(403, "Administrator access is required.");
  res.json({
    reservations: await Reservation.find()
      .populate("shop")
      .populate("user", "name email telephone")
      .sort({ startsAt: 1 }),
  });
};
export const createReservation = async (req, res) => {
  const data = await validatedBooking(req.body);
  res
    .status(201)
    .json({ reservation: await placeReservation(req.user._id, data) });
};
export const updateReservation = async (req, res) => {
  const item = await ownedReservation(req);
  const data = await validatedBooking(req.body, item._id);
  res.json({
    reservation: await placeReservation(item.user, data, item._id),
  });
};
export const deleteReservation = async (req, res) => {
  const item = await ownedReservation(req);
  await item.deleteOne();
  res.json({ ok: true });
};
