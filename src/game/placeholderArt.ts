import Phaser from 'phaser';

export const TEX = {
  player: 'player',
  lantern: 'lantern',
  lanternBroken: 'lantern-broken',
  spark: 'spark',
  glow: 'glow',
  floor: 'floor',
  pillar: 'pillar',
  wall: 'wall',
} as const;

/** Layout of the PixelLab player spritesheet (public/assets/player.png). */
export const PLAYER_SHEET = {
  frameWidth: 76,
  frameHeight: 76,
  columns: 9,
  /** Column of the east-facing rotation in row 0 — the static spawn frame. */
  eastFrame: 2,
  anims: {
    idle: { start: 9, end: 13, frameRate: 6, repeat: -1 },
    whip: { start: 18, end: 24, frameRate: 16, repeat: 0 },
    jump: { start: 27, end: 31, frameRate: 10, repeat: 0 },
    walk: { start: 36, end: 44, frameRate: 14, repeat: -1 },
  },
} as const;

/**
 * Procedural textures that intentionally stay generated (no PixelLab art):
 * spark particles and the additive lantern glow that carries each game's
 * accent color. Every other TEX key is loaded from public/assets/ in
 * CorridorScene.preload (pixel-art-pipeline skill).
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();

  // spark: 4x4 amber square particle
  gfx.clear();
  gfx.fillStyle(0xf6b26b, 1);
  gfx.fillRect(0, 0, 4, 4);
  gfx.generateTexture(TEX.spark, 4, 4);
  gfx.destroy();

  // glow: 64x64 soft white radial falloff, tinted per game accent at use site
  const size = 64;
  const canvas = scene.textures.createCanvas(TEX.glow, size, size);
  if (canvas) {
    const ctx = canvas.context;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
  }
}
