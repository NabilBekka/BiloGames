'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();
  
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    const result = await forgotPassword(email);
    
    if (result.success) {
      setStep(2);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const result = await verifyResetCode(email, fullCode);
    
    if (result.success) {
      setStep(3);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const getPasswordStrength = () => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      noSpaces: !/\s/.test(newPassword)
    };
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const strength = getPasswordStrength();
    if (!strength.length || !strength.uppercase || !strength.lowercase || !strength.special || !strength.noSpaces) {
      setError('Password does not meet requirements');
      return;
    }
    
    setLoading(true);
    const fullCode = code.join('');
    const result = await resetPassword(email, fullCode, newPassword);
    
    if (result.success) {
      router.push('/?passwordReset=true');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const passwordChecks = getPasswordStrength();

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <button className={styles.backBtn} onClick={() => router.push('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </button>

          {step === 1 && (
            <>
              <div className={styles.iconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h1 className={styles.title}>Forgot password?</h1>
              <p className={styles.subtitle}>
                Enter your email address and we'll send you a code to reset your password.
              </p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleSendCode}>
                <div className={styles.inputGroup}>
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset code'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.iconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </div>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.codeInputs} onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={styles.codeInput}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button 
                className={styles.submitBtn} 
                onClick={handleVerifyCode}
                disabled={loading || code.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </button>

              <button 
                className={styles.linkBtn}
                onClick={() => { setStep(1); setCode(['', '', '', '', '', '']); }}
              >
                Use a different email
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.iconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </div>
              <h1 className={styles.title}>Create new password</h1>
              <p className={styles.subtitle}>
                Your new password must be different from previous passwords.
              </p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleResetPassword}>
                <div className={styles.inputGroup}>
                  <label>New password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  
                  {newPassword && (
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
                      <span className={passwordChecks.noSpaces ? styles.valid : styles.invalid}>
                        {passwordChecks.noSpaces ? '✓' : '✗'} No spaces
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
