import { useCallback, useEffect, useState } from 'react';
import { fetchLogsForMonth } from '../services/logs';
import type { DailyLog } from '../types/log';

export function useLogs(year: number, month: number) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLogsForMonth(year, month);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logsByDate = new Map(logs.map((l) => [l.logDate, l]));

  return { logs, logsByDate, loading, error, refresh };
}
