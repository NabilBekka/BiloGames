'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const closeModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  return (
    <>
      <header className={styles.header}>
        <Logo size="medium" />
        
        {user ? (
          <div className={styles.userSection}>
            <span className={styles.greeting}>Hello {user.username}</span>
            <button className={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={openLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Login
          </button>
        )}
      </header>

      {showLogin && (
        <LoginModal 
          onClose={closeModals} 
          onSwitchToRegister={openRegister} 
        />
      )}
      
      {showRegister && (
        <RegisterModal 
          onClose={closeModals} 
          onSwitchToLogin={openLogin} 
        />
      )}
    </>
  );
}
