'use client';

import Header from '../components/Header';
import styles from './page.module.css';

const games = [
  { id: 1, name: '2048', icon: '🔢', color: '#F59E0B', category: 'Puzzle' },
  { id: 2, name: 'Sudoku', icon: '🧩', color: '#6366F1', category: 'Logic' },
  { id: 3, name: 'Tetris', icon: '🧱', color: '#EC4899', category: 'Arcade' },
  { id: 4, name: 'Mahjong', icon: '🀄', color: '#10B981', category: 'Strategy' },
  { id: 5, name: 'Memory', icon: '🧠', color: '#8B5CF6', category: 'Brain' },
  { id: 6, name: 'Quiz', icon: '❓', color: '#F43F5E', category: 'Trivia' },
];

export default function Home() {
  return (
    <main>
      <Header />
      
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Play and prove your genius</h1>
        <p className={styles.heroSubtitle}>Choose a game and start playing instantly</p>
      </section>

      <section className={styles.gamesSection}>
        <div className={styles.gamesGrid}>
          {games.map((game) => (
            <div key={game.id} className={styles.gameCard}>
              <div 
                className={styles.gameIcon} 
                style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}dd)` }}
              >
                <span>{game.icon}</span>
              </div>
              <div className={styles.gameInfo}>
                <h3>{game.name}</h3>
                <span>{game.category}</span>
              </div>
              <button 
                className={styles.playBtn}
                style={{ backgroundColor: game.color }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
