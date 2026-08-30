import Phaser from 'phaser';
import { bus } from '../../bridge/events';
import { hitFlash, impactBurst } from '../effects';
import type { EnemyKindDef } from '../placeholderArt';

const RESPAWN_MS = 16000;
const RESPAWN_JITTER_MS = 6000;

/**
 * A stationary corridor haunt. Idles menacingly, dies loudly to the whip,
 * and drifts back into existence a while later so the hall never empties.
 * No physics body — enemies are whip targets, not obstacles.
 */
export class Enemy extends Phaser.GameObjects.Sprite {
  alive = true;
  private kind: EnemyKindDef;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKindDef) {
    super(scene, x, y, kind.key, kind.eastFrame);
    this.kind = kind;
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    // Face the approaching player (they come from the left).
    this.setFlipX(true);
    this.play(kind.animKeys.idle);
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;

    hitFlash(this.scene, this);
    impactBurst(this.scene, this.x, this.y - this.displayHeight / 2, this.kind.burstTint, 1.2);
    bus.emit('fx', { kind: 'enemy-die' });

    this.play(this.kind.animKeys.death);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 280,
        onComplete: () => this.setVisible(false),
      });
    });

    const delay = RESPAWN_MS + Math.random() * RESPAWN_JITTER_MS;
    this.scene.time.delayedCall(delay, () => this.respawn());
  }

  private respawn(): void {
    if (!this.scene) return; // scene was torn down while we waited
    this.setVisible(true);
    this.setAlpha(0);
    this.play(this.kind.animKeys.idle);
    this.alive = true;
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 600 });
  }
}
