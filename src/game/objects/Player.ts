import Phaser from 'phaser';
import type { InputState } from '../autopilot';
import { TEX } from '../placeholderArt';

const WALK_SPEED = 220;
const JUMP_VELOCITY = -420;
const WHIP_VISIBLE_MS = 120;
const WHIP_GAP = 10;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: 1 | -1 = 1;
  private whipSprite: Phaser.GameObjects.Image;
  private whipHideEvent: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 1);

    this.whipSprite = scene.add.image(x, y, TEX.whip);
    this.whipSprite.setOrigin(0, 0.5);
    this.whipSprite.setVisible(false);
    this.whipSprite.setDepth(this.depth + 1);
  }

  get facingDir(): 1 | -1 {
    return this.facing;
  }

  update(input: InputState): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (input.left && !input.right) {
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

    if (input.jump && body.blocked.down) {
      this.setVelocityY(JUMP_VELOCITY);
    }

    this.updateWhipPosition();
  }

  /** Flashes the whip sprite at the facing offset. */
  whip(): void {
    this.updateWhipPosition();
    this.whipSprite.setFlipX(this.facing === -1);
    this.whipSprite.setVisible(true);

    this.whipHideEvent?.remove();
    this.whipHideEvent = this.scene.time.delayedCall(WHIP_VISIBLE_MS, () => {
      this.whipSprite.setVisible(false);
    });
  }

  private updateWhipPosition(): void {
    const width = this.whipSprite.displayWidth;
    const leftEdgeX = this.facing === 1 ? this.x + WHIP_GAP : this.x - WHIP_GAP - width;
    this.whipSprite.setPosition(leftEdgeX, this.y - this.displayHeight / 2);
  }
}
