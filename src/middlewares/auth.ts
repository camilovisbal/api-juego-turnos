import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import * as playersService from "../services/players.service.js";
import type { Player } from "../types.js";

// Revisa el header Authorization: Bearer <token>. Si el token es válido guarda el jugador
// en res.locals para que los controladores sepan quién hizo la petición.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Falta el token. Inicia sesión y envíalo en el header Authorization: Bearer <token>." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const playerId = authService.getPlayerId(token);
  const player = playerId === undefined ? undefined : playersService.findById(playerId);

  if (!player) {
    res.status(401).json({ error: "El token no es válido o ya venció. Vuelve a iniciar sesión." });
    return;
  }

  res.locals.player = player;
  res.locals.token = token;
  next();
}

// El jugador que inició sesión. Solo se usa en rutas que pasan por requireAuth.
export function currentPlayer(res: Response): Player {
  return res.locals.player as Player;
}
