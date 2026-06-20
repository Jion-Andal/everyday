import { Link } from 'react-router-dom';
import { PenIcon } from './PenIcon';
import { useTheme } from '../contexts/ThemeContext';

function ThemeIcon({ dark }: { dark: boolean }) {
  if (!dark) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface HeaderProps {
  onOpenSettings?: () => void;
  backTo?: string;
}

export function Header({ onOpenSettings, backTo }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-brand">
        {backTo ? (
          <Link to={backTo} className="header-back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Calendar</span>
          </Link>
        ) : (
          <>
            <PenIcon className="header-icon" />
            <div className="header-text">
              <h1 className="header-title">everyday</h1>
              <p className="header-tagline">a quiet record</p>
            </div>
          </>
        )}
      </div>
      <div className="header-actions">
        <div className="header-actions-dock">
          <button
            type="button"
            className="header-action-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
          >
            <ThemeIcon dark={theme === 'dark'} />
          </button>
          {onOpenSettings && (
            <button
              type="button"
              className="header-action-btn"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
