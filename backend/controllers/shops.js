import mongoose from "mongoose";
import { Shop, Reservation } from "../models/index.js";
import { services } from "../config/catalog.js";

export const getShops = async (req, res, next) => {
  let query;

  //copy req.query
  const reqQuery = { ...req.query };
  //fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach((param) => delete reqQuery[param]);

  //create query string
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );
  const filter = JSON.parse(queryStr);

  query = Shop.find(filter);

  //select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }
  //sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("_id");
  }

  //pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const total = await Shop.countDocuments(filter);
    query = query.skip(startIndex).limit(limit);
    const shops = await query;

    //pagination result
    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops,
      pagination,
      services,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: "Unable to load shops." });
  }
};

const minute = (v) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));

// GET /api/shops/:id/availability?date=YYYY-MM-DD&duration=60&exclude=<reservationId>
export const getAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = String(req.query.date || "");
    const duration = Number(req.query.duration);

    if (
      !mongoose.isValidObjectId(id) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !(duration > 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "Provide a valid shop, date and duration.",
      });
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      return res
        .status(400)
        .json({ success: false, error: "This shop could not be found." });
    }

    const dayStart = new Date(`${date}T00:00:00+07:00`);
    const dayEnd = new Date(+dayStart + 24 * 3600000);

    const busyQuery = {
      shop: id,
      active: true,
      startsAt: { $lt: dayEnd },
      endsAt: { $gt: dayStart },
    };
    //ignore the reservation being rescheduled
    if (mongoose.isValidObjectId(req.query.exclude)) {
      busyQuery._id = { $ne: req.query.exclude };
    }
    const busy = await Reservation.find(busyQuery).select("startsAt endsAt");

    const slots = [];
    for (
      let m = minute(shop.opens);
      m + duration <= minute(shop.closes);
      m += 30
    ) {
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const start = new Date(`${date}T${time}:00+07:00`);
      if (start <= new Date()) continue;
      const end = new Date(+start + duration * 60000);
      const taken = busy.filter(
        (r) => r.startsAt < end && r.endsAt > start,
      ).length;
      slots.push({
        time,
        remaining: Math.max(0, shop.capacity - taken),
        available: taken < shop.capacity,
      });
    }

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
      capacity: shop.capacity,
    });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, error: "Unable to load availability." });
  }
};