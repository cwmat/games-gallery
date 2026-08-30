import Phaser from 'phaser';
import { bus, getCurrentMode } from '../../bridge/events';
import type { Mode } from '../../bridge/events';
import { games } from '../../data/games';
import { AutopilotController } from '../autopilot';
import type { AutopilotLantern, InputState } from '../autopilot';
import { GAME_HEIGHT, WHIP_RANGE, corridorLayout, enemyXs } from '../config';
import { hitFlash, impactBurst } from '../effects';
import { Enemy } from '../objects/Enemy';
import { Player } from '../objects/Player';
import { ENEMY_KINDS, PLAYER_SHEET, TEX, createPlaceholderTextures } from '../placeholderArt';

const FLOOR_HEIGHT = 64;
const FLOOR_TOP_Y = GAME_HEIGHT - FLOOR_HEIGHT;
// Lanterns hang on long chains down to whip height — the glass sits level
// with the player's swing so hits read visually (GAME_DESIGN §4).
const LANTERN_Y = FLOOR_TOP_Y - 60;
const PILLAR_STEP = 220;
// Chunkier Castlevania framing: the camera shows a 1.5x-zoomed slice.
const CAMERA_ZOOM = 1.5;
// The whip's strike frame lands ~5 frames into the 16fps swing; the hit (and
// the scene pause under the card) waits for it so the lash is actually seen.
const WHIP_HIT_DELAY_MS = 300;

// Keys that count as taking manual control away from autopilot. Deliberately
// narrow — Tab/Escape/F5/modifiers etc. must never kill autoplay, and this is
// checked at the window level so takeover works even while the scene is
// paused behind a card.
const GAME_CONTROL_KEYS = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 'x', ' ']);

interface LanternState {
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  gameId: string;
  x: number;
  broken: boolean;
  tint: number;
}

export class CorridorScene extends Phaser.Scene {
  private player!: Player;
  private floorBody!: Phaser.GameObjects.Rectangle;
  private lanterns: LanternState[] = [];
  private enemies: Enemy[] = [];
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

  preload(): void {
    // PixelLab art from public/assets/ (pixel-art-pipeline skill). BASE_URL
    // keeps paths correct under the /games-gallery/ GitHub Pages base.
    const base = import.meta.env.BASE_URL;
    this.load.image(TEX.lantern, `${base}assets/lantern.png`);
    this.load.image(TEX.lanternBroken, `${base}assets/lantern-broken.png`);
    this.load.image(TEX.pillar, `${base}assets/pillar.png`);
    this.load.image(TEX.floor, `${base}assets/floor.png`);
    this.load.image(TEX.wall, `${base}assets/wall.png`);
    this.load.spritesheet(TEX.player, `${base}assets/player.png`, {
      frameWidth: PLAYER_SHEET.frameWidth,
      frameHeight: PLAYER_SHEET.frameHeight,
    });
    for (const kind of ENEMY_KINDS) {
      this.load.spritesheet(kind.key, `${base}assets/${kind.file}`, {
        frameWidth: kind.frameWidth,
        frameHeight: kind.frameHeight,
      });
    }
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
    this.setupEnemies(layout.lanternXs);
    this.setupPlayer();
    this.setupInput();
    this.setupBus();

    this.cameras.main.setBounds(0, 0, layout.worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(CAMERA_ZOOM);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  update(): void {
    const input = this.mode === 'auto' ? this.readAutopilotInput() : this.readManualInput();

    this.player.update(input);

    if (input.attack && !this.player.isWhipping) {
      this.player.whip();
      bus.emit('fx', { kind: 'whip' });
      this.time.delayedCall(WHIP_HIT_DELAY_MS, () => this.handleWhipHit());
    }
  }

  private setupBackground(worldWidth: number): void {
    // Distant wall with arched windows — slowest parallax layer, dimmed so
    // the corridor's foreground reads clearly against it.
    const wall = this.add.tileSprite(0, FLOOR_TOP_Y, worldWidth, 256, TEX.wall);
    wall.setOrigin(0, 1);
    wall.setScrollFactor(0.15, 1);
    wall.setDepth(-20);
    wall.setAlpha(0.55);

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
      // Hanging chain from the ceiling down to the lantern's hook.
      this.add.rectangle(x, 0, 3, LANTERN_Y - 20, 0x241e31).setOrigin(0.5, 0).setDepth(-2);
      this.add.rectangle(x - 1, 0, 1, LANTERN_Y - 20, 0x352c47).setOrigin(0.5, 0).setDepth(-2);
      // The lantern art keeps its own amber palette; the game's accent color
      // lives in an additive glow halo behind it (and in the spark burst).
      const glow = this.add.image(x, LANTERN_Y, TEX.glow);
      glow.setTint(tint);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(0.7);
      glow.setScale(1.6);
      glow.setDepth(-1);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.5, to: 0.85 },
        scale: { from: 1.45, to: 1.7 },
        duration: 1200 + i * 137, // desync the flicker per lantern
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      const sprite = this.add.image(x, LANTERN_Y, TEX.lantern);
      return { sprite, glow, gameId: game.id, x, broken: false, tint };
    });
  }

  private setupEnemies(lanternXs: number[]): void {
    // Register each kind's animations once (the anims manager is global).
    for (const kind of ENEMY_KINDS) {
      for (const name of ['idle', 'death'] as const) {
        const animKey = kind.animKeys[name];
        if (!this.anims.exists(animKey)) {
          const cfg = kind.anims[name];
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(kind.key, { start: cfg.start, end: cfg.end }),
            frameRate: cfg.frameRate,
            repeat: name === 'idle' ? -1 : 0,
          });
        }
      }
    }

    this.enemies = enemyXs(lanternXs).map((x, i) => {
      const kind = ENEMY_KINDS[i % ENEMY_KINDS.length];
      return new Enemy(this, x, FLOOR_TOP_Y + kind.yOffset, kind);
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
    const enemies = this.enemies.map((e) => ({ x: e.x, alive: e.alive }));
    return this.autopilot.update(this.player.x, this.player.facingDir, lanterns, enemies);
  }

  private handleWhipHit(): void {
    // Hit band is relative to facing: dx is positive distance ahead of the
    // player. -12 gives a little slack behind the player's origin so a
    // lantern right at their feet still registers.
    const facing = this.player.facingDir;
    const inBand = (x: number): boolean => {
      const dx = (x - this.player.x) * facing;
      return dx >= -12 && dx <= WHIP_RANGE + 20;
    };

    // The whip is an arc: every living enemy in the band dies. Enemy kills
    // never pause the scene or open cards — they're corridor seasoning.
    for (const enemy of this.enemies) {
      if (enemy.alive && inBand(enemy.x)) enemy.kill();
    }

    const hittable = this.lanterns
      .map((l) => ({ lantern: l, dx: (l.x - this.player.x) * facing }))
      .filter(({ dx }) => dx >= -12 && dx <= WHIP_RANGE + 20);

    if (hittable.length === 0) return;

    const nearest = hittable.reduce((closest, l) => (Math.abs(l.dx) < Math.abs(closest.dx) ? l : closest)).lantern;

    if (!nearest.broken) {
      this.shatterLantern(nearest);
      bus.emit('fx', { kind: 'shatter' });
    } else {
      this.spawnSpark(nearest, 4);
      impactBurst(this, nearest.x, LANTERN_Y, nearest.tint, 0.4);
      bus.emit('fx', { kind: 'reopen' });
    }

    // Let the flash/burst play out before freezing the scene under the card —
    // pausing in the same tick would leave a half-finished explosion behind it.
    this.time.delayedCall(350, () => {
      bus.emit('lantern:broken', { gameId: nearest.gameId });
      this.input.keyboard?.disableGlobalCapture();
      this.scene.pause();
    });
  }

  private shatterLantern(lantern: LanternState): void {
    lantern.broken = true;
    hitFlash(this, lantern.sprite);
    this.time.delayedCall(80, () => {
      if (lantern.sprite.active) lantern.sprite.setTexture(TEX.lanternBroken);
    });
    this.tweens.killTweensOf(lantern.glow);
    lantern.glow.setVisible(false);
    impactBurst(this, lantern.x, LANTERN_Y, lantern.tint, 1);
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
