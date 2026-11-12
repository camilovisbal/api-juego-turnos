import express, { type Request, type Response } from "express";
import authRoutes from "./routes/auth.routes.js";
import playersRoutes from "./routes/players.routes.js";
import charactersRoutes from "./routes/characters.routes.js";
import classesRoutes from "./routes/classes.routes.js";
import gamesRoutes from "./routes/games.routes.js";
import { logger } from "./middlewares/logger.js";
import { requireAuth } from "./middlewares/auth.js";
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

// Registro e inicio de sesión: son las únicas rutas que no piden token.
app.use("/api", authRoutes);

// Desde aquí todas las rutas pasan primero por requireAuth.
app.use("/api/players", requireAuth, playersRoutes);
app.use("/api/classes", requireAuth, classesRoutes);
app.use("/api/characters", requireAuth, charactersRoutes);
app.use("/api/games", requireAuth, gamesRoutes);

// 3. Errores al final.
app.use(notFound);
app.use(errorHandler);

export default app;
