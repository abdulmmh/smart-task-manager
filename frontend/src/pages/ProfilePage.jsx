import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { tasksApi } from '../api/tasksApi';
import { getAvatarTone, getInitials } from '../utils/avatarUtils';
import {
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Calendar,
  Save,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the source of truth for the active tab.
  const activeTab = searchParams.get('tab') === 'security' ? 'security' : 'profile';

  const handleTabChange = (tab) => {
    setSearchParams(tab === 'security' ? { tab: 'security' } : {});
  };

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // User tasks stats
  const [userTasks, setUserTasks] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      tasksApi
        .getTasks({ assigneeId: user.id })
        .then((data) => {
          if (isMounted) {
            setUserTasks(data.tasks || []);
            setIsLoadingStats(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingStats(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ── Password strength ──────────────────────────────────────────────────────
  const isMinLength = newPassword.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strengthScore = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (newPassword.length >= 12) s++;
    if (hasMixedChars) s++;
    if (hasSpecial) s++;
    return s;
  })();

  const strengthLabel = (() => {
    if (strengthScore <= 1) return { text: 'Weak', color: '#EF4444' };
    if (strengthScore <= 2) return { text: 'Fair', color: '#F59E0B' };
    if (strengthScore === 3) return { text: 'Good', color: '#10B981' };
    return { text: 'Strong', color: '#059669' };
  })();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    if (!name.trim()) {
      setProfileErrorMsg('Full name cannot be empty.');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      const res = await authApi.updateProfile(name.trim());
      updateUser(res.user);
      setName(res.user.name);
      setProfileSuccessMsg('Profile details successfully updated!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');
    if (!currentPassword) { setPasswordErrorMsg('Please enter your current password.'); return; }
    if (!newPassword || newPassword.length < 8) { setPasswordErrorMsg('New password must be at least 8 characters long.'); return; }
    if (newPassword !== confirmPassword) { setPasswordErrorMsg('New password and confirmation do not match.'); return; }
    if (currentPassword === newPassword) { setPasswordErrorMsg('New password cannot be identical to your current password.'); return; }
    try {
      setIsUpdatingPassword(true);
      const res = await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccessMsg(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 5000);
    } catch (err) {
      setPasswordErrorMsg(err.response?.data?.error || 'Failed to update password. Please check your current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalAssigned = userTasks.length;
  const completedCount = userTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = userTasks.filter((t) => t.status === 'In Progress').length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  // ── Avatar (name-based, consistent everywhere) ─────────────────────────────
  const avatarTone = getAvatarTone(user?.name);
  const avatarInitials = getInitials(user?.name);

  return (
    <div className="profile-page-container">
      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <section className="profile-hero-card">
        <div className="profile-hero-content">
          {/* Avatar uses the shared `user-avatar-circle` class so tone-* CSS applies */}
          <div className={`user-avatar-circle profile-hero-avatar tone-${avatarTone}`}>
            {avatarInitials}
          </div>

          <div className="profile-hero-info">
            <div className="profile-hero-header-row">
              <h1 className="profile-hero-name">{user?.name}</h1>
              <span className={`profile-badge-role ${user?.role === 'admin' ? 'admin' : 'member'}`}>
                {user?.role === 'admin' ? 'Lead Administrator' : 'Team Member'}
              </span>
            </div>

            <div className="profile-hero-meta">
              <span className="profile-meta-item">
                <Mail size={14} />
                <span>{user?.email}</span>
              </span>
              <span className="profile-meta-dot">•</span>
              <span className="profile-meta-item">
                <Calendar size={14} />
                <span>
                  Member since{' '}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                      })
                    : '2026'}
                </span>
              </span>
              <span className="profile-meta-dot">•</span>
              <span className="profile-meta-item">
                <ShieldCheck size={14} color="var(--success)" />
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>Active Account</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="profile-stats-strip">
          <div className="profile-stat-box">
            <span className="profile-stat-label">Assigned Tasks</span>
            <span className="profile-stat-val">{isLoadingStats ? '–' : totalAssigned}</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat-box">
            <span className="profile-stat-label">In Progress</span>
            <span className="profile-stat-val text-amber">{isLoadingStats ? '–' : inProgressCount}</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat-box">
            <span className="profile-stat-label">Completed</span>
            <span className="profile-stat-val text-emerald">{isLoadingStats ? '–' : completedCount}</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat-box">
            <span className="profile-stat-label">Completion Rate</span>
            <span className="profile-stat-val text-blue">{isLoadingStats ? '–' : `${completionRate}%`}</span>
          </div>
        </div>
      </section>

      {/* ── Tabs + Card combined ──────────────────────────────────────────── */}
      <div className="profile-tabs-card">
        {/* Tab bar */}
        <div className="profile-tabs-bar">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <User size={16} />
            <span>Personal Information</span>
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => handleTabChange('security')}
          >
            <KeyRound size={16} />
            <span>Password &amp; Security</span>
          </button>
        </div>

        {/* ── Tab 1: Personal Information ───────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="profile-tab-panel">
            <div className="profile-panel-header">
              <div className="profile-panel-icon">
                <User size={18} color="var(--primary)" />
              </div>
              <div>
                <h2 className="profile-card-title">Profile Information</h2>
                <p className="profile-card-subtitle">Update your display name and review account credentials.</p>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="alert-box alert-success">
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="alert-box alert-danger">
                <AlertCircle size={16} />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="user-name-input" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    maxLength={100}
                  />
                  <span className="form-help-text">
                    This name will be visible to your team members across projects.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="user-email-input" className="form-label">
                    Email Address
                  </label>
                  <div className="input-with-adornment">
                    <input
                      id="user-email-input"
                      type="email"
                      className="form-input read-only"
                      value={user?.email || ''}
                      readOnly
                      disabled
                    />
                    <span className="input-adornment-tag">Verified</span>
                  </div>
                  <span className="form-help-text">
                    Email address serves as your primary sign-in handle and cannot be modified.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="user-role-input" className="form-label">
                    Assigned Role &amp; Permissions
                  </label>
                  <input
                    id="user-role-input"
                    type="text"
                    className="form-input read-only"
                    value={
                      user?.role === 'admin'
                        ? 'Lead Administrator (Full System Access)'
                        : 'Team Member (Task Collaborator)'
                    }
                    readOnly
                    disabled
                  />
                  <span className="form-help-text">
                    {user?.role === 'admin'
                      ? 'You have complete administrative authority to create and manage projects, tasks, and team members.'
                      : 'You have standard member access to update your assigned tasks and track milestones.'}
                  </span>
                </div>
              </div>

              <div className="profile-form-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdatingProfile || name.trim() === user?.name}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={15} className="btn-spinner" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab 2: Password & Security ────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="profile-tab-panel">
            <div className="profile-panel-header">
              <div className="profile-panel-icon security">
                <Lock size={18} color="#7C3AED" />
              </div>
              <div>
                <h2 className="profile-card-title">Change Password</h2>
                <p className="profile-card-subtitle">
                  Protect your workspace by setting a strong, unique password.
                </p>
              </div>
            </div>

            {passwordSuccessMsg && (
              <div className="alert-box alert-success">
                <CheckCircle2 size={16} />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordErrorMsg && (
              <div className="alert-box alert-danger">
                <AlertCircle size={16} />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="profile-form">
              <div className="profile-form-vertical">
                {/* Current Password */}
                <div className="form-group">
                  <label htmlFor="current-pw-input" className="form-label">
                    Current Password <span className="text-danger">*</span>
                  </label>
                  <div className="password-input-box">
                    <input
                      id="current-pw-input"
                      type={showCurrentPw ? 'text' : 'password'}
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      className="pw-toggle-btn"
                      onClick={() => setShowCurrentPw((p) => !p)}
                      aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <span className="form-help-text">
                    Enter your existing account password to authorise this update.
                  </span>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label htmlFor="new-pw-input" className="form-label">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <div className="password-input-box">
                    <input
                      id="new-pw-input"
                      type={showNewPw ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="pw-toggle-btn"
                      onClick={() => setShowNewPw((p) => !p)}
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="pw-strength-container">
                      <div className="pw-strength-meter">
                        <div
                          className="pw-strength-bar"
                          style={{
                            width: `${Math.min(100, Math.max(20, strengthScore * 25))}%`,
                            backgroundColor: strengthLabel.color,
                          }}
                        />
                      </div>
                      <div className="pw-strength-text">
                        <span>Password Strength:</span>
                        <strong style={{ color: strengthLabel.color }}>{strengthLabel.text}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirm-pw-input" className="form-label">
                    Confirm New Password <span className="text-danger">*</span>
                  </label>
                  <div className="password-input-box">
                    <input
                      id="confirm-pw-input"
                      type={showConfirmPw ? 'text' : 'password'}
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="pw-toggle-btn"
                      onClick={() => setShowConfirmPw((p) => !p)}
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Requirements checklist */}
                <div className="pw-requirements-card">
                  <span className="pw-requirements-title">Password Guidelines:</span>
                  <ul className="pw-requirements-list">
                    <li className={isMinLength ? 'met' : 'unmet'}>
                      <CheckCircle2 size={13} />
                      <span>Minimum 8 characters in length</span>
                    </li>
                    <li className={hasMixedChars ? 'met' : 'unmet'}>
                      <CheckCircle2 size={13} />
                      <span>Includes both letters and numbers</span>
                    </li>
                    <li className={passwordsMatch ? 'met' : 'unmet'}>
                      <CheckCircle2 size={13} />
                      <span>New password and confirmation match</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="profile-form-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isUpdatingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !passwordsMatch ||
                    newPassword.length < 8
                  }
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 size={15} className="btn-spinner" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
