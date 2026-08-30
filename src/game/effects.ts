import Phaser from 'phaser';
import { TEX } from './placeholderArt';

const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Punchy, cheap impact at (x, y): an expanding additive glow ring, a spark
 * burst, and a small camera shake — all built from things Phaser gives us
 * for free (tweens, particles, camera fx). `strength` scales the whole hit
 * (lantern shatter ~1, enemy death ~1.2, re-whip tap ~0.4).
 */
export function impactBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  strength = 1,
): void {
  // Expanding glow ring.
  const ring = scene.add.image(x, y, TEX.glow);
  ring.setBlendMode(Phaser.BlendModes.ADD);
  ring.setTint(tint);
  ring.setAlpha(0.95);
  ring.setScale(0.2);
  ring.setDepth(5);
  scene.tweens.add({
    targets: ring,
    scale: 2.4 * strength,
    alpha: 0,
    duration: 320,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Spark burst.
  const quantity = Math.round(18 * strength);
  const emitter = scene.add.particles(x, y, TEX.spark, {
    speed: { min: 90, max: 260 * strength },
    lifespan: 450,
    quantity,
    scale: { start: 1.1, end: 0 },
    tint,
    emitting: false,
  });
  emitter.explode(quantity, x, y);
  scene.time.delayedCall(550, () => emitter.destroy());

  if (!REDUCED_MOTION) {
    scene.cameras.main.shake(90, 0.0035 * strength);
  }
}

/**
 * Brief white-hot flash on a sprite — reads as "the hit landed" a frame
 * before the burst takes over. Safe on any Image/Sprite.
 */
export function hitFlash(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
): void {
  target.setTintFill(0xffffff);
  scene.time.delayedCall(70, () => {
    if (target.active) target.clearTint();
  });
}
