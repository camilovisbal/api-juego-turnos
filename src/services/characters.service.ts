import type { Character, CharacterClass, Stats } from "../types.js";
import { CLASS_INFO, MAX_LEVEL, STAT_NAMES } from "../data/classes.js";
import { XP_PER_LEVEL } from "../utils/formulas.js";

// Los personajes viven en la memoria del servidor, igual que los jugadores.
let characters: Character[] = [];
let nextId = 1;

export function getAll(filters: { ownerId?: number; characterClass?: CharacterClass } = {}): Character[] {
  return characters.filter(
    (character) =>
      (filters.ownerId === undefined || character.ownerId === filters.ownerId) &&
      (filters.characterClass === undefined || character.class === filters.characterClass)
  );
}

export function findById(id: number): Character | undefined {
  return characters.find((character) => character.id === id);
}

export function findByOwnerAndName(ownerId: number, name: string): Character | undefined {
  return characters.find(
    (character) => character.ownerId === ownerId && character.name.toLowerCase() === name.toLowerCase()
  );
}

export function create(ownerId: number, data: { name: string; class: CharacterClass; stats: Stats }): Character {
  const character: Character = {
    id: nextId++,
    ownerId,
    name: data.name,
    class: data.class,
    level: 1,
    experience: 0,
    ...data.stats,
    createdAt: new Date().toISOString(),
  };

  characters = [...characters, character];
  return character;
}

export function update(id: number, changes: Partial<Character>): Character {
  const character = findById(id) as Character;
  Object.assign(character, changes);
  return character;
}

// Devuelve el personaje eliminado, o undefined si no existía.
export function remove(id: number): Character | undefined {
  const character = findById(id);

  if (character) {
    characters = characters.filter((item) => item.id !== id);
  }

  return character;
}

// Suma experiencia. Por cada 100 puntos sube un nivel y cada estadística sube lo que indica su clase.
// Devuelve cuántos niveles subió.
export function addExperience(id: number, amount: number): number {
  const character = findById(id);

  if (!character) {
    return 0;
  }

  character.experience += amount;
  let levels = 0;

  while (character.experience >= XP_PER_LEVEL && character.level < MAX_LEVEL) {
    character.experience -= XP_PER_LEVEL;
    character.level += 1;
    levels += 1;

    for (const stat of STAT_NAMES) {
      character[stat] += CLASS_INFO[character.class].stats[stat].growth;
    }
  }

  return levels;
}
