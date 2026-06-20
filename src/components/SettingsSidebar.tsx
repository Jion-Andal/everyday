import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { ConfirmModal } from './ConfirmModal';
import { SettingsAccordion } from './SettingsAccordion';

interface SettingsSidebarProps {
  open: boolean;
  year: number;
  month: number;
  onExportStory: () => Promise<void>;
  onClose: () => void;
}

export function SettingsSidebar({ open, year, month, onExportStory, onClose }: SettingsSidebarProps) {
  const { signOut, changePassword } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setSignOutError(null);
    setExportOpen(false);
    setAboutOpen(false);
    setExportError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handleDownload = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await onExportStory();
    } catch (err) {
      setExportError(getErrorMessage(err, 'Could not create story image.'));
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setSignOutOpen(false);
      onClose();
    } catch (err) {
      setSignOutError(getErrorMessage(err, 'Could not sign out.'));
      setSignOutOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Could not update password.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <div className="sidebar-backdrop" onClick={onClose} role="presentation" />
      <aside className="settings-sidebar" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-sidebar__header">
          <h2 id="settings-title" className="settings-sidebar__title">
            Settings
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>

        <div className="settings-sidebar__body">
          <SettingsAccordion
            id="settings-export"
            title="Export"
            open={exportOpen}
            onToggle={() => setExportOpen((v) => !v)}
          >
            <p className="settings-section__desc">
              Save a {monthLabel} story image (9:16) of your calendar — ready to post on
              Instagram or Facebook Stories.
            </p>
            <button
              type="button"
              className="btn btn--secondary settings-action"
              onClick={handleDownload}
              disabled={exporting}
            >
              {exporting ? 'Creating image…' : `Download ${monthLabel} story`}
            </button>
            {exportError && (
              <p className="form-error settings-feedback" role="alert">
                {exportError}
              </p>
            )}
          </SettingsAccordion>

          <SettingsAccordion
            id="settings-about"
            title="About the developer"
            open={aboutOpen}
            onToggle={() => setAboutOpen((v) => !v)}
          >
            <div className="settings-about">
              <a href="mailto:andaljion@gmail.com" className="settings-link">
                andaljion@gmail.com
              </a>
              <a
                href="https://github.com/Jion-Andal"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-link"
              >
                github.com/Jion-Andal
              </a>
            </div>
          </SettingsAccordion>

          <section className="settings-section">
            <h3 className="settings-section__title">Account</h3>
            {!passwordOpen ? (
              <button
                type="button"
                className="btn btn--secondary settings-action"
                onClick={() => {
                  setPasswordOpen(true);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
              >
                Change password
              </button>
            ) : (
              <form className="settings-password-form" onSubmit={handleChangePassword}>
                <div className="field">
                  <label className="field-label" htmlFor="settings-current-password">
                    Current password
                  </label>
                  <input
                    id="settings-current-password"
                    type="password"
                    className="field-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="settings-new-password">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    className="field-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="settings-confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    className="field-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="settings-password-actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      setPasswordOpen(false);
                      setPasswordError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={passwordSaving}>
                    {passwordSaving ? 'Saving…' : 'Update password'}
                  </button>
                </div>
              </form>
            )}

            {passwordError && (
              <p className="form-error settings-feedback" role="alert">
                {passwordError}
              </p>
            )}
            {signOutError && (
              <p className="form-error settings-feedback" role="alert">
                {signOutError}
              </p>
            )}
            {passwordSuccess && (
              <p className="settings-feedback settings-feedback--success" role="status">
                {passwordSuccess}
              </p>
            )}

            <button
              type="button"
              className="btn btn--danger settings-action settings-action--signout"
              onClick={() => setSignOutOpen(true)}
            >
              Sign out
            </button>
          </section>
        </div>
      </aside>

      <ConfirmModal
        open={signOutOpen}
        title="Sign out?"
        message="You'll need to sign in again to access your journal."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
      />
    </>
  );
}
