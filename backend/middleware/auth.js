import { User } from "../models/User.js";
import { fail } from "../utils/error.js";
export const auth = async (req, res, next) => {
  req.user = req.session.userId
    ? await User.findById(req.session.userId)
    : null;
  if (!req.user) throw fail(401, "Please sign in to continue.");
  next();
};
