import type { Character, Game, GameMode, GameStatus, Player, Team, TeamSide } from "../types.js";
import * as charactersService from "./characters.service.js";
import {
  activeFighter,
  addEvent,
  createSystemTeam,
  finishGame,
  getTeam,
  otherSide,
  startGame,
  toFighter,
} from "./combat.service.js";
import { HttpError } from "../utils/httpError.js";

// Las partidas viven en la memoria del servidor.
let games: Game[] = [];
let nextId = 1;

export function getAll(filters: { status?: GameStatus; playerId?: number; availableFor?: number } = {}): Game[] {
  return games.filter((game) => {
    if (filters.status && game.status !== filters.status) {
      return false;
    }

    if (filters.playerId !== undefined && !isParticipant(game, filters.playerId)) {
      return false;
    }

    // Disponibles: pendientes, que no creó él, y abiertas o con invitación para él.
    if (filters.availableFor !== undefined) {
      const playerId = filters.availableFor;
      return (
        game.status === "Pendiente" &&
        game.createdBy !== playerId &&
        (game.invitedPlayerId === null || game.invitedPlayerId === playerId)
      );
    }

    return true;
  });
}

export function findById(id: number): Game | undefined {
  return games.find((game) => game.id === id);
}

export function isParticipant(game: Game, playerId: number): boolean {
  return game.creator.playerId === playerId || game.opponent?.playerId === playerId;
}

// Una partida pendiente o en curso donde está el personaje. Un personaje no puede estar en dos a la vez.
export function findActiveGameWithCharacter(characterId: number): Game | undefined {
  return games.find(
    (game) =>
      (game.status === "Pendiente" || game.status === "En curso") &&
      [game.creator, game.opponent].some((team) =>
        team?.fighters.some((fighter) => fighter.characterId === characterId)
      )
  );
}

// Revisa que los personajes elegidos existan, sean del jugador y no estén en otra partida.
export function getTeamCharacters(characterIds: number[], playerId: number): Character[] {
  return characterIds.map((id) => {
    const character = charactersService.findById(id);

    if (!character) {
      throw new HttpError(404, `No existe un personaje con el id ${id}.`);
    }

    if (character.ownerId !== playerId) {
      throw new HttpError(403, `El personaje ${character.name} (id ${id}) no es tuyo.`);
    }

    const busyGame = findActiveGameWithCharacter(id);
    if (busyGame) {
      throw new HttpError(409, `${character.name} ya está en la partida ${busyGame.id} (${busyGame.status}).`);
    }

    return character;
  });
}

function namesOf(team: Team): string {
  return team.fighters.map((fighter) => fighter.name).join(", ");
}

export function create(creator: Player, characters: Character[], mode: GameMode, invitedPlayerId: number | null): Game {
  const now = new Date().toISOString();

  const game: Game = {
    id: nextId++,
    mode,
    status: "Pendiente",
    createdBy: creator.id,
    invitedPlayerId,
    creator: { playerId: creator.id, playerName: creator.name, fighters: characters.map(toFighter) },
    opponent: null,
    turn: 0,
    turnOf: null,
    winnerPlayerId: null,
    winnerName: null,
    history: [],
    createdAt: now,
    startedAt: null,
    finishedAt: null,
  };

  addEvent(game, `${creator.name} creó la partida con ${namesOf(game.creator)}.`);

  // Contra el sistema no hay que esperar a nadie: el servidor arma el equipo rival y empieza.
  if (mode === "sistema") {
    game.opponent = createSystemTeam(game.creator, game.id);
    addEvent(game, `El sistema eligió a ${namesOf(game.opponent)}.`);
    startGame(game);
  }

  games = [...games, game];
  return game;
}

// Reglas para unirse. El controlador las revisa antes de mirar los personajes.
export function assertCanJoin(game: Game, playerId: number): void {
  if (game.status !== "Pendiente") {
    throw new HttpError(409, `No te puedes unir: la partida está ${game.status}.`);
  }

  if (game.createdBy === playerId) {
    throw new HttpError(409, "No te puedes unir a tu propia partida.");
  }

  if (game.invitedPlayerId !== null && game.invitedPlayerId !== playerId) {
    throw new HttpError(403, "Esta partida es una invitación para otro jugador.");
  }
}

export function join(game: Game, player: Player, characters: Character[]): Game {
  assertCanJoin(game, player.id);

  const size = game.creator.fighters.length;
  if (characters.length !== size) {
    throw new HttpError(400, `Esta partida es de ${size} contra ${size}: elige ${size} personaje(s).`);
  }

  game.opponent = { playerId: player.id, playerName: player.name, fighters: characters.map(toFighter) };
  addEvent(game, `${player.name} se unió con ${namesOf(game.opponent)}.`);
  startGame(game);

  return game;
}

// POST /api/games/:id/cancel. Solo el creador y solo mientras nadie se haya unido.
export function cancel(game: Game, player: Player): Game {
  if (game.createdBy !== player.id) {
    throw new HttpError(403, "Solo quien creó la partida puede cancelarla.");
  }

  if (game.status !== "Pendiente") {
    throw new HttpError(409, `Solo se puede cancelar una partida Pendiente. Esta partida está ${game.status}.`);
  }

  game.status = "Cancelada";
  game.finishedAt = new Date().toISOString();
  addEvent(game, `${player.name} canceló la partida.`);

  return game;
}

// POST /api/games/:id/finish. El jugador que la finaliza se rinde y gana el rival.
export function surrender(game: Game, player: Player): Game {
  if (!isParticipant(game, player.id)) {
    throw new HttpError(403, "No participas en esta partida.");
  }

  if (game.status !== "En curso") {
    const hint = game.status === "Pendiente" ? " Si nadie se ha unido, usa /cancel." : "";
    throw new HttpError(409, `Solo se puede finalizar una partida En curso. Esta partida está ${game.status}.${hint}`);
  }

  const loserSide: TeamSide = game.creator.playerId === player.id ? "creator" : "opponent";
  const winner = getTeam(game, otherSide(loserSide));
  finishGame(game, otherSide(loserSide), `${player.name} se rindió. ${winner.playerName} ganó la partida.`);

  return game;
}

// Lo que se responde de una partida: los equipos con su personaje activo y de quién es el turno.
// El historial completo se consulta aparte en /history.
export function toView(game: Game) {
  const teamView = (team: Team | null) =>
    team && {
      playerId: team.playerId,
      playerName: team.playerName,
      activeFighter: activeFighter(team)?.name ?? null,
      fighters: team.fighters,
    };

  return {
    id: game.id,
    mode: game.mode,
    status: game.status,
    createdBy: game.createdBy,
    invitedPlayerId: game.invitedPlayerId,
    turn: game.turn,
    turnOf: game.turnOf,
    turnOfPlayer: game.turnOf ? getTeam(game, game.turnOf).playerName : null,
    winnerPlayerId: game.winnerPlayerId,
    winnerName: game.winnerName,
    creator: teamView(game.creator),
    opponent: teamView(game.opponent),
    historyEntries: game.history.length,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
    finishedAt: game.finishedAt,
  };
}
