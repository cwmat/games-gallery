import { describe, expect, it } from 'vitest';
import { games } from './games';

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('games data', () => {
  it('is non-empty', () => {
    expect(games.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = games.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses kebab-case ids', () => {
    for (const game of games) {
      expect(game.id).toMatch(KEBAB_CASE);
    }
  });

  it('has http(s) or "#" urls', () => {
    for (const game of games) {
      expect(game.url === '#' || /^https?:\/\//.test(game.url)).toBe(true);
      if (game.repoUrl !== undefined) {
        expect(game.repoUrl === '#' || /^https?:\/\//.test(game.repoUrl)).toBe(true);
      }
    }
  });

  it('has non-empty title and blurb', () => {
    for (const game of games) {
      expect(game.title.trim().length).toBeGreaterThan(0);
      expect(game.blurb.trim().length).toBeGreaterThan(0);
    }
  });

  it('has a year between 2000 and 2100', () => {
    for (const game of games) {
      expect(game.year).toBeGreaterThanOrEqual(2000);
      expect(game.year).toBeLessThanOrEqual(2100);
    }
  });

  it('has a valid hex accent color', () => {
    for (const game of games) {
      expect(game.accent).toMatch(HEX_COLOR);
    }
  });

  it('has non-empty alt text for every media item', () => {
    for (const game of games) {
      for (const media of game.media) {
        expect(media.alt.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has a valid src for every media item', () => {
    const RELATIVE_ASSET_PATH = /^assets\//;
    for (const game of games) {
      for (const media of game.media) {
        expect(media.src.trim().length).toBeGreaterThan(0);
        expect(
          /^https?:\/\//.test(media.src) || RELATIVE_ASSET_PATH.test(media.src),
        ).toBe(true);
      }
    }
  });

  it('has a valid poster path when a media item declares one', () => {
    const RELATIVE_ASSET_PATH = /^assets\//;
    for (const game of games) {
      for (const media of game.media) {
        if (media.poster === undefined) continue;
        expect(
          /^https?:\/\//.test(media.poster) || RELATIVE_ASSET_PATH.test(media.poster),
        ).toBe(true);
      }
    }
  });
});
