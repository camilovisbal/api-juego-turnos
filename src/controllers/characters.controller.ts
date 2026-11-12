import type { Request, Response } from "express";
import * as charactersService from "../services/characters.service.js";
import * as playersService from "../services/players.service.js";
import { currentPlayer } from "../middlewares/auth.js";
import { parseId } from "../utils/parseId.js";
import { validateCharacterChanges, validateNewCharacter } from "../utils/validateCharacter.js";
import { CLASSES, CLASS_INFO, MAX_LEVEL } from "../data/classes.js";
import type { Character, CharacterBody, CharacterClass } from "../types.js";

const MAX_CHARACTERS = 6;

// Busca el personaje del :id. Si no existe responde 404 y devuelve undefined.
function findCharacter(idParam: string, res: Response): Character | undefined {
  const id = parseId(idParam, "del personaje");
  const character = charactersService.findById(id);

  if (!character) {
    res.status(404).json({ error: `No existe un personaje con el id ${id}.` });
  }

  return character;
}

// GET /api/classes
export function getClasses(req: Request, res: Response) {
  res.json({ maxLevel: MAX_LEVEL, classes: CLASS_INFO });
}

// GET /api/characters, GET /api/characters?playerId=1 y GET /api/characters?class=mago
export function getCharacters(req: Request, res: Response) {
  const { playerId, class: characterClass } = req.query;
  const filters: { ownerId?: number; characterClass?: CharacterClass } = {};

  if (playerId !== undefined) {
    const ownerId = parseId(String(playerId), "del jugador");

    if (!playersService.findById(ownerId)) {
      res.status(404).json({ error: `No existe un jugador con el id ${ownerId}.` });
      return;
    }

    filters.ownerId = ownerId;
  }

  if (characterClass !== undefined) {
    if (!CLASSES.includes(characterClass as CharacterClass)) {
      res.status(400).json({ error: `La clase debe ser una de estas: ${CLASSES.join(", ")}.` });
      return;
    }

    filters.characterClass = characterClass as CharacterClass;
  }

  res.json(charactersService.getAll(filters));
}

// GET /api/characters/:id
export function getCharacter(req: Request<{ id: string }>, res: Response) {
  const character = findCharacter(req.params.id, res);

  if (character) {
    res.json(character);
  }
}

// POST /api/characters
// Body: { "name": "Thorin", "class": "guerrero" } y opcional { "attack": 18, "defense": 8 }
export function createCharacter(req: Request<{}, {}, CharacterBody>, res: Response) {
  const player = currentPlayer(res);
  const result = validateNewCharacter(req.body ?? {});

  // 400: datos mal escritos o estadísticas fuera del rango de la clase.
  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos en el personaje.", errors: result.errors });
    return;
  }

  // 409: límite de personajes o nombre repetido.
  if (charactersService.getAll({ ownerId: player.id }).length >= MAX_CHARACTERS) {
    res.status(409).json({ error: `Ya tienes ${MAX_CHARACTERS} personajes, que es el máximo. Elimina uno para crear otro.` });
    return;
  }

  if (charactersService.findByOwnerAndName(player.id, result.name)) {
    res.status(409).json({ error: `Ya tienes un personaje llamado ${result.name}.` });
    return;
  }

  const character = charactersService.create(player.id, result);
  res.status(201).json(character);
}

// PUT /api/characters/:id
// Body (todo opcional): { "name": "Thorin II", "class": "guerrero", "attack": 18 }
export function updateCharacter(req: Request<{ id: string }, {}, CharacterBody>, res: Response) {
  const character = findCharacter(req.params.id, res);

  if (!character) {
    return;
  }

  // 403: solo el dueño puede editarlo.
  if (character.ownerId !== currentPlayer(res).id) {
    res.status(403).json({ error: "Solo puedes editar tus propios personajes." });
    return;
  }

  const result = validateCharacterChanges(req.body ?? {}, character);

  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos en el personaje.", errors: result.errors });
    return;
  }

  const sameName = charactersService.findByOwnerAndName(character.ownerId, result.changes.name);
  if (sameName && sameName.id !== character.id) {
    res.status(409).json({ error: `Ya tienes un personaje llamado ${result.changes.name}.` });
    return;
  }

  res.json(charactersService.update(character.id, result.changes));
}

// DELETE /api/characters/:id
export function deleteCharacter(req: Request<{ id: string }>, res: Response) {
  const character = findCharacter(req.params.id, res);

  if (!character) {
    return;
  }

  if (character.ownerId !== currentPlayer(res).id) {
    res.status(403).json({ error: "Solo puedes eliminar tus propios personajes." });
    return;
  }

  charactersService.remove(character.id);
  res.status(204).end();
}
