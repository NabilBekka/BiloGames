'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import GoogleRegisterModal from './GoogleRegisterModal';
import VerifyEmailModal from './VerifyEmailModal';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showGoogleRegister, setShowGoogleRegister] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
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

  // Calculer les jours restants pour vérifier l'email (6 jours au total)
  const getDaysRemaining = () => {
    if (!user || user.emailVerified || !user.createdAt) return null;
    const createdDate = new Date(user.createdAt);
    const deadline = new Date(createdDate.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 jours
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Retourne le nombre de jours (6, 5, 4, 3, 2, 1, 0)
    if (diffDays > 6) return 6;
    if (diffDays < 0) return 0;
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isLastDay = daysRemaining === 1 || daysRemaining === 0;

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
    setShowVerifyEmail(false);
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
    router.push('/');
  };

  const handleSettings = () => {
    setShowDropdown(false);
    router.push('/settings');
  };

  const handleVerifyClick = () => {
    setShowVerifyEmail(true);
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
            {!user.emailVerified && daysRemaining !== null && (
              <button className={`${styles.verifyAlert} ${isLastDay ? styles.verifyAlertUrgent : ''}`} onClick={handleVerifyClick}>
                {!isLastDay && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {isLastDay 
                  ? '⚠️ Last day to verify email!' 
                  : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left to verify email`
                }
              </button>
            )}
            <span className={styles.greeting}>Hello {user.username}</span>
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
                    <span className={styles.odientifiant}>ID: {user.odientifiant}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
                <div className={styles.dropdownDivider}></div>
                <button className={styles.dropdownItem} onClick={handleSettings}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
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

      {showVerifyEmail && (
        <VerifyEmailModal onClose={closeModals} />
      )}
    </>
  );
}
