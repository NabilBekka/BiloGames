'use client';

import styles from './Logo.module.css';

export default function Logo({ size = 'medium' }) {
  const sizeClass = styles[size] || styles.medium;
  
  return (
    <div className={`${styles.logoContainer} ${sizeClass}`}>
      <div className={styles.logoIcon}>
        <div className={styles.logoGrid}>
          <div className={`${styles.tile} ${styles.purple}`}></div>
          <div className={`${styles.tile} ${styles.pink}`}></div>
          <div className={`${styles.tile} ${styles.orange}`}></div>
          <div className={`${styles.tile} ${styles.green}`}></div>
        </div>
      </div>
      <span className={styles.logoText}>
        <span className={styles.bilo}>Bilo</span>
        <span className={styles.games}>Games</span>
      </span>
    </div>
  );
}
