import { getErrorMessage } from '../lib/errors';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLogsStore } from '../contexts/LogsContext';
import type { CalendarLog, DiaryEntry } from '../types/log';

function useCachedMonthQuery<T>(
  year: number,
  month: number,
  enabled: boolean,
  getCached: (year: number, month: number) => T | undefined,
  load: (year: number, month: number, force?: boolean) => Promise<T>,
) {
  const store = useLogsStore();
  const cached = enabled ? getCached(year, month) : undefined;
  const [loading, setLoading] = useState(enabled && cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (!enabled) return;

      const force = options?.force ?? false;
      const silent = options?.silent ?? false;

      if (!silent && (force || getCached(year, month) === undefined)) {
        setLoading(true);
      }
      setError(null);

      try {
        await load(year, month, force);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load logs'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enabled, getCached, load, year, month],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (getCached(year, month) !== undefined) {
      setLoading(false);
      setError(null);
      return;
    }

    void refresh();
  }, [enabled, year, month, store.tick, getCached, refresh]);

  const items = enabled ? getCached(year, month) ?? [] : [];

  return { items, loading: enabled ? loading : false, error, refresh };
}

export function useCalendarLogs(year: number, month: number) {
  const store = useLogsStore();
  const { items, loading, error, refresh } = useCachedMonthQuery(
    year,
    month,
    true,
    store.getCachedCalendarLogs,
    store.loadCalendarLogs,
  );

  const logsByDate = useMemo(
    () => new Map(items.map((log) => [log.logDate, log])),
    [items],
  );

  return { logs: items, logsByDate, loading, error, refresh };
}

export function useDiaryEntries(year: number, month: number) {
  const store = useLogsStore();
  const { items, loading, error, refresh } = useCachedMonthQuery(
    year,
    month,
    true,
    store.getCachedDiaryEntries,
    store.loadDiaryEntries,
  );

  return { entries: items, loading, error, refresh };
}

export function useRatings(year: number, month: number, enabled: boolean) {
  const store = useLogsStore();
  const { items, loading, error, refresh } = useCachedMonthQuery(
    year,
    month,
    enabled,
    store.getCachedRatings,
    store.loadRatings,
  );

  return { ratings: items, loading, error, refresh };
}

export type { CalendarLog, DiaryEntry };
