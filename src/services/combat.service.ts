import type { ActionName, Character, Fighter, Game, HistoryEntry, Team, TeamSide } from "../types.js";
import { HttpError } from "../utils/httpError.js";
import {
  HEALS_PER_FIGHTER,
  SPECIAL_COOLDOWN,
  applyDefense,
  attackDamage,
  healAmount,
  specialHits,
} from "../utils/formulas.js";

// ---------- Ayudas ----------

// Copia el personaje para usarlo en la partida, con la vida llena.
export function toFighter(character: Character): Fighter {
  return {
    characterId: character.id,
    name: character.name,
    class: character.class,
    level: character.level,
    maxHealth: character.health,
    health: character.health,
    attack: character.attack,
    defense: character.defense,
    speed: character.speed,
    defending: false,
    specialCooldown: 0,
    healsLeft: HEALS_PER_FIGHTER,
    defeated: false,
  };
}

// El personaje que está peleando: el primero del equipo que no ha sido derrotado.
export function activeFighter(team: Team): Fighter | undefined {
  return team.fighters.find((fighter) => !fighter.defeated);
}

export function getTeam(game: Game, side: TeamSide): Team {
  return side === "creator" ? game.creator : (game.opponent as Team);
}

export function otherSide(side: TeamSide): TeamSide {
  return side === "creator" ? "opponent" : "creator";
}

export function addEntry(game: Game, entry: Omit<HistoryEntry, "turn" | "createdAt">): void {
  game.history.push({ turn: game.turn, ...entry, createdAt: new Date().toISOString() });
}

export function addEvent(game: Game, message: string): void {
  addEntry(game, { type: "evento", message });
}

// ---------- Inicio de la partida ----------

// Empieza el equipo cuyo primer personaje tenga más velocidad. Si empatan, empieza quien creó la partida.
export function startGame(game: Game): void {
  const creatorFighter = activeFighter(game.creator) as Fighter;
  const opponentFighter = activeFighter(getTeam(game, "opponent")) as Fighter;

  game.status = "En curso";
  game.startedAt = new Date().toISOString();
  game.turn = 1;
  game.turnOf = opponentFighter.speed > creatorFighter.speed ? "opponent" : "creator";

  const first = getTeam(game, game.turnOf);
  const speeds = `${creatorFighter.name} ${creatorFighter.speed} contra ${opponentFighter.name} ${opponentFighter.speed}`;

  if (creatorFighter.speed === opponentFighter.speed) {
    addEvent(game, `La partida comenzó. La velocidad está empatada (${speeds}), empieza ${first.playerName} por haber creado la partida.`);
  } else {
    addEvent(game, `La partida comenzó. Empieza ${first.playerName} porque su personaje es más rápido (${speeds}).`);
  }
}

// ---------- Fin de la partida ----------

// Marca la partida como finalizada y guarda el ganador.
export function finishGame(game: Game, winnerSide: TeamSide, message: string): void {
  const winner = getTeam(game, winnerSide);

  game.status = "Finalizada";
  game.turnOf = null;
  game.winnerPlayerId = winner.playerId;
  game.winnerName = winner.playerName;
  game.finishedAt = new Date().toISOString();

  addEvent(game, message);
}

// ---------- Acciones ----------

// Resta el daño sin bajar de 0. Si llega a 0 el personaje queda derrotado.
function receiveDamage(target: Fighter, damage: number): number {
  const real = applyDefense(damage, target.defending);
  target.health = Math.max(0, target.health - real);

  if (target.health === 0) {
    target.defeated = true;
  }

  return real;
}

// Revisa las reglas de la acción antes de cambiar nada. Si algo falla lanza 409
// y la partida queda igual, así el jugador puede elegir otra acción en el mismo turno.
function checkAction(actor: Fighter, action: ActionName): void {
  if (actor.defeated) {
    throw new HttpError(409, `${actor.name} está derrotado y no puede actuar.`);
  }

  if (action === "habilidad" && actor.specialCooldown > 0) {
    throw new HttpError(409, `La habilidad especial de ${actor.name} estará lista en ${actor.specialCooldown} turno(s).`);
  }

  if (action === "curar" && actor.healsLeft === 0) {
    throw new HttpError(409, `${actor.name} ya usó sus ${HEALS_PER_FIGHTER} curaciones.`);
  }

  if (action === "curar" && actor.health === actor.maxHealth) {
    throw new HttpError(409, `${actor.name} tiene la vida completa (${actor.health}/${actor.maxHealth}) y no puede pasar del máximo.`);
  }
}

// Ejecuta una acción del equipo side. Después de una acción válida cambia el turno,
// salvo que el rival se haya quedado sin personajes: en ese caso termina la partida.
export function executeAction(game: Game, side: TeamSide, action: ActionName): void {
  const team = getTeam(game, side);
  const enemyTeam = getTeam(game, otherSide(side));
  const actor = activeFighter(team) as Fighter;
  const target = activeFighter(enemyTeam) as Fighter;

  checkAction(actor, action);

  // La defensa dura hasta que el personaje vuelve a actuar.
  actor.defending = false;
  const base = { type: "accion" as const, player: team.playerName, actor: actor.name, action };

  if (action === "atacar" || action === "habilidad") {
    const hits = action === "atacar" ? [attackDamage(actor.attack, target.defense)] : specialHits(actor, target);
    const wasDefending = target.defending;
    let damage = 0;

    for (const hit of hits) {
      if (!target.defeated) {
        damage += receiveDamage(target, hit);
      }
    }

    let message =
      action === "atacar"
        ? `${actor.name} atacó a ${target.name} e hizo ${damage} de daño.`
        : `${actor.name} usó su habilidad especial contra ${target.name} e hizo ${damage} de daño.`;

    if (wasDefending) {
      message += ` ${target.name} se estaba defendiendo y recibió la mitad.`;
    }

    addEntry(game, { ...base, target: target.name, damage, targetHealth: target.health, actorHealth: actor.health, message });
  }

  if (action === "defender") {
    actor.defending = true;
    addEntry(game, {
      ...base,
      actorHealth: actor.health,
      message: `${actor.name} se puso en guardia: el próximo daño que reciba se reduce a la mitad.`,
    });
  }

  if (action === "curar") {
    const healing = healAmount(actor);
    actor.health += healing;
    actor.healsLeft -= 1;
    addEntry(game, {
      ...base,
      healing,
      actorHealth: actor.health,
      message: `${actor.name} se curó ${healing} puntos de vida (${actor.health}/${actor.maxHealth}).`,
    });
  }

  // Enfriamiento de la habilidad: se reinicia al usarla y baja 1 con cada otra acción.
  actor.specialCooldown = action === "habilidad" ? SPECIAL_COOLDOWN : Math.max(0, actor.specialCooldown - 1);

  if (target.defeated) {
    addEvent(game, `${target.name} quedó fuera de combate.`);
    const next = activeFighter(enemyTeam);

    if (!next) {
      finishGame(game, side, `${team.playerName} ganó la partida: ${enemyTeam.playerName} se quedó sin personajes.`);
      return;
    }

    addEvent(game, `Entra ${next.name} por el equipo de ${enemyTeam.playerName} (${next.health}/${next.maxHealth} de vida).`);
  }

  // Cambio de turno.
  game.turn += 1;
  game.turnOf = otherSide(side);
}

// POST /api/games/:id/actions. Revisa que la partida esté en curso y que sea el turno de quien juega.
// Devuelve lo que pasó en este turno (las entradas nuevas del historial).
export function playTurn(game: Game, playerId: number, action: ActionName): HistoryEntry[] {
  if (game.status !== "En curso") {
    throw new HttpError(409, `La partida está ${game.status}, no se pueden hacer acciones.`);
  }

  const side: TeamSide | undefined =
    game.creator.playerId === playerId ? "creator" : game.opponent?.playerId === playerId ? "opponent" : undefined;

  if (!side) {
    throw new HttpError(403, "No participas en esta partida.");
  }

  // Como el turno cambia después de cada acción válida, esto también impide hacer dos acciones en el mismo turno.
  if (game.turnOf !== side) {
    throw new HttpError(409, `No es tu turno. Ahora juega ${getTeam(game, otherSide(side)).playerName}.`);
  }

  const start = game.history.length;
  executeAction(game, side, action);

  return game.history.slice(start);
}
