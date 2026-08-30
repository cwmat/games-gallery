import { describe, expect, it } from 'vitest';
import { bus, getCurrentMode } from './events';

// Note: `bus` is a module-level singleton shared across this file's tests,
// so we don't assert on mode's initial value — only on the effect of an
// emit performed within a given test.

describe('Bridge', () => {
  it('emit reaches subscribers with the payload', () => {
    let received: { gameId: string } | undefined;
    const listener = (payload: { gameId: string }): void => {
      received = payload;
    };

    bus.on('lantern:broken', listener);
    bus.emit('lantern:broken', { gameId: 'foo' });
    bus.off('lantern:broken', listener);

    expect(received).toEqual({ gameId: 'foo' });
  });

  it('off() removes only the targeted listener', () => {
    let calls1 = 0;
    let calls2 = 0;
    const listener1 = (): void => {
      calls1 += 1;
    };
    const listener2 = (): void => {
      calls2 += 1;
    };

    bus.on('card:closed', listener1);
    bus.on('card:closed', listener2);
    bus.off('card:closed', listener1);

    bus.emit('card:closed');

    bus.off('card:closed', listener2);

    expect(calls1).toBe(0);
    expect(calls2).toBe(1);
  });

  it('emits a void-payload event without error', () => {
    let called = false;
    const listener = (): void => {
      called = true;
    };

    bus.on('card:closed', listener);
    expect(() => bus.emit('card:closed')).not.toThrow();
    bus.off('card:closed', listener);

    expect(called).toBe(true);
  });

  it('getCurrentMode() reflects the last mode:changed emit', () => {
    bus.emit('mode:changed', { mode: 'auto' });
    expect(getCurrentMode()).toBe('auto');

    bus.emit('mode:changed', { mode: 'manual' });
    expect(getCurrentMode()).toBe('manual');
  });
});
