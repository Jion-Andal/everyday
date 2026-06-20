import { memo, useMemo } from 'react';
import { DayBox } from './DayBox';
import type { CalendarLog } from '../types/log';

interface CalendarProps {
  year: number;
  month: number;
  logsByDate: Map<string, CalendarLog>;
  onDayClick: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const Calendar = memo(function Calendar({
  year,
  month,
  logsByDate,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();
  const isCurrentMonth = todayYear === year && todayMonth === month;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const cells = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateStr = toDateString(year, month, day);
      const log = logsByDate.get(dateStr);
      const isToday = isCurrentMonth && todayDay === day;

      return (
        <DayBox
          key={day}
          day={day}
          log={log}
          isToday={isToday}
          onDayClick={onDayClick}
        />
      );
    });
  }, [daysInMonth, isCurrentMonth, logsByDate, month, onDayClick, todayDay, year]);

  return (
    <section className="calendar">
      <div className="calendar__nav">
        <button type="button" className="calendar__nav-btn" onClick={onPrevMonth} aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="calendar__heading">
          <p className="calendar__eyebrow">Your journal</p>
          <h2 className="calendar__title">{monthLabel}</h2>
        </div>
        <button type="button" className="calendar__nav-btn" onClick={onNextMonth} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="calendar__panel">
        <div className="calendar__grid">{cells}</div>
      </div>
    </section>
  );
});
