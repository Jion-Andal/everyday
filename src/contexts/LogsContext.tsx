import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchCalendarLogsForMonth,
  fetchDiaryEntriesForMonth,
  fetchExportLogsForMonth,
  fetchLogByDate,
  fetchRatingsForMonth,
} from '../services/logs';
import type { CalendarLog, DailyLog, DiaryEntry, ExportLog } from '../types/log';
import { useAuth } from './AuthContext';

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

interface LogsCache {
  calendar: Map<string, CalendarLog[]>;
  diary: Map<string, DiaryEntry[]>;
  ratings: Map<string, number[]>;
  export: Map<string, ExportLog[]>;
  detail: Map<string, DailyLog | null>;
}

interface LogsContextValue {
  tick: number;
  getCachedCalendarLogs: (year: number, month: number) => CalendarLog[] | undefined;
  getCachedDiaryEntries: (year: number, month: number) => DiaryEntry[] | undefined;
  getCachedRatings: (year: number, month: number) => number[] | undefined;
  loadCalendarLogs: (year: number, month: number, force?: boolean) => Promise<CalendarLog[]>;
  loadDiaryEntries: (year: number, month: number, force?: boolean) => Promise<DiaryEntry[]>;
  loadRatings: (year: number, month: number, force?: boolean) => Promise<number[]>;
  loadExportLogs: (year: number, month: number, force?: boolean) => Promise<ExportLog[]>;
  loadLogByDate: (logDate: string, force?: boolean) => Promise<DailyLog | null>;
  invalidateLogDate: (logDate: string) => void;
  invalidateMonth: (year: number, month: number) => void;
}

const LogsContext = createContext<LogsContextValue | null>(null);

function createEmptyCache(): LogsCache {
  return {
    calendar: new Map(),
    diary: new Map(),
    ratings: new Map(),
    export: new Map(),
    detail: new Map(),
  };
}

export function LogsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const cacheRef = useRef<LogsCache>(createEmptyCache());
  const inflightRef = useRef(new Map<string, Promise<unknown>>());
  const [tick, setTick] = useState(0);
  const notify = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!session) {
      cacheRef.current = createEmptyCache();
      inflightRef.current.clear();
      notify();
    }
  }, [session, notify]);

  const load = useCallback(
    async <T,>(
      inflightKey: string,
      cache: Map<string, T>,
      key: string,
      fetcher: () => Promise<T>,
      force = false,
    ): Promise<T> => {
      if (!force && cache.has(key)) {
        return cache.get(key)!;
      }

      if (!force) {
        const inflight = inflightRef.current.get(inflightKey);
        if (inflight) return inflight as Promise<T>;
      }

      const promise = fetcher()
        .then((data) => {
          cache.set(key, data);
          inflightRef.current.delete(inflightKey);
          notify();
          return data;
        })
        .catch((error) => {
          inflightRef.current.delete(inflightKey);
          throw error;
        });

      inflightRef.current.set(inflightKey, promise);
      return promise;
    },
    [notify],
  );

  const invalidateMonth = useCallback(
    (year: number, month: number) => {
      const key = monthKey(year, month);
      cacheRef.current.calendar.delete(key);
      cacheRef.current.diary.delete(key);
      cacheRef.current.ratings.delete(key);
      cacheRef.current.export.delete(key);

      for (const scope of ['calendar', 'diary', 'ratings', 'export'] as const) {
        inflightRef.current.delete(`${scope}:${key}`);
      }

      notify();
    },
    [notify],
  );

  const invalidateLogDate = useCallback(
    (logDate: string) => {
      cacheRef.current.detail.delete(logDate);
      inflightRef.current.delete(`detail:${logDate}`);

      const [y, m] = logDate.split('-').map(Number);
      invalidateMonth(y, m - 1);
    },
    [invalidateMonth],
  );

  const value = useMemo<LogsContextValue>(
    () => ({
      tick,
      getCachedCalendarLogs: (year, month) =>
        cacheRef.current.calendar.get(monthKey(year, month)),
      getCachedDiaryEntries: (year, month) =>
        cacheRef.current.diary.get(monthKey(year, month)),
      getCachedRatings: (year, month) =>
        cacheRef.current.ratings.get(monthKey(year, month)),
      loadCalendarLogs: (year, month, force) =>
        load(
          `calendar:${monthKey(year, month)}`,
          cacheRef.current.calendar,
          monthKey(year, month),
          () => fetchCalendarLogsForMonth(year, month),
          force,
        ),
      loadDiaryEntries: (year, month, force) =>
        load(
          `diary:${monthKey(year, month)}`,
          cacheRef.current.diary,
          monthKey(year, month),
          () => fetchDiaryEntriesForMonth(year, month),
          force,
        ),
      loadRatings: (year, month, force) =>
        load(
          `ratings:${monthKey(year, month)}`,
          cacheRef.current.ratings,
          monthKey(year, month),
          () => fetchRatingsForMonth(year, month),
          force,
        ),
      loadExportLogs: (year, month, force) =>
        load(
          `export:${monthKey(year, month)}`,
          cacheRef.current.export,
          monthKey(year, month),
          () => fetchExportLogsForMonth(year, month),
          force,
        ),
      loadLogByDate: (logDate, force) =>
        load(
          `detail:${logDate}`,
          cacheRef.current.detail,
          logDate,
          () => fetchLogByDate(logDate),
          force,
        ),
      invalidateLogDate,
      invalidateMonth,
    }),
    [tick, load, invalidateLogDate, invalidateMonth],
  );

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogsStore() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error('useLogsStore must be used within LogsProvider');
  return ctx;
}
