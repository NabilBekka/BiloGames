'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import VerifyEmailModal from '../../components/VerifyEmailModal';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, updateUser, deleteAccount } = useAuth();
  
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Verify email modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
    setEditPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setEditPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsUpdating(true);

    let data = { currentPassword: editPassword };

    if (editingField === 'password') {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setIsUpdating(false);
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, special character and no spaces');
        setIsUpdating(false);
        return;
      }
      data.newPassword = newPassword;
    } else if (editingField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        setError('Invalid email format');
        setIsUpdating(false);
        return;
      }
      data.email = editValue;
    } else if (editingField === 'firstname' || editingField === 'lastname') {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
      if (!nameRegex.test(editValue)) {
        setError('Letters only');
        setIsUpdating(false);
        return;
      }
      data[editingField] = editValue;
    } else if (editingField === 'username') {
      if (editValue.length < 3) {
        setError('Username must be at least 3 characters');
        setIsUpdating(false);
        return;
      }
      data.username = editValue;
    } else if (editingField === 'birthDate') {
      data.birthDate = editValue;
    }

    const result = await updateUser(data);

    if (result.success) {
      setSuccess('Updated successfully!');
      setEditingField(null);
      setEditValue('');
      setEditPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.error);
    }
    setIsUpdating(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setIsDeleting(true);

    const result = await deleteAccount(deletePassword);

    if (result.success) {
      router.push('/');
    } else {
      setDeleteError(result.error);
    }
    setIsDeleting(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Not set';
    }
  };

  const getDateInputValue = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your account information</p>

          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            {/* User ID - Non modifiable */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>ID</span>
                <span className={styles.fieldValueId}>{user.odientifiant || 'Not assigned'}</span>
              </div>
            </div>

            {/* First Name */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>First Name</span>
                {editingField === 'firstname' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.fieldInput}
                    autoFocus
                  />
                ) : (
                  <span className={styles.fieldValue}>{user.firstname}</span>
                )}
              </div>
              {editingField === 'firstname' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('firstname', user.firstname)}>
                  Edit
                </button>
              )}
            </div>

            {/* Last Name */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Last Name</span>
                {editingField === 'lastname' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.fieldInput}
                    autoFocus
                  />
                ) : (
                  <span className={styles.fieldValue}>{user.lastname}</span>
                )}
              </div>
              {editingField === 'lastname' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('lastname', user.lastname)}>
                  Edit
                </button>
              )}
            </div>

            {/* Username */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Username</span>
                {editingField === 'username' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.fieldInput}
                    autoFocus
                  />
                ) : (
                  <span className={styles.fieldValue}>{user.username}</span>
                )}
              </div>
              {editingField === 'username' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('username', user.username)}>
                  Edit
                </button>
              )}
            </div>

            {/* Birth Date */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Date of Birth</span>
                {editingField === 'birthDate' ? (
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.fieldInput}
                    max={new Date().toISOString().split('T')[0]}
                    autoFocus
                  />
                ) : (
                  <span className={styles.fieldValue}>{formatDate(user.birthDate)}</span>
                )}
              </div>
              {editingField === 'birthDate' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('birthDate', getDateInputValue(user.birthDate))}>
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Security</h2>

            {/* Email */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>
                  Email
                  {user.emailVerified ? (
                    <span className={styles.verified}>Verified</span>
                  ) : (
                    <button className={styles.notVerified} onClick={() => setShowVerifyModal(true)}>
                      Not verified - Click to verify
                    </button>
                  )}
                </span>
                {editingField === 'email' ? (
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={styles.fieldInput}
                    autoFocus
                  />
                ) : (
                  <span className={styles.fieldValue}>{user.email}</span>
                )}
              </div>
              {editingField === 'email' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('email', user.email)}>
                  Edit
                </button>
              )}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Password</span>
                {editingField === 'password' ? (
                  <div className={styles.passwordFields}>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.fieldInput}
                        placeholder="New password"
                      />
                    </div>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.fieldInput}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                ) : (
                  <span className={styles.fieldValue}>••••••••</span>
                )}
              </div>
              {editingField === 'password' ? (
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <button className={styles.editBtn} onClick={() => startEditing('password', '')}>
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Password confirmation for any edit */}
          {editingField && (
            <div className={styles.confirmSection}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.confirmPassword}>
                <label>Enter your current password to confirm changes</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Current password"
                    className={styles.fieldInput}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
                <button className={styles.forgotLink} onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>
              <button 
                className={styles.saveBtn} 
                onClick={handleSave}
                disabled={!editPassword || isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Danger Zone */}
          <div className={`${styles.section} ${styles.dangerSection}`}>
            <h2 className={styles.sectionTitle}>Danger Zone</h2>
            <div className={styles.field}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Delete Account</span>
                <span className={styles.fieldDescription}>
                  Permanently delete your account and all associated data
                </span>
              </div>
              <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete Account</h2>
            <p className={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
              All your data will be permanently deleted.
            </p>
            
            {deleteError && <div className={styles.error}>{deleteError}</div>}
            
            <div className={styles.modalInput}>
              <label>Enter your password to confirm</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className={styles.fieldInput}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                >
                  {showDeletePassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              <button className={styles.forgotLink} onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteBtn} 
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Email Modal */}
      {showVerifyModal && (
        <VerifyEmailModal onClose={() => setShowVerifyModal(false)} />
      )}
    </>
  );
}
