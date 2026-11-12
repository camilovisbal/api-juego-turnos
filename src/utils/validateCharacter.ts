import { CLASSES, STAT_NAMES, baseStats, statRange } from "../data/classes.js";
import type { Character, CharacterBody, CharacterClass, FieldErrors, Stats } from "../types.js";

const NAME_PATTERN = /^[\p{L}\p{N} '-]{2,20}$/u;

const STAT_LABELS = {
  health: "La vida",
  attack: "El ataque",
  defense: "La defensa",
  speed: "La velocidad",
};

const LEVEL_MESSAGE = "El nivel y la experiencia no se pueden asignar: todos empiezan en nivel 1 y suben ganando partidas.";

function isCharacterClass(value: unknown): value is CharacterClass {
  return typeof value === "string" && CLASSES.includes(value as CharacterClass);
}

function checkName(value: unknown): string | undefined {
  if (typeof value !== "string" || !NAME_PATTERN.test(value.trim())) {
    return "El nombre debe tener entre 2 y 20 caracteres (letras, números, espacios, ' o -).";
  }
}

function checkClass(value: unknown): string | undefined {
  if (!isCharacterClass(value)) {
    return `La clase debe ser una de estas: ${CLASSES.join(", ")}.`;
  }
}

// Revisa las estadísticas que vengan en el body. Cada una tiene que ser un entero
// dentro del rango de la clase para ese nivel, así no se puede crear un personaje con 9999 de ataque.
function checkStats(body: CharacterBody, characterClass: CharacterClass, level: number, errors: FieldErrors) {
  const stats: Partial<Stats> = {};

  for (const stat of STAT_NAMES) {
    const value = body[stat];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
      errors[stat] = `${STAT_LABELS[stat]} debe ser un número entero positivo.`;
      continue;
    }

    const { min, max } = statRange(characterClass, stat, level);

    if (value < min || value > max) {
      errors[stat] = `${STAT_LABELS[stat]} de un ${characterClass} de nivel ${level} debe estar entre ${min} y ${max}.`;
      continue;
    }

    stats[stat] = value;
  }

  return stats;
}

// POST /api/characters: nombre y clase obligatorios, estadísticas opcionales.
// Las que no vengan toman el valor por defecto de la clase.
export function validateNewCharacter(body: CharacterBody) {
  const errors: FieldErrors = {};

  const nameError = checkName(body.name);
  if (nameError) errors.name = nameError;

  const classError = checkClass(body.class);
  if (classError) errors.class = classError;

  if (body.level !== undefined || body.experience !== undefined) {
    errors.level = LEVEL_MESSAGE;
  }

  const characterClass = isCharacterClass(body.class) ? body.class : "guerrero";
  const stats = classError ? {} : checkStats(body, characterClass, 1, errors);

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    name: typeof body.name === "string" ? body.name.trim() : "",
    class: characterClass,
    stats: { ...baseStats(characterClass, 1), ...stats },
  };
}

// PUT /api/characters/:id: se cambia solo lo que venga. Si cambia la clase,
// las estadísticas que no se envíen vuelven a los valores por defecto de la nueva clase.
export function validateCharacterChanges(body: CharacterBody, character: Character) {
  const errors: FieldErrors = {};
  const sent = ["name", "class", ...STAT_NAMES].filter((key) => body[key as keyof CharacterBody] !== undefined);

  if (sent.length === 0) {
    errors.general = "Envía al menos un dato para cambiar: name, class, health, attack, defense o speed.";
  }

  if (body.name !== undefined) {
    const nameError = checkName(body.name);
    if (nameError) errors.name = nameError;
  }

  if (body.class !== undefined) {
    const classError = checkClass(body.class);
    if (classError) errors.class = classError;
  }

  if (body.level !== undefined || body.experience !== undefined) {
    errors.level = LEVEL_MESSAGE;
  }

  const newClass = isCharacterClass(body.class) ? body.class : character.class;
  const currentStats: Stats =
    newClass === character.class
      ? { health: character.health, attack: character.attack, defense: character.defense, speed: character.speed }
      : baseStats(newClass, character.level);
  const stats = errors.class ? {} : checkStats(body, newClass, character.level, errors);

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    changes: {
      name: typeof body.name === "string" ? body.name.trim() : character.name,
      class: newClass,
      ...currentStats,
      ...stats,
    },
  };
}
