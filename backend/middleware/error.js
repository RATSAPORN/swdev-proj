import { z } from "zod";
export const errorHandler = (error, req, res, next) => {
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  if (error.code === 11000)
    return res.status(409).json({ error: "This record already exists." });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error:
      status >= 500 ? "Something went wrong. Please try again." : error.message,
  });
};
