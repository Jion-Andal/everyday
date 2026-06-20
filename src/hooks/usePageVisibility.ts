import { useEffect } from 'react';

/** Tracks document visibility for CSS perf tuning when the app is backgrounded. */
export function usePageVisibility() {
  useEffect(() => {
    const sync = () => {
      document.documentElement.dataset.pageVisibility = document.hidden ? 'hidden' : 'visible';
    };

    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
}
