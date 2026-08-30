import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { CorridorScene } from './scenes/CorridorScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0a12',
    pixelArt: true,
    // No sound yet (GAME_DESIGN §9 follow-up). Skipping the AudioContext also
    // avoids suspend/resume-after-destroy errors when the game is torn down
    // (StrictMode remounts, gallery route round-trips).
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 900 },
        debug: false,
      },
    },
    scene: [CorridorScene],
  });

  if (import.meta.env.DEV) {
    // Playtest hook: lets browser-driven test sessions inspect live scene state.
    (window as unknown as { __game?: Phaser.Game }).__game = game;
  }

  return game;
}
