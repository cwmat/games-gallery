import { useSyncExternalStore } from 'react';

export type Route = 'game' | 'gallery';

function getRoute(): Route {
  return window.location.hash.startsWith('#/gallery') ? 'gallery' : 'game';
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useHashRoute(): Route {
  return useSyncExternalStore(subscribe, getRoute, getRoute);
}
