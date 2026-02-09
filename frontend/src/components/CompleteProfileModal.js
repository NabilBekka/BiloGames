'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import styles from './Modal.module.css';

export default function CompleteProfileModal({ onClose, googleUser }) {
  const { completeProfile, cancelGoogleSignup } = useAuth();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    password: '',
    birthDate: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (googleUser) {
      setFormData(prev => ({
        ...prev,
        firstname: googleUser.firstname || '',
        lastname: googleUser.lastname || ''
      }));
    }
  }, [googleUser]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'firstname':
        const fnameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
        if (!value) {
          newErrors.firstname = 'First name is required';
        } else if (!fnameRegex.test(value)) {
          newErrors.firstname = 'Letters only';
        } else {
          delete newErrors.firstname;
        }
        break;

      case 'lastname':
        const lnameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
        if (!value) {
          newErrors.lastname = 'Last name is required';
        } else if (!lnameRegex.test(value)) {
          newErrors.lastname = 'Letters only';
        } else {
          delete newErrors.lastname;
        }
        break;

      case 'username':
        if (!value) {
          newErrors.username = 'Username is required';
        } else if (value.length < 3) {
          newErrors.username = 'Min 3 characters';
        } else {
          delete newErrors.username;
        }
        break;

      case 'password':
        const hasMinLength = value.length >= 8;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (!value) {
          newErrors.password = 'Password is required';
        } else if (!hasMinLength || !hasUppercase || !hasLowercase || !hasSpecial) {
          newErrors.password = 'Requirements not met';
        } else {
          delete newErrors.password;
        }
        break;

      case 'birthDate':
        if (!value) {
          newErrors.birthDate = 'Birth date is required';
        } else {
          const date = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          if (age < 13) {
            newErrors.birthDate = 'Must be at least 13 years old';
          } else {
            delete newErrors.birthDate;
          }
        }
        break;
    }

    setErrors(newErrors);
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const isFormValid = () => {
    const { firstname, lastname, username, password, birthDate } = formData;
    const strength = getPasswordStrength();
    
    return (
      firstname && 
      lastname && 
      username && 
      password && 
      birthDate &&
      Object.keys(errors).length === 0 &&
      strength.length &&
      strength.uppercase &&
      strength.lowercase &&
      strength.special
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setServerError('');
    setLoading(true);

    const result = await completeProfile(formData);

    if (result.success) {
      onClose();
    } else {
      setServerError(result.error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    if (cancelGoogleSignup) cancelGoogleSignup();
    onClose();
  };

  const passwordChecks = getPasswordStrength();

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.registerModal}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleCancel}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.logoSection}>
          <Logo size="medium" clickable={false} />
        </div>

        <form className={styles.content} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Complete your profile</h2>
          <p className={styles.subtitle}>
            Welcome! Please confirm your details and create a password
          </p>

          {serverError && <div className={styles.error}>{serverError}</div>}

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              value={googleUser?.email || ''}
              disabled
              className={styles.disabledInput}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstname}
                onChange={(e) => updateField('firstname', e.target.value)}
                placeholder="John"
                className={errors.firstname ? styles.inputError : ''}
              />
              {errors.firstname && <span className={styles.fieldError}>{errors.firstname}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => updateField('lastname', e.target.value)}
                placeholder="Doe"
                className={errors.lastname ? styles.inputError : ''}
              />
              {errors.lastname && <span className={styles.fieldError}>{errors.lastname}</span>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="johndoe"
              className={errors.username ? styles.inputError : ''}
            />
            {errors.username && <span className={styles.fieldError}>{errors.username}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a strong password"
                className={errors.password ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            
            {formData.password && (
              <div className={styles.passwordRequirements}>
                <span className={passwordChecks.length ? styles.valid : styles.invalid}>
                  {passwordChecks.length ? '✓' : '✗'} Min 8 characters
                </span>
                <span className={passwordChecks.uppercase ? styles.valid : styles.invalid}>
                  {passwordChecks.uppercase ? '✓' : '✗'} Uppercase letter
                </span>
                <span className={passwordChecks.lowercase ? styles.valid : styles.invalid}>
                  {passwordChecks.lowercase ? '✓' : '✗'} Lowercase letter
                </span>
                <span className={passwordChecks.special ? styles.valid : styles.invalid}>
                  {passwordChecks.special ? '✓' : '✗'} Special character
                </span>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              className={errors.birthDate ? styles.inputError : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birthDate && <span className={styles.fieldError}>{errors.birthDate}</span>}
          </div>

          <button 
            type="submit" 
            className={`${styles.submitBtn} ${!isFormValid() ? styles.disabled : ''}`}
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Creating account...' : 'Complete Registration'}
          </button>

          <p className={styles.terms}>
            By completing registration, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}
