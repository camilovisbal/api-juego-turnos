import type { Request, Response } from "express";
import * as playersService from "../services/players.service.js";
import * as gamesService from "../services/games.service.js";
import * as charactersService from "../services/characters.service.js";
import { currentPlayer } from "../middlewares/auth.js";
import { parseId } from "../utils/parseId.js";
import { validateProfile } from "../utils/validatePlayer.js";
import { verifyPassword } from "../utils/password.js";
import type { Player, UpdateProfileBody } from "../types.js";

// "me" es el jugador que inició sesión; cualquier otro valor tiene que ser un id.
function findPlayer(idParam: string, res: Response): Player | undefined {
  if (idParam === "me") {
    return currentPlayer(res);
  }

  const id = parseId(idParam, "del jugador");
  const player = playersService.findById(id);

  if (!player) {
    res.status(404).json({ error: `No existe un jugador con el id ${id}.` });
  }

  return player;
}

// GET /api/players
export function getPlayers(req: Request, res: Response) {
  res.json(playersService.getAll().map(playersService.toPublic));
}

// GET /api/players/:id y GET /api/players/me
export function getPlayer(req: Request<{ id: string }>, res: Response) {
  const player = findPlayer(req.params.id, res);

  if (player) {
    res.json(playersService.toPublic(player));
  }
}

// PUT /api/players/:id y PUT /api/players/me
// Body (todo opcional): { "name": "Camilo V.", "email": "nuevo@correo.com", "password": "nueva123", "currentPassword": "camilo123" }
export function updatePlayer(req: Request<{ id: string }, {}, UpdateProfileBody>, res: Response) {
  const player = findPlayer(req.params.id, res);

  if (!player) {
    return;
  }

  // 403: un jugador solo puede editar su propio perfil.
  if (player.id !== currentPlayer(res).id) {
    res.status(403).json({ error: "Solo puedes editar tu propio perfil." });
    return;
  }

  const result = validateProfile(req.body ?? {});

  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos en el perfil.", errors: result.errors });
    return;
  }

  const { changes } = result;

  // 409: el correo ya lo usa otro jugador.
  const emailOwner = changes.email ? playersService.findByEmail(changes.email) : undefined;
  if (emailOwner && emailOwner.id !== player.id) {
    res.status(409).json({ error: `Ya hay un jugador registrado con el correo ${changes.email}.` });
    return;
  }

  // Para cambiar la contraseña hay que enviar también la actual.
  if (changes.password && !verifyPassword(result.currentPassword, player.salt, player.passwordHash)) {
    res.status(400).json({
      error: "Hay datos inválidos en el perfil.",
      errors: { currentPassword: "La contraseña actual no es correcta." },
    });
    return;
  }

  const updated = playersService.update(player.id, changes);
  res.json(playersService.toPublic(updated));
}

// GET /api/players/:id/statistics y GET /api/players/me/statistics
export function getStatistics(req: Request<{ id: string }>, res: Response) {
  const player = findPlayer(req.params.id, res);

  if (!player) {
    return;
  }

  const gamesPlayed = player.wins + player.losses;
  const characters = charactersService.getAll({ ownerId: player.id });

  res.json({
    playerId: player.id,
    name: player.name,
    gamesPlayed,
    wins: player.wins,
    losses: player.losses,
    winRate: gamesPlayed === 0 ? 0 : Math.round((player.wins / gamesPlayed) * 100),
    ...gamesService.statisticsFor(player.id),
    characters: characters.map(({ id, name, class: characterClass, level, experience }) => ({
      id,
      name,
      class: characterClass,
      level,
      experience,
    })),
  });
}
