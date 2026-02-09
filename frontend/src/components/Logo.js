'use client';

import Link from 'next/link';
import styles from './Logo.module.css';

export default function Logo({ size = 'medium', clickable = true }) {
  const sizeClass = styles[size] || styles.medium;
  
  const logoContent = (
    <>
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
    </>
  );

  if (clickable) {
    return (
      <Link href="/" className={`${styles.logoContainer} ${sizeClass} ${styles.clickable}`}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={`${styles.logoContainer} ${sizeClass}`}>
      {logoContent}
    </div>
  );
}
