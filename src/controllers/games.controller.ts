import type { Request, Response } from "express";
import * as gamesService from "../services/games.service.js";
import * as playersService from "../services/players.service.js";
import { currentPlayer } from "../middlewares/auth.js";
import { parseId } from "../utils/parseId.js";
import { validateJoinGame, validateNewGame } from "../utils/validateGame.js";
import type { Game, GameStatus, JoinGameBody, NewGameBody } from "../types.js";

const STATUSES: GameStatus[] = ["Pendiente", "En curso", "Finalizada", "Cancelada"];

function findGame(idParam: string, res: Response): Game | undefined {
  const id = parseId(idParam, "de la partida");
  const game = gamesService.findById(id);

  if (!game) {
    res.status(404).json({ error: `No existe una partida con el id ${id}.` });
  }

  return game;
}

// GET /api/games
// Filtros: ?status=Pendiente, ?mine=true (en las que juego) y ?available=true (a las que me puedo unir).
export function getGames(req: Request, res: Response) {
  const { status, mine, available } = req.query;
  const player = currentPlayer(res);

  if (status !== undefined && !STATUSES.includes(status as GameStatus)) {
    res.status(400).json({ error: `El estado debe ser uno de estos: ${STATUSES.join(", ")}.` });
    return;
  }

  const games = gamesService.getAll({
    status: status as GameStatus | undefined,
    playerId: mine === "true" ? player.id : undefined,
    availableFor: available === "true" ? player.id : undefined,
  });

  res.json(games.map(gamesService.toView));
}

// GET /api/games/:id
export function getGame(req: Request<{ id: string }>, res: Response) {
  const game = findGame(req.params.id, res);

  if (game) {
    res.json(gamesService.toView(game));
  }
}

// POST /api/games
// Body: { "characterIds": [1, 2], "mode": "jugador", "invitedPlayerId": 2 } o { "characterIds": [1], "mode": "sistema" }
export function createGame(req: Request<{}, {}, NewGameBody>, res: Response) {
  const player = currentPlayer(res);
  const result = validateNewGame(req.body ?? {});

  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos en la partida.", errors: result.errors });
    return;
  }

  if (result.invitedPlayerId !== null) {
    if (result.invitedPlayerId === player.id) {
      res.status(400).json({ error: "No te puedes invitar a ti mismo." });
      return;
    }

    if (!playersService.findById(result.invitedPlayerId)) {
      res.status(404).json({ error: `No existe un jugador con el id ${result.invitedPlayerId}.` });
      return;
    }
  }

  // 404, 403 o 409 si algún personaje no existe, no es suyo o ya está jugando.
  const characters = gamesService.getTeamCharacters(result.characterIds, player.id);
  const game = gamesService.create(player, characters, result.mode, result.invitedPlayerId);

  res.status(201).json(gamesService.toView(game));
}

// POST /api/games/:id/join
// Body: { "characterIds": [3, 4] }
export function joinGame(req: Request<{ id: string }, {}, JoinGameBody>, res: Response) {
  const game = findGame(req.params.id, res);

  if (!game) {
    return;
  }

  const player = currentPlayer(res);
  const result = validateJoinGame(req.body ?? {});

  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos para unirse.", errors: result.errors });
    return;
  }

  // Primero las reglas de la partida (409 o 403) y después los personajes elegidos.
  gamesService.assertCanJoin(game, player.id);
  const characters = gamesService.getTeamCharacters(result.characterIds, player.id);
  gamesService.join(game, player, characters);

  res.json(gamesService.toView(game));
}
