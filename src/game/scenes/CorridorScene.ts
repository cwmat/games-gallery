import Phaser from 'phaser';
import { bus, getCurrentMode } from '../../bridge/events';
import type { Mode } from '../../bridge/events';
import { games } from '../../data/games';
import { AutopilotController } from '../autopilot';
import type { AutopilotLantern, InputState } from '../autopilot';
import { GAME_HEIGHT, WHIP_RANGE, corridorLayout } from '../config';
import { Player } from '../objects/Player';
import { TEX, createPlaceholderTextures } from '../placeholderArt';

const FLOOR_HEIGHT = 64;
const FLOOR_TOP_Y = GAME_HEIGHT - FLOOR_HEIGHT;
const LANTERN_Y = 160;
const PILLAR_STEP = 220;

// Keys that count as taking manual control away from autopilot. Deliberately
// narrow — Tab/Escape/F5/modifiers etc. must never kill autoplay, and this is
// checked at the window level so takeover works even while the scene is
// paused behind a card.
const GAME_CONTROL_KEYS = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 'x', ' ']);

interface LanternState {
  sprite: Phaser.GameObjects.Image;
  gameId: string;
  x: number;
  broken: boolean;
  tint: number;
}

export class CorridorScene extends Phaser.Scene {
  private player!: Player;
  private floorBody!: Phaser.GameObjects.Rectangle;
  private lanterns: LanternState[] = [];
  private mode: Mode = 'manual';
  private autopilot = new AutopilotController();

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;

  private handleModeChangedBound = this.handleModeChanged.bind(this);
  private handleCardClosedBound = this.handleCardClosed.bind(this);
  private handleWindowKeydownBound = this.handleWindowKeydown.bind(this);

  constructor() {
    super('corridor');
  }

  create(): void {
    createPlaceholderTextures(this);

    this.mode = getCurrentMode();

    const layout = corridorLayout(games.length);

    this.cameras.main.setBackgroundColor('#0b0a12');
    this.physics.world.setBounds(0, 0, layout.worldWidth, GAME_HEIGHT);

    this.setupBackground(layout.worldWidth);
    this.setupFloor(layout.worldWidth);
    this.setupLanterns(layout.lanternXs);
    this.setupPlayer();
    this.setupInput();
    this.setupBus();

    this.cameras.main.setBounds(0, 0, layout.worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  update(): void {
    const input = this.mode === 'auto' ? this.readAutopilotInput() : this.readManualInput();

    this.player.update(input);

    if (input.attack) {
      this.player.whip();
      this.handleWhipHit();
    }
  }

  private setupBackground(worldWidth: number): void {
    for (let x = 0; x < worldWidth; x += PILLAR_STEP) {
      const pillar = this.add.image(x, FLOOR_TOP_Y, TEX.pillar);
      pillar.setOrigin(0.5, 1);
      pillar.setScrollFactor(0.4, 1);
      pillar.setDepth(-10);
    }
  }

  private setupFloor(worldWidth: number): void {
    this.add.tileSprite(0, FLOOR_TOP_Y, worldWidth, FLOOR_HEIGHT, TEX.floor).setOrigin(0, 0).setDepth(-5);

    const floorBody = this.add.rectangle(worldWidth / 2, FLOOR_TOP_Y + FLOOR_HEIGHT / 2, worldWidth, FLOOR_HEIGHT);
    floorBody.setVisible(false);
    this.physics.add.existing(floorBody, true);
    this.floorBody = floorBody;
  }

  private setupLanterns(lanternXs: number[]): void {
    this.lanterns = games.map((game, i) => {
      const x = lanternXs[i];
      const tint = Phaser.Display.Color.HexStringToColor(game.accent).color;
      const sprite = this.add.image(x, LANTERN_Y, TEX.lantern);
      sprite.setTint(tint);
      return { sprite, gameId: game.id, x, broken: false, tint };
    });
  }

  private setupPlayer(): void {
    this.player = new Player(this, 100, FLOOR_TOP_Y);
    this.physics.add.collider(this.player, this.floorBody);
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    const wasdKeys = keyboard.addKeys('W,A,D') as { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    this.wasd = wasdKeys;
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.xKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    window.addEventListener('keydown', this.handleWindowKeydownBound);
  }

  private setupBus(): void {
    bus.on('mode:changed', this.handleModeChangedBound);
    bus.on('card:closed', this.handleCardClosedBound);
  }

  private cleanup(): void {
    bus.off('mode:changed', this.handleModeChangedBound);
    bus.off('card:closed', this.handleCardClosedBound);
    window.removeEventListener('keydown', this.handleWindowKeydownBound);
  }

  private handleModeChanged(payload: { mode: Mode }): void {
    this.mode = payload.mode;
  }

  private handleCardClosed(): void {
    this.scene.resume();
    this.input.keyboard?.enableGlobalCapture();
  }

  private handleWindowKeydown(event: KeyboardEvent): void {
    if (this.mode !== 'auto') return;
    // Browser shortcuts (Ctrl+A, Cmd+D, Alt+D...) are not takeover requests.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!GAME_CONTROL_KEYS.has(event.key.toLowerCase())) return;

    // Keys aimed at an interactive element — the card's focused Close button,
    // a link, a playing video — are UI interaction, not grabbing the controls.
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input, select, textarea, video, [contenteditable="true"]')) {
      return;
    }

    this.mode = 'manual';
    bus.emit('mode:changed', { mode: 'manual' });
  }

  private readManualInput(): InputState {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const jump = this.cursors.up.isDown || this.wasd.W.isDown;
    const attack = Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.xKey);
    return { left, right, jump, attack };
  }

  private readAutopilotInput(): InputState {
    const lanterns: AutopilotLantern[] = this.lanterns.map((l) => ({ x: l.x, gameId: l.gameId, broken: l.broken }));
    return this.autopilot.update(this.player.x, this.player.facingDir, lanterns);
  }

  private handleWhipHit(): void {
    // Hit band is relative to facing: dx is positive distance ahead of the
    // player. -12 gives a little slack behind the player's origin so a
    // lantern right at their feet still registers.
    const facing = this.player.facingDir;
    const hittable = this.lanterns
      .map((l) => ({ lantern: l, dx: (l.x - this.player.x) * facing }))
      .filter(({ dx }) => dx >= -12 && dx <= WHIP_RANGE + 20);

    if (hittable.length === 0) return;

    const nearest = hittable.reduce((closest, l) => (Math.abs(l.dx) < Math.abs(closest.dx) ? l : closest)).lantern;

    if (!nearest.broken) {
      this.shatterLantern(nearest);
    } else {
      this.spawnSpark(nearest, 4);
    }

    bus.emit('lantern:broken', { gameId: nearest.gameId });
    this.input.keyboard?.disableGlobalCapture();
    this.scene.pause();
  }

  private shatterLantern(lantern: LanternState): void {
    lantern.broken = true;
    lantern.sprite.setTexture(TEX.lanternBroken);
    lantern.sprite.clearTint();
    this.spawnSpark(lantern, 16);
  }

  private spawnSpark(lantern: LanternState, quantity: number): void {
    const emitter = this.add.particles(lantern.x, LANTERN_Y, TEX.spark, {
      speed: { min: 80, max: 220 },
      lifespan: 400,
      quantity,
      scale: { start: 1, end: 0 },
      tint: lantern.tint,
      emitting: false,
    });
    emitter.explode(quantity, lantern.x, LANTERN_Y);
    this.time.delayedCall(500, () => emitter.destroy());
  }
}
