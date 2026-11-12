import type { FieldErrors, GameMode, JoinGameBody, NewGameBody } from "../types.js";

export const MAX_TEAM_SIZE = 3;

const MODES: GameMode[] = ["jugador", "sistema"];

// El equipo es una lista de 1 a 3 ids de personajes, sin repetir.
export function checkCharacterIds(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_TEAM_SIZE) {
    return `Elige de 1 a ${MAX_TEAM_SIZE} personajes en characterIds, por ejemplo [1, 2].`;
  }

  if (!value.every((id) => Number.isInteger(id) && id > 0)) {
    return "Los ids de los personajes deben ser números enteros positivos.";
  }

  if (new Set(value).size !== value.length) {
    return "No puedes repetir un personaje en el equipo.";
  }
}

// POST /api/games
export function validateNewGame(body: NewGameBody) {
  const errors: FieldErrors = {};
  const mode = body.mode ?? "jugador";

  const idsError = checkCharacterIds(body.characterIds);
  if (idsError) errors.characterIds = idsError;

  if (!MODES.includes(mode as GameMode)) {
    errors.mode = `El modo debe ser "jugador" o "sistema".`;
  }

  const invited = body.invitedPlayerId;
  if (invited !== undefined && invited !== null) {
    if (mode === "sistema") {
      errors.invitedPlayerId = "En una partida contra el sistema no se invita a otro jugador.";
    } else if (!Number.isInteger(invited) || (invited as number) <= 0) {
      errors.invitedPlayerId = "El id del jugador invitado debe ser un número entero positivo.";
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    characterIds: body.characterIds as number[],
    mode: mode as GameMode,
    invitedPlayerId: Number.isInteger(invited) ? (invited as number) : null,
  };
}

// POST /api/games/:id/join
export function validateJoinGame(body: JoinGameBody) {
  const errors: FieldErrors = {};

  const idsError = checkCharacterIds(body.characterIds);
  if (idsError) errors.characterIds = idsError;

  return { errors, isValid: Object.keys(errors).length === 0, characterIds: body.characterIds as number[] };
}
