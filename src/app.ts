import express, { type Request, type Response } from "express";
import { logger } from "./middlewares/logger.js";
import { errorHandler, notFound } from "./middlewares/errors.js";

const app = express();

// 1. Middlewares globales.
// El logger va primero para que también registre las peticiones que fallan al leer el JSON.
app.use(logger);
app.use(express.json());

// 2. Rutas.
app.get("/", (req: Request, res: Response) => {
  res.json({ mensaje: "API del juego por turnos funcionando" });
});

// 3. Errores al final.
app.use(notFound);
app.use(errorHandler);

export default app;
