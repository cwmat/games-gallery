import { describe, expect, it } from 'vitest';
import { enemyXs } from './config';
import { CORRIDOR_MARGIN, LANTERN_SPACING, corridorLayout } from './config';

describe('corridorLayout', () => {
  it('returns no lanterns and a minimal width for count 0', () => {
    const layout = corridorLayout(0);
    expect(layout.lanternXs).toEqual([]);
    expect(layout.worldWidth).toBe(CORRIDOR_MARGIN * 2);
  });

  it('places a single lantern at CORRIDOR_MARGIN for count 1', () => {
    const layout = corridorLayout(1);
    expect(layout.lanternXs).toEqual([CORRIDOR_MARGIN]);
    expect(layout.worldWidth).toBe(CORRIDOR_MARGIN * 2);
  });

  it('starts the first lantern at CORRIDOR_MARGIN for larger counts', () => {
    const layout = corridorLayout(5);
    expect(layout.lanternXs[0]).toBe(CORRIDOR_MARGIN);
  });

  it('spaces consecutive lanterns by LANTERN_SPACING', () => {
    const layout = corridorLayout(6);
    for (let i = 1; i < layout.lanternXs.length; i++) {
      expect(layout.lanternXs[i] - layout.lanternXs[i - 1]).toBe(LANTERN_SPACING);
    }
  });

  it('computes worldWidth via the CORRIDOR_MARGIN*2 + spacing*(count-1) formula', () => {
    const count = 4;
    const layout = corridorLayout(count);
    expect(layout.worldWidth).toBe(CORRIDOR_MARGIN * 2 + LANTERN_SPACING * (count - 1));
  });

  it('produces a strictly monotonically increasing sequence of x positions', () => {
    const layout = corridorLayout(8);
    for (let i = 1; i < layout.lanternXs.length; i++) {
      expect(layout.lanternXs[i]).toBeGreaterThan(layout.lanternXs[i - 1]);
    }
  });

  it('places one enemy at each gap midpoint between lanterns', () => {
    const layout = corridorLayout(5);
    const xs = enemyXs(layout.lanternXs);
    expect(xs).toHaveLength(4);
    for (let i = 0; i < xs.length; i++) {
      expect(xs[i]).toBe((layout.lanternXs[i] + layout.lanternXs[i + 1]) / 2);
    }
  });

  it('spawns no enemies for zero or one lantern', () => {
    expect(enemyXs([])).toHaveLength(0);
    expect(enemyXs([640])).toHaveLength(0);
  });
});
