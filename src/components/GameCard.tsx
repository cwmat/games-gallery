import type { GameEntry, GameMedia } from '../data/games';

function resolveMediaSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
}

function Media({ media, hero = false }: { media: GameMedia; hero?: boolean }) {
  const src = resolveMediaSrc(media.src);
  const className = hero ? 'game-card__media game-card__media--hero' : 'game-card__media';

  if (media.kind === 'video') {
    return (
      <video
        className={className}
        src={src}
        poster={media.poster ? resolveMediaSrc(media.poster) : undefined}
        muted
        loop
        playsInline
        autoPlay={hero}
        controls
        aria-label={media.alt}
      />
    );
  }

  return <img className={className} src={src} alt={media.alt} loading="lazy" />;
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

      {game.media.length > 0 ? (
        <Media media={game.media[0]} hero />
      ) : (
        <div className="game-card__media-slot" aria-hidden="true">
          <span className="game-card__media-slot-glyph">▶</span>
          <span>gameplay footage soon</span>
        </div>
      )}

      <p className="game-card__blurb">{game.blurb}</p>

      {game.media.length > 1 && (
        <div className="game-card__media-list">
          {game.media.slice(1).map((media, i) => (
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
