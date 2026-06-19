import { PenIcon } from './PenIcon';
import { useTheme } from '../contexts/ThemeContext';

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A7.5 7.5 0 0 1 9.5 3.5a7.5 7.5 0 1 0 11.5 11Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-brand">
        <PenIcon className="header-icon" />
        <div className="header-text">
          <h1 className="header-title">everyday</h1>
          <p className="header-tagline">a quiet record</p>
        </div>
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
      >
        <ThemeIcon dark={theme === 'dark'} />
      </button>
    </header>
  );
}
