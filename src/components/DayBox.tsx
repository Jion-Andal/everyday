import { memo } from 'react';
import type { CalendarLog } from '../types/log';

interface DayBoxProps {
  day: number;
  log?: CalendarLog;
  isToday: boolean;
  onDayClick: (day: number) => void;
}

export const DayBox = memo(function DayBox({ day, log, isToday, onDayClick }: DayBoxProps) {
  const hasLog = Boolean(log);

  return (
    <button
      type="button"
      className={`day-box ${hasLog ? 'day-box--filled' : ''} ${isToday ? 'day-box--today' : ''}`}
      onClick={() => onDayClick(day)}
      aria-label={
        hasLog
          ? `${day}: ${log!.wordOfDay}`
          : `Day ${day}${isToday ? ', today' : ''}`
      }
    >
      {hasLog && log!.imageUrl && (
        <img
          src={log!.imageUrl}
          alt=""
          className="day-box__image"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="day-box__overlay">
        <span className="day-box__number">{day}</span>
        {hasLog && (
          <div className="day-box__caption">
            <span className="day-box__word">{log!.wordOfDay}</span>
          </div>
        )}
      </div>
    </button>
  );
});
