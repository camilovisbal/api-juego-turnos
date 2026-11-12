import express, { type Request, type Response } from "express";
import authRoutes from "./routes/auth.routes.js";
import playersRoutes from "./routes/players.routes.js";
import charactersRoutes from "./routes/characters.routes.js";
import classesRoutes from "./routes/classes.routes.js";
import gamesRoutes from "./routes/games.routes.js";
import demoRoutes from "./routes/demo.routes.js";
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
  res.json({
    mensaje: "API del juego por turnos funcionando",
    endpoints: [
      "POST /api/register",
      "POST /api/login",
      "POST /api/logout",
      "GET /api/players",
      "GET /api/players/:id (o /api/players/me)",
      "PUT /api/players/:id (o /api/players/me)",
      "GET /api/players/:id/statistics",
      "GET /api/classes",
      "GET /api/characters?playerId=&class=",
      "GET /api/characters/:id",
      "POST /api/characters",
      "PUT /api/characters/:id",
      "DELETE /api/characters/:id",
      "POST /api/games",
      "GET /api/games?status=&mine=true&available=true",
      "GET /api/games/:id",
      "POST /api/games/:id/join",
      "POST /api/games/:id/actions",
      "GET /api/games/:id/history",
      "POST /api/games/:id/finish",
      "POST /api/games/:id/cancel",
      "POST /api/demo/reset",
    ],
  });
});

// Registro e inicio de sesión no piden token.
app.use("/api", authRoutes);

// Reinicia los datos de prueba. Es solo para las demostraciones.
app.use("/api/demo", demoRoutes);

// Desde aquí todas las rutas pasan primero por requireAuth.
app.use("/api/players", requireAuth, playersRoutes);
app.use("/api/classes", requireAuth, classesRoutes);
app.use("/api/characters", requireAuth, charactersRoutes);
app.use("/api/games", requireAuth, gamesRoutes);

// 3. Errores al final.
app.use(notFound);
app.use(errorHandler);

export default app;
