import { forwardRef } from 'react';
import type { DailyLog } from '../types/log';

interface StoryExportCardProps {
  year: number;
  month: number;
  logsByDate: Map<string, DailyLog>;
  theme: 'light' | 'dark';
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const StoryExportCard = forwardRef<HTMLDivElement, StoryExportCardProps>(
  function StoryExportCard({ year, month, logsByDate, theme }, ref) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long' });

    return (
      <div ref={ref} className="story-export" data-theme={theme}>
        <div className="story-export__backdrop" aria-hidden="true">
          <div className="story-export__orb story-export__orb--warm" />
          <div className="story-export__orb story-export__orb--soft" />
          <div className="story-export__grain" />
        </div>

        <div className="story-export__inner">
          <header className="story-export__title-block">
            <p className="story-export__month">{monthName}</p>
            <p className="story-export__year">{year}</p>
            <div className="story-export__rule" aria-hidden="true">
              <span className="story-export__rule-line" />
              <span className="story-export__rule-dot" />
              <span className="story-export__rule-line" />
            </div>
          </header>

          <div className="story-export__panel">
            <div className="story-export__panel-shine" aria-hidden="true" />
            <div className="story-export__grid">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = toDateString(year, month, day);
                const log = logsByDate.get(dateStr);
                const hasLog = Boolean(log);
                const isToday = isCurrentMonth && today.getDate() === day;

                return (
                  <div
                    key={day}
                    className={`story-export__day ${hasLog ? 'story-export__day--filled' : ''} ${isToday ? 'story-export__day--today' : ''}`}
                  >
                    {hasLog && log!.imageUrl && (
                      <img
                        src={log!.imageUrl}
                        alt=""
                        className="story-export__day-image"
                        crossOrigin="anonymous"
                      />
                    )}
                    <div className="story-export__day-overlay">
                      <span className="story-export__day-number">{day}</span>
                      {hasLog && (
                        <div className="story-export__day-caption">
                          <span className="story-export__day-word">{log!.wordOfDay}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="story-export__footer">everyday</footer>
        </div>
      </div>
    );
  },
);
