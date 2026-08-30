// Pure, Phaser-free autopilot logic so it can be unit tested in isolation
// from the scene. CorridorScene feeds this each frame and applies the
// returned InputState exactly as it would apply real keyboard input.

import { WHIP_RANGE } from './config';

export interface InputState {
  left: boolean;
  right: boolean;
  attack: boolean;
  jump: boolean;
}

export interface AutopilotLantern {
  x: number;
  gameId: string;
  broken: boolean;
}

export interface AutopilotEnemy {
  x: number;
  alive: boolean;
}

const IDLE: InputState = { left: false, right: false, attack: false, jump: false };

// Frames to wait before re-attacking the same spot. A whiffed whip (hit-test
// mismatch, odd physics frame) must retry rather than deadlock the carousel.
const ATTACK_RETRY_FRAMES = 45;

// Below this distance, facing no longer gates the attack (see update()).
const FACING_DEADZONE = 8;

/**
 * Drives the player toward the nearest unbroken lantern to the right,
 * wrapping to the leftmost unbroken lantern when none remain to the right.
 * Once every lantern is broken it cycles through all of them in order,
 * forever, so the autopilot reads as a looping carousel demo.
 *
 * Any living enemy standing BETWEEN the player and the current lantern
 * target is fought first — the walk stops at whip range, the haunt dies,
 * and the carousel continues. Enemies behind the line of travel (e.g. a
 * respawn behind the player) are ignored so the walk never ping-pongs.
 *
 * The whip only hits ahead of the player's facing direction, so when the
 * target is in range but behind the player's current facing, this walks one
 * frame toward it (flipping facing) instead of attacking into empty air.
 */
export class AutopilotController {
  private attackCooldown = 0;
  private carouselIndex = 0;

  update(
    playerX: number,
    facing: 1 | -1,
    lanterns: AutopilotLantern[],
    enemies: AutopilotEnemy[] = [],
  ): InputState {
    if (lanterns.length === 0) return IDLE;
    if (this.attackCooldown > 0) this.attackCooldown -= 1;

    const unbroken = lanterns.filter((l) => !l.broken);
    let lanternTarget: AutopilotLantern;

    if (unbroken.length === 0) {
      if (this.carouselIndex >= lanterns.length) this.carouselIndex = 0;
      lanternTarget = lanterns[this.carouselIndex];
    } else {
      this.carouselIndex = 0;
      const toRight = unbroken.filter((l) => l.x > playerX);
      lanternTarget =
        toRight.length > 0
          ? toRight.reduce((closest, l) => (l.x < closest.x ? l : closest))
          : unbroken.reduce((leftmost, l) => (l.x < leftmost.x ? l : leftmost));
    }

    // Fight anything standing on the path to the lantern.
    const lanternDistance = lanternTarget.x - playerX;
    const travelDir = Math.sign(lanternDistance) || facing;
    const inPath = enemies.filter(
      (e) =>
        e.alive &&
        (e.x - playerX) * travelDir > 0 &&
        Math.abs(e.x - playerX) < Math.abs(lanternDistance),
    );
    const enemyTarget =
      inPath.length > 0
        ? inPath.reduce((closest, e) => (Math.abs(e.x - playerX) < Math.abs(closest.x - playerX) ? e : closest))
        : null;

    const targetX = enemyTarget ? enemyTarget.x : lanternTarget.x;
    const distance = targetX - playerX;
    const absDistance = Math.abs(distance);

    if (absDistance > WHIP_RANGE * 0.8) {
      return { left: distance < 0, right: distance > 0, attack: false, jump: false };
    }

    // One physics step is ~3.7px, so a wrong-facing target closer than the
    // deadzone would cause an overshoot ping-pong if we kept walking. Inside
    // it we attack regardless: the whip's 12px rear grace still lands the hit.
    if (absDistance > FACING_DEADZONE && Math.sign(distance) !== facing) {
      return { left: distance < 0, right: distance > 0, attack: false, jump: false };
    }

    if (this.attackCooldown > 0) {
      return IDLE;
    }

    this.attackCooldown = ATTACK_RETRY_FRAMES;
    // Only a swing aimed at the LANTERN advances the wrap-phase carousel —
    // an en-route enemy kill must not skip a lantern in the cycle.
    if (unbroken.length === 0 && !enemyTarget) {
      this.carouselIndex += 1;
    }
    return { left: false, right: false, attack: true, jump: false };
  }
}
