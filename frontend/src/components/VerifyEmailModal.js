'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Modal.module.css';

export default function VerifyEmailModal({ onClose }) {
  const { sendVerificationCode, verifyEmail } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    
    const result = await sendVerificationCode();
    
    if (result.success) {
      setCodeSent(true);
      setResendTimer(60);
      setSuccess('Code sent to your email!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
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
    
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const result = await verifyEmail(fullCode);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.iconCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 7L2 7" />
            </svg>
          </div>
          
          <h2 className={styles.title}>Verify your email</h2>
          <p className={styles.subtitle}>
            We'll send a 6-digit code to your email address
          </p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {!codeSent ? (
            <button 
              className={styles.submitBtn} 
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          ) : (
            <>
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
                onClick={handleVerify}
                disabled={loading || code.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <p className={styles.resendText}>
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className={styles.timerText}>Resend in {resendTimer}s</span>
                ) : (
                  <button 
                    className={styles.resendBtn}
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
