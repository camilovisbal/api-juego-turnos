import type { NextFunction, Request, Response } from "express";

type AppError = Error & { status?: number; type?: string; errors?: Record<string, string> };

// Cualquier ruta que no exista responde 404 en JSON.
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe.` });
}

// Errores que no se controlaron en las rutas. Tiene 4 parámetros para que Express sepa que es de errores,
// aunque next no se use (por eso se llama _next).
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  // express.json() avisa así cuando el body no es un JSON válido.
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
    return;
  }

  // Errores lanzados con HttpError desde los servicios (400, 401, 403, 404, 409).
  if (err.status && err.status < 500) {
    res.status(err.status).json(err.errors ? { error: err.message, errors: err.errors } : { error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
}
