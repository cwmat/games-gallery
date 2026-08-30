import type { GameEntry, GameMedia } from '../data/games';

function resolveMediaSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
}

function Media({ media }: { media: GameMedia }) {
  const src = resolveMediaSrc(media.src);

  if (media.kind === 'video') {
    return <video className="game-card__media" src={src} muted loop playsInline controls aria-label={media.alt} />;
  }

  return <img className="game-card__media" src={src} alt={media.alt} loading="lazy" />;
}

export function GameCard({ game }: { game: GameEntry }) {
  return (
    <article className="game-card" style={{ borderColor: game.accent }}>
      <header className="game-card__header">
        <h2 className="game-card__title">{game.title}</h2>
        <span className="game-card__badge" style={{ backgroundColor: game.accent }}>
          {game.year} &middot; {game.status}
        </span>
      </header>

      <p className="game-card__blurb">{game.blurb}</p>

      {game.media.length > 0 && (
        <div className="game-card__media-list">
          {game.media.map((media, i) => (
            <Media key={`${game.id}-media-${i}`} media={media} />
          ))}
        </div>
      )}

      <p className="game-card__description">{game.description}</p>

      {game.tags.length > 0 && (
        <ul className="game-card__tags">
          {game.tags.map((tag) => (
            <li key={tag} className="game-card__tag">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="game-card__links">
        {/^https?:\/\//.test(game.url) && (
          <a className="game-card__link game-card__link--primary" href={game.url} target="_blank" rel="noreferrer">
            Visit game
          </a>
        )}
        {game.repoUrl && (
          <a className="game-card__link" href={game.repoUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        )}
      </div>
    </article>
  );
}
