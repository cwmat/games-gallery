// Pure game configuration/layout math. MUST NOT import Phaser so it stays
// unit-testable and importable from non-game code without pulling Phaser in.

export const LANTERN_SPACING = 480;
export const CORRIDOR_MARGIN = 640;
export const WHIP_RANGE = 90;
export const CARD_AUTO_CLOSE_MS = 6000;
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export interface CorridorLayout {
  worldWidth: number;
  lanternXs: number[];
}

export function corridorLayout(count: number): CorridorLayout {
  if (count <= 0) {
    return { worldWidth: CORRIDOR_MARGIN * 2, lanternXs: [] };
  }

  const lanternXs = Array.from({ length: count }, (_, i) => CORRIDOR_MARGIN + i * LANTERN_SPACING);
  const worldWidth = CORRIDOR_MARGIN * 2 + LANTERN_SPACING * (count - 1);

  return { worldWidth, lanternXs };
}
