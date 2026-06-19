import type { DailyLog } from '../types/log';

interface DayBoxProps {
  day: number;
  log?: DailyLog;
  isToday: boolean;
  onClick: () => void;
}

export function DayBox({ day, log, isToday, onClick }: DayBoxProps) {
  const hasLog = Boolean(log);

  return (
    <button
      type="button"
      className={`day-box ${hasLog ? 'day-box--filled' : ''} ${isToday ? 'day-box--today' : ''}`}
      onClick={onClick}
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
}
