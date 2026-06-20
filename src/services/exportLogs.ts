import type { DailyLog } from '../types/log';

export interface MonthExport {
  exportedAt: string;
  month: {
    year: number;
    month: number;
    label: string;
  };
  calendar: {
    daysInMonth: number;
    filledDays: number[];
    emptyDays: number[];
    entries: DailyLog[];
  };
}

export function buildMonthExport(
  year: number,
  month: number,
  logs: DailyLog[],
): MonthExport {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const filledDays = logs
    .map((log) => Number(log.logDate.split('-')[2]))
    .sort((a, b) => a - b);
  const filledSet = new Set(filledDays);
  const emptyDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => !filledSet.has(day),
  );

  return {
    exportedAt: new Date().toISOString(),
    month: {
      year,
      month: month + 1,
      label: new Date(year, month, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    },
    calendar: {
      daysInMonth,
      filledDays,
      emptyDays,
      entries: logs,
    },
  };
}

export function downloadMonthExport(
  year: number,
  month: number,
  logs: DailyLog[],
): void {
  const payload = buildMonthExport(year, month, logs);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const monthStr = String(month + 1).padStart(2, '0');
  link.href = url;
  link.download = `everyday-${year}-${monthStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
