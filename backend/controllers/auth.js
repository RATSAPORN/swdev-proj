import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { registration, login as loginSchema } from "../config/validation.js";
import { fail } from "../utils/error.js";
const publicUser = (u) => ({
  _id: u.id,
  name: u.name,
  telephone: u.telephone,
  email: u.email,
  role: u.role,
});
const signIn = async (req, user) => {
  await new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
  req.session.userId = user.id;
  await new Promise((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
};
export const register = async (req, res) => {
  const data = registration.parse(req.body);
  if (await User.exists({ email: data.email }))
    throw fail(409, "An account with this email already exists.");
  const { password, ...profile } = data;
  const user = await User.create({
    ...profile,
    passwordHash: await bcrypt.hash(password, 12),
  });
  await signIn(req, user);
  res.status(201).json({ user: publicUser(user) });
};
export const login = async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select(
    "+passwordHash",
  );
  const valid = await bcrypt.compare(
    data.password,
    user?.passwordHash ||
      "$2b$12$CpI7dBtCPjkTaVXo2qC1xeXpVN3IfCxzFmrbPx2vPMlHJcjvfC3ai",
  );
  if (!user || !valid) throw fail(401, "Email or password is incorrect.");
  await signIn(req, user);
  res.json({ user: publicUser(user) });
};
export const logout = (req, res, next) =>
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("sabai.sid").json({ ok: true });
  });
export const getMe = async (req, res) => {
  const user = req.session.userId
    ? await User.findById(req.session.userId)
    : null;
  res.json({ user: user ? publicUser(user) : null });
};
