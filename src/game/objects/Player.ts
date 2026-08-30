import Phaser from 'phaser';
import type { InputState } from '../autopilot';
import { PLAYER_SHEET, TEX } from '../placeholderArt';

const WALK_SPEED = 220;
const JUMP_VELOCITY = -420;

// The character occupies ~32x48 of the 76x76 cell (cell-center pivot from
// PixelLab); the body hugs that region so physics ignore the padding. The
// body's bottom edge sits on the art's feet line (~cell y 66).
const BODY_WIDTH = 22;
const BODY_HEIGHT = 44;
const FEET_Y_IN_CELL = 66;

const ANIM = {
  idle: 'player-idle',
  walk: 'player-walk',
  jump: 'player-jump',
  whip: 'player-whip',
} as const;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player, PLAYER_SHEET.eastFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 1);
    this.setSize(BODY_WIDTH, BODY_HEIGHT);
    this.setOffset((PLAYER_SHEET.frameWidth - BODY_WIDTH) / 2, FEET_Y_IN_CELL - BODY_HEIGHT);

    for (const [name, cfg] of Object.entries(PLAYER_SHEET.anims)) {
      const key = ANIM[name as keyof typeof PLAYER_SHEET.anims];
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(TEX.player, { start: cfg.start, end: cfg.end }),
          frameRate: cfg.frameRate,
          repeat: cfg.repeat,
        });
      }
    }
    this.play(ANIM.idle);
  }

  get facingDir(): 1 | -1 {
    return this.facing;
  }

  /** True while the whip strike animation is mid-swing. */
  get isWhipping(): boolean {
    return this.anims.isPlaying && this.anims.currentAnim?.key === ANIM.whip;
  }

  update(input: InputState): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // A grounded whip plants your feet (and locks facing) until the swing
    // finishes — the delayed hit then lands exactly where the strike frame
    // shows it. Air whips keep their momentum and steering.
    const planted = this.isWhipping && body.blocked.down;

    if (planted) {
      this.setVelocityX(0);
    } else if (input.left && !input.right) {
      this.setVelocityX(-WALK_SPEED);
      this.facing = -1;
      this.setFlipX(true);
    } else if (input.right && !input.left) {
      this.setVelocityX(WALK_SPEED);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (input.jump && body.blocked.down && !planted) {
      this.setVelocityY(JUMP_VELOCITY);
    }

    this.updateAnimation(body);
  }

  /** Plays the whip strike; the lash is drawn in the animation frames. */
  whip(): void {
    this.play(ANIM.whip);
  }

  private updateAnimation(body: Phaser.Physics.Arcade.Body): void {
    if (this.isWhipping) return; // let the strike finish

    const current = this.anims.currentAnim?.key;
    const moving = body.velocity.x !== 0;

    if (!body.blocked.down) {
      // Play once and freeze on the final airborne frame until landing.
      if (current !== ANIM.jump) this.play(ANIM.jump);
    } else if (moving) {
      if (current !== ANIM.walk || !this.anims.isPlaying) this.play(ANIM.walk);
    } else if (current !== ANIM.idle || !this.anims.isPlaying) {
      this.play(ANIM.idle);
    }
  }
}
