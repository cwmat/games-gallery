import Phaser from 'phaser';

export const TEX = {
  player: 'player',
  whip: 'whip',
  lantern: 'lantern',
  lanternBroken: 'lantern-broken',
  spark: 'spark',
  floor: 'floor',
  pillar: 'pillar',
} as const;

/**
 * Draws simple, readable placeholder shapes for every texture key and
 * registers them on the scene's texture manager. Called once from
 * CorridorScene.preload/create before anything else needs them.
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();

  // player: 32x48 magenta body with a lighter head band
  gfx.clear();
  gfx.fillStyle(0xd946ef, 1);
  gfx.fillRect(0, 0, 32, 48);
  gfx.fillStyle(0xf0abfc, 1);
  gfx.fillRect(4, 0, 24, 12);
  gfx.generateTexture(TEX.player, 32, 48);

  // whip: 90x6 amber strip, tapering slightly via a highlight line
  gfx.clear();
  gfx.fillStyle(0xf6b26b, 1);
  gfx.fillRect(0, 0, 90, 6);
  gfx.fillStyle(0xfde3c4, 1);
  gfx.fillRect(0, 0, 90, 2);
  gfx.generateTexture(TEX.whip, 90, 6);

  // lantern: 24x32 amber diamond body with darker frame
  gfx.clear();
  gfx.fillStyle(0x3a2f1e, 1);
  gfx.fillRect(8, 0, 8, 6);
  gfx.fillStyle(0xf6b26b, 1);
  gfx.fillRoundedRect(2, 6, 20, 20, 4);
  gfx.fillStyle(0x3a2f1e, 1);
  gfx.fillRect(8, 26, 8, 6);
  gfx.fillStyle(0xfff3d6, 1);
  gfx.fillCircle(12, 16, 5);
  gfx.generateTexture(TEX.lantern, 24, 32);

  // lantern-broken: same silhouette, grey husk with no glow
  gfx.clear();
  gfx.fillStyle(0x2a2a2a, 1);
  gfx.fillRect(8, 0, 8, 6);
  gfx.fillStyle(0x5a5a5a, 1);
  gfx.fillRoundedRect(2, 6, 20, 20, 4);
  gfx.fillStyle(0x2a2a2a, 1);
  gfx.fillRect(8, 26, 8, 6);
  gfx.fillStyle(0x3a3a3a, 1);
  gfx.fillCircle(12, 16, 5);
  gfx.generateTexture(TEX.lanternBroken, 24, 32);

  // spark: 4x4 amber square particle
  gfx.clear();
  gfx.fillStyle(0xf6b26b, 1);
  gfx.fillRect(0, 0, 4, 4);
  gfx.generateTexture(TEX.spark, 4, 4);

  // floor: 64x64 two-tone dark stone tile
  gfx.clear();
  gfx.fillStyle(0x1a1720, 1);
  gfx.fillRect(0, 0, 64, 64);
  gfx.fillStyle(0x231f2c, 1);
  gfx.fillRect(0, 0, 32, 32);
  gfx.fillRect(32, 32, 32, 32);
  gfx.lineStyle(1, 0x0b0a12, 1);
  gfx.strokeRect(0, 0, 64, 64);
  gfx.generateTexture(TEX.floor, 64, 64);

  // pillar: 48x256 dark column with edge highlights
  gfx.clear();
  gfx.fillStyle(0x171420, 1);
  gfx.fillRect(0, 0, 48, 256);
  gfx.fillStyle(0x2c2638, 1);
  gfx.fillRect(4, 0, 6, 256);
  gfx.fillRect(38, 0, 6, 256);
  gfx.generateTexture(TEX.pillar, 48, 256);

  gfx.destroy();
}
