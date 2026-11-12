import type { NextFunction, Request, Response } from "express";

// Muestra en la terminal cada petición con su código de respuesta y lo que tardó.
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });

  next();
}
