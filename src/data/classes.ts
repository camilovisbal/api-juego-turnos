import type { CharacterClass, StatName, Stats } from "../types.js";

export const CLASSES: CharacterClass[] = ["guerrero", "mago", "arquero"];

export const STAT_NAMES: StatName[] = ["health", "attack", "defense", "speed"];

export const MAX_LEVEL = 10;

// Valores de nivel 1. base es el valor por defecto; min y max son los límites si el jugador
// quiere ajustar sus estadísticas. growth es lo que sube cada estadística por cada nivel.
interface StatRange {
  min: number;
  base: number;
  max: number;
  growth: number;
}

interface ClassInfo {
  description: string;
  special: { name: string; description: string };
  stats: Record<StatName, StatRange>;
}

export const CLASS_INFO: Record<CharacterClass, ClassInfo> = {
  guerrero: {
    description: "Mucha vida y defensa, pero es el más lento.",
    special: { name: "Golpe demoledor", description: "Golpe que ignora toda la defensa del rival." },
    stats: {
      health: { min: 70, base: 80, max: 90, growth: 8 },
      attack: { min: 14, base: 16, max: 18, growth: 2 },
      defense: { min: 8, base: 10, max: 12, growth: 2 },
      speed: { min: 6, base: 8, max: 10, growth: 1 },
    },
  },
  mago: {
    description: "El ataque más alto, pero poca vida y casi nada de defensa.",
    special: { name: "Bola de fuego", description: "Hace casi el doble del daño de un ataque normal." },
    stats: {
      health: { min: 50, base: 60, max: 70, growth: 6 },
      attack: { min: 19, base: 22, max: 25, growth: 3 },
      defense: { min: 2, base: 4, max: 6, growth: 1 },
      speed: { min: 8, base: 10, max: 12, growth: 1 },
    },
  },
  arquero: {
    description: "El más rápido, casi siempre empieza la partida.",
    special: { name: "Doble disparo", description: "Dispara dos flechas seguidas en el mismo turno." },
    stats: {
      health: { min: 55, base: 65, max: 75, growth: 6 },
      attack: { min: 16, base: 18, max: 20, growth: 2 },
      defense: { min: 4, base: 6, max: 8, growth: 1 },
      speed: { min: 13, base: 15, max: 17, growth: 2 },
    },
  },
};

// Límites de una estadística para una clase y un nivel. Cada nivel suma growth a los tres valores.
export function statRange(characterClass: CharacterClass, stat: StatName, level: number) {
  const { min, base, max, growth } = CLASS_INFO[characterClass].stats[stat];
  const bonus = growth * (level - 1);
  return { min: min + bonus, base: base + bonus, max: max + bonus };
}

// Las estadísticas por defecto de una clase en un nivel.
export function baseStats(characterClass: CharacterClass, level: number): Stats {
  return {
    health: statRange(characterClass, "health", level).base,
    attack: statRange(characterClass, "attack", level).base,
    defense: statRange(characterClass, "defense", level).base,
    speed: statRange(characterClass, "speed", level).base,
  };
}
