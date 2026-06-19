import type { ReactNode } from 'react';
import { DayBox } from './DayBox';
import type { DailyLog } from '../types/log';

interface CalendarProps {
  year: number;
  month: number;
  logsByDate: Map<string, DailyLog>;
  onDayClick: (date: Date, log?: DailyLog) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Calendar({
  year,
  month,
  logsByDate,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const cells: ReactNode[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateString(year, month, day);
    const log = logsByDate.get(dateStr);
    const isToday = isCurrentMonth && today.getDate() === day;

    cells.push(
      <DayBox
        key={day}
        day={day}
        log={log}
        isToday={isToday}
        onClick={() => onDayClick(new Date(year, month, day), log)}
      />,
    );
  }

  return (
    <section className="calendar">
      <div className="calendar__nav">
        <button type="button" className="calendar__nav-btn" onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <h2 className="calendar__title">{monthLabel}</h2>
        <button type="button" className="calendar__nav-btn" onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="calendar__grid">{cells}</div>
    </section>
  );
}
