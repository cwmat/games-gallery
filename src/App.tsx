import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { audio } from './audio/audio';
import { bus } from './bridge/events';
import type { Mode } from './bridge/events';
import { CardOverlay } from './components/CardOverlay';
import { EnterModal } from './components/EnterModal';
import { GalleryView } from './components/GalleryView';
import { Hud } from './components/Hud';
import { games } from './data/games';
import { CARD_AUTO_CLOSE_MS } from './game/config';
import { useHashRoute } from './hooks/useHashRoute';

const GameCanvas = lazy(() => import('./components/GameCanvas'));

function initialMode(): Mode {
  // Autoplay is the default everywhere — the site opens as an arcade attract
  // mode. Pressing any game-control key (or the HUD toggle) takes over.
  return 'auto';
}

export default function App() {
  const route = useHashRoute();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [engaged, setEngaged] = useState(false);
  const [entered, setEntered] = useState(false);
  const [musicOn, setMusicOn] = useState(() => audio.isMusicEnabled);
  const [sfxOn, setSfxOn] = useState(() => audio.isSfxEnabled);

  useEffect(() => {
    audio.init();
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
    audio.unlock();
    bus.emit('gate:entered');
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicOn((on) => {
      audio.setMusicEnabled(!on);
      return !on;
    });
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxOn((on) => {
      audio.setSfxEnabled(!on);
      return !on;
    });
  }, []);

  const closeCard = useCallback(() => {
    setActiveId(null);
    bus.emit('card:closed');
  }, []);

  useEffect(() => {
    setEngaged(false);
  }, [activeId]);

  useEffect(() => {
    // The scene is torn down on a route change away from 'game'; don't emit
    // 'card:closed' (there's no scene left to resume) — just drop the card.
    if (route !== 'game' && activeId !== null) {
      setActiveId(null);
    }
  }, [route, activeId]);

  useEffect(() => {
    function handleLanternBroken(payload: { gameId: string }): void {
      setActiveId(payload.gameId);
    }
    function handleModeChanged(payload: { mode: Mode }): void {
      setMode(payload.mode);
    }

    bus.on('lantern:broken', handleLanternBroken);
    bus.on('mode:changed', handleModeChanged);

    return () => {
      bus.off('lantern:broken', handleLanternBroken);
      bus.off('mode:changed', handleModeChanged);
    };
  }, []);

  useEffect(() => {
    // Keeps the game scene in sync with the current mode. (The attract demo
    // additionally waits for the Enter gate — see 'gate:entered' — so it
    // can't break lanterns and pop cards UNDER the title modal.)
    bus.emit('mode:changed', { mode });
  }, [mode]);

  useEffect(() => {
    if (mode !== 'auto' || activeId === null || engaged) return undefined;
    const timer = window.setTimeout(closeCard, CARD_AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [mode, activeId, engaged, closeCard]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'auto' ? 'manual' : 'auto'));
  }, []);

  if (route === 'gallery') {
    return (
      <>
        <GalleryView />
        {!entered && <EnterModal onEnter={handleEnter} />}
      </>
    );
  }

  const activeGame = activeId !== null ? (games.find((g) => g.id === activeId) ?? null) : null;

  return (
    <>
      <h1 className="sr-only">Games Gallery</h1>
      <Suspense fallback={null}>
        <GameCanvas />
      </Suspense>
      <Hud
        mode={mode}
        onToggle={toggleMode}
        musicOn={musicOn}
        sfxOn={sfxOn}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
      {activeGame && (
        <CardOverlay
          game={activeGame}
          autoAdvance={mode === 'auto' && !engaged}
          onEngage={() => setEngaged(true)}
          onClose={closeCard}
        />
      )}
      {!entered && <EnterModal onEnter={handleEnter} />}
    </>
  );
}
