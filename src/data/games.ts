export type GameStatus = 'playable' | 'wip' | 'jam' | 'archived';

export interface GameMedia {
  kind: 'image' | 'video';
  src: string;
  alt: string;
}

export interface GameEntry {
  id: string;
  title: string;
  blurb: string;
  description: string;
  media: GameMedia[];
  url: string;
  repoUrl?: string;
  tags: string[];
  year: number;
  status: GameStatus;
  accent: string;
}

export const games: GameEntry[] = [
  {
    id: 'hex-herbs',
    title: 'Hex Herbs',
    blurb: 'An idle occult herbalism ring where you cultivate hexes instead of houseplants.',
    description:
      'Tend a hexagonal garden of cursed herbs, brew increasingly unwise potions, and let the ' +
      'numbers climb while your familiar judges your life choices. Built with Phaser and a ' +
      'worrying amount of enthusiasm for tarot iconography.',
    media: [],
    url: 'https://hex-herbs.vercel.app/',
    repoUrl: 'https://github.com/cwmat/hex-herbs',
    tags: ['idle', 'occult', 'phaser'],
    year: 2026,
    status: 'playable',
    accent: '#8b5cf6',
  },
  {
    id: 'castle-pong',
    title: 'Castle Pong',
    blurb: 'Pong, but the ball is a trebuchet payload and both paddles are load-bearing walls.',
    description:
      'A medieval reimagining of the classic. Defend your keep by bouncing a flaming projectile ' +
      'back and forth until either the AI concedes or your walls literally give up. Physically ' +
      'accurate masonry crumble not included.',
    media: [],
    url: '#',
    repoUrl: 'https://github.com/cwmat/castle-pong',
    tags: ['arcade', 'jam', 'physics'],
    year: 2024,
    status: 'jam',
    accent: '#f6b26b',
  },
  {
    id: 'skeleton-tycoon',
    title: 'Skeleton Tycoon',
    blurb: 'Manage a crypt-based business empire. HR is complicated when nobody has organs.',
    description:
      'A management sim about running a profitable necropolis. Balance bone maintenance costs ' +
      'against haunting revenue, negotiate with disgruntled poltergeist unions, and try not to ' +
      'go bankrupt before the next full moon quarterly review.',
    media: [],
    url: '#',
    tags: ['sim', 'management', 'undead'],
    year: 2025,
    status: 'wip',
    accent: '#6be6c1',
  },
  {
    id: 'regret-the-backlog',
    title: 'Regret: The Backlog',
    blurb: 'A roguelike about the ever-growing pile of side projects you will probably never finish.',
    description:
      'Descend through procedurally generated levels of unstarted repositories, half-written ' +
      'READMEs, and TODO comments from three years ago. Every run ends the same way: you open a ' +
      'new branch and never come back.',
    media: [],
    url: '#',
    repoUrl: 'https://github.com/cwmat/regret-the-backlog',
    tags: ['roguelike', 'meta', 'jam'],
    year: 2023,
    status: 'archived',
    accent: '#e85d75',
  },
  {
    id: 'lint-knight',
    title: 'Lint Knight',
    blurb: 'A side-scrolling brawler where the enemies are unused variables and missing semicolons.',
    description:
      'Wield the Sword of Strict Mode against hordes of eslint warnings. Every boss is a merge ' +
      'conflict. The final level is CI turning green for the first time in weeks.',
    media: [],
    url: '#',
    tags: ['platformer', 'satire'],
    year: 2026,
    status: 'wip',
    accent: '#f6b26b',
  },
];
