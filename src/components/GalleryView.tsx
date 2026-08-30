import { games } from '../data/games';
import { GameCard } from './GameCard';

export function GalleryView() {
  return (
    <div className="gallery-view">
      <header className="gallery-view__header">
        <h1 className="gallery-view__title">Games Gallery</h1>
        <a className="gallery-view__back" href="#/">
          &larr; Back to the corridor
        </a>
      </header>

      <ul className="gallery-grid">
        {games.map((game) => (
          <li key={game.id} className="gallery-grid__item">
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </div>
  );
}
