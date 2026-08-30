import { describe, expect, it } from 'vitest';
import { AutopilotController } from './autopilot';
import type { AutopilotLantern } from './autopilot';
import { WHIP_RANGE } from './config';

function lantern(x: number, gameId: string, broken = false): AutopilotLantern {
  return { x, gameId, broken };
}

describe('AutopilotController', () => {
  it('idles when there are no lanterns', () => {
    const pilot = new AutopilotController();
    expect(pilot.update(100, 1, [])).toEqual({ left: false, right: false, attack: false, jump: false });
  });

  it('walks right toward the nearest unbroken lantern to the right', () => {
    const pilot = new AutopilotController();
    const input = pilot.update(100, 1, [lantern(640, 'a'), lantern(1120, 'b')]);
    expect(input.right).toBe(true);
    expect(input.attack).toBe(false);
  });

  it('walks left when the only unbroken lantern is behind the player', () => {
    const pilot = new AutopilotController();
    const input = pilot.update(2000, 1, [lantern(640, 'a'), lantern(1120, 'b', true)]);
    expect(input.left).toBe(true);
  });

  it('attacks once in range, then waits out the retry cooldown', () => {
    const pilot = new AutopilotController();
    const lanterns = [lantern(640, 'a')];
    const inRangeX = 640 - WHIP_RANGE * 0.5;

    expect(pilot.update(inRangeX, 1, lanterns).attack).toBe(true);
    expect(pilot.update(inRangeX, 1, lanterns).attack).toBe(false);
  });

  it('retries the attack after the cooldown expires instead of deadlocking on a whiff', () => {
    const pilot = new AutopilotController();
    const lanterns = [lantern(640, 'a')];
    const inRangeX = 640 - WHIP_RANGE * 0.5;

    expect(pilot.update(inRangeX, 1, lanterns).attack).toBe(true);
    // Lantern stays unbroken (the whip whiffed); pump frames past the cooldown.
    let retried = false;
    for (let frame = 0; frame < 120; frame += 1) {
      if (pilot.update(inRangeX, 1, lanterns).attack) {
        retried = true;
        break;
      }
    }
    expect(retried).toBe(true);
  });

  it('cycles through all lanterns in order once every one is broken', () => {
    const pilot = new AutopilotController();
    const lanterns = [lantern(640, 'a', true), lantern(1120, 'b', true)];

    // In range of the first carousel target: attack advances the carousel.
    expect(pilot.update(640, 1, lanterns).attack).toBe(true);
    // Next target is lantern b — far away, so it walks right.
    const walking = pilot.update(640, 1, lanterns);
    expect(walking.right).toBe(true);
    expect(walking.attack).toBe(false);
  });

  it('wraps the carousel back to the first lantern after the last one', () => {
    const pilot = new AutopilotController();
    const lanterns = [lantern(640, 'a', true), lantern(1120, 'b', true)];

    pilot.update(640, 1, lanterns); // attack a, carousel -> b
    // Stand at b and pump frames until the cooldown lets the next attack fire.
    let attackedB = false;
    for (let frame = 0; frame < 120 && !attackedB; frame += 1) {
      attackedB = pilot.update(1120, 1, lanterns).attack;
    }
    expect(attackedB).toBe(true);
    // Carousel wrapped: next target is a again, far to the left.
    expect(pilot.update(1120, 1, lanterns).left).toBe(true);
  });

  it('walks to correct facing when the in-range target is behind the player, then attacks', () => {
    const pilot = new AutopilotController();
    const lanterns = [lantern(640, 'a')];
    const inRangeX = 640 - WHIP_RANGE * 0.5; // target is to the right (distance > 0)

    // Facing left (away from the target) — whip would miss, so walk toward it instead.
    const facingAway = pilot.update(inRangeX, -1, lanterns);
    expect(facingAway.attack).toBe(false);
    expect(facingAway.right).toBe(true);

    // Facing corrected to face the target — now it attacks.
    const facingCorrected = pilot.update(inRangeX, 1, lanterns);
    expect(facingCorrected.attack).toBe(true);
  });

  it('attacks a near-touching wrong-facing target instead of oscillating (deadzone)', () => {
    const pilot = new AutopilotController();
    // Target 2px behind the facing direction — closer than one physics step.
    // Walking to flip facing would overshoot forever; the whip's rear grace
    // covers this range, so the pilot must attack rather than ping-pong.
    const input = pilot.update(642, 1, [lantern(640, 'a')]);
    expect(input.attack).toBe(true);
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
  });
});
