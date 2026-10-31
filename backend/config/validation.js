import { z } from "zod";
export const registration = z.object({
  name: z.string().trim().min(2).max(80),
  telephone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{8,20}$/, "Enter a valid telephone number"),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(72),
});
export const login = registration
  .pick({ email: true, password: true })
  .extend({ password: z.string().min(1).max(72) });
export const booking = z.object({
  shop: z.string().regex(/^[a-f\d]{24}$/i),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/),
  service: z.string(),
  duration: z.number().int(),
});
