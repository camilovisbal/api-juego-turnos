import type { Fighter } from "../types.js";

// Turnos propios que hay que esperar después de usar la habilidad especial.
// Con 2, la habilidad se puede usar una vez cada 3 turnos propios.
export const SPECIAL_COOLDOWN = 2;

// Curaciones que tiene cada personaje por partida. Sin límite, curarse siempre empataría el combate.
export const HEALS_PER_FIGHTER = 2;

// Porcentaje de la vida máxima que recupera una curación.
export const HEAL_PERCENT = 30;

// Daño de un ataque normal: el ataque menos la mitad de la defensa del rival. Mínimo 1.
export function attackDamage(attack: number, defense: number): number {
  return Math.max(1, attack - Math.floor(defense / 2));
}

// Si el rival se defendió, recibe la mitad del daño (mínimo 1).
export function applyDefense(damage: number, defending: boolean): number {
  return defending ? Math.max(1, Math.floor(damage / 2)) : damage;
}

// Daño de la habilidad especial. Devuelve una lista porque el arquero hace dos golpes.
export function specialHits(actor: Fighter, target: Fighter): number[] {
  switch (actor.class) {
    // Golpe demoledor: 1.25 veces el ataque y no cuenta la defensa del rival.
    case "guerrero":
      return [Math.round(actor.attack * 1.25)];
    // Bola de fuego: 1.8 veces el ataque, menos la mitad de la defensa.
    case "mago":
      return [Math.max(1, Math.floor(actor.attack * 1.8) - Math.floor(target.defense / 2))];
    // Doble disparo: dos ataques normales seguidos.
    case "arquero":
      return [attackDamage(actor.attack, target.defense), attackDamage(actor.attack, target.defense)];
  }
}

// Vida que recupera al curarse, sin pasarse nunca de la vida máxima.
export function healAmount(fighter: Fighter): number {
  const heal = Math.floor((fighter.maxHealth * HEAL_PERCENT) / 100);
  return Math.min(heal, fighter.maxHealth - fighter.health);
}
