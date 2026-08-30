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

/** One stationary corridor enemy type: sheet layout + anim frame ranges. */
export interface EnemyKindDef {
  key: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  eastFrame: number;
  /** Added to FLOOR_TOP_Y: positive plants feet, negative hovers. */
  yOffset: number;
  burstTint: number;
  animKeys: { idle: string; death: string };
  anims: {
    idle: { start: number; end: number; frameRate: number };
    death: { start: number; end: number; frameRate: number };
  };
}

// Both sheets are 76x76 cells, 7 columns: row 0 rotations (east = col 2),
// row 1 idle, row 2 death. The wraith's death row re-solidifies in its last
// two frames (loopback artifact) — its range stops at the most-dissolved
// frame and the Enemy fade-out takes over from there.
export const ENEMY_KINDS: EnemyKindDef[] = [
  {
    key: 'enemy-skeleton',
    file: 'enemy-skeleton.png',
    frameWidth: 76,
    frameHeight: 76,
    eastFrame: 2,
    yOffset: 10,
    burstTint: 0xd94f3a,
    animKeys: { idle: 'enemy-skeleton-idle', death: 'enemy-skeleton-death' },
    anims: {
      idle: { start: 7, end: 11, frameRate: 5 },
      death: { start: 14, end: 20, frameRate: 12 },
    },
  },
  {
    key: 'enemy-wraith',
    file: 'enemy-wraith.png',
    frameWidth: 76,
    frameHeight: 76,
    eastFrame: 2,
    yOffset: -14,
    burstTint: 0x8b5cf6,
    animKeys: { idle: 'enemy-wraith-idle', death: 'enemy-wraith-death' },
    anims: {
      idle: { start: 7, end: 13, frameRate: 6 },
      death: { start: 14, end: 18, frameRate: 12 },
    },
  },
];

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
