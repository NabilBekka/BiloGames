'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import GoogleRegisterModal from './GoogleRegisterModal';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showGoogleRegister, setShowGoogleRegister] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openLogin = () => {
    setShowRegister(false);
    setShowGoogleRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowGoogleRegister(false);
    setShowRegister(true);
  };

  const closeModals = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowGoogleRegister(false);
    setGoogleData(null);
  };

  const handleGoogleRegister = (data) => {
    setShowLogin(false);
    setGoogleData(data);
    setShowGoogleRegister(true);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
  };

  // Générer les initiales
  const getInitials = () => {
    if (!user) return '';
    const first = user.firstname?.charAt(0)?.toUpperCase() || '';
    const last = user.lastname?.charAt(0)?.toUpperCase() || '';
    return first + last || user.username?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <>
      <header className={styles.header}>
        <Logo size="medium" />
        
        {user ? (
          <div className={styles.userSection} ref={dropdownRef}>
            <button 
              className={styles.avatarBtn}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className={styles.avatar}>
                {getInitials()}
              </div>
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.avatarSmall}>{getInitials()}</div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.firstname} {user.lastname}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
                <div className={styles.dropdownDivider}></div>
                <button className={styles.dropdownItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Settings
                </button>
                <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
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
          onGoogleRegister={handleGoogleRegister}
        />
      )}
      
      {showRegister && (
        <RegisterModal 
          onClose={closeModals} 
          onSwitchToLogin={openLogin} 
        />
      )}

      {showGoogleRegister && googleData && (
        <GoogleRegisterModal
          onClose={closeModals}
          googleData={googleData}
        />
      )}
    </>
  );
}
