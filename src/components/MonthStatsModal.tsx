import { useEffect, useState } from 'react';
import { fetchLogsForMonth } from '../services/logs';
import type { DailyLog } from '../types/log';

interface MonthStatsModalProps {
  open: boolean;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
}

export function MonthStatsModal({
  open,
  initialYear,
  initialMonth,
  onClose,
}: MonthStatsModalProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setYear(initialYear);
    setMonth(initialMonth);
  }, [open, initialYear, initialMonth]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLogsForMonth(year, month)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [open, year, month]);

  if (!open) return null;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ratingsByDay: (number | null)[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = logs.find((l) => l.logDate === dateStr);
    return log?.rating ?? null;
  });

  const loggedRatings = ratingsByDay.filter((r): r is number => r !== null);
  const average =
    loggedRatings.length > 0
      ? (loggedRatings.reduce((a, b) => a + b, 0) / loggedRatings.length).toFixed(1)
      : null;

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--stats"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
      >
        <header className="modal__header">
          <h2 id="stats-modal-title" className="modal__title">
            Was it a good month?
          </h2>
          <div className="stats-nav">
            <button type="button" className="calendar__nav-btn" onClick={prevMonth} aria-label="Previous month">
              ‹
            </button>
            <span className="stats-month">{monthLabel}</span>
            <button type="button" className="calendar__nav-btn" onClick={nextMonth} aria-label="Next month">
              ›
            </button>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal__body stats-body">
          {loading ? (
            <p className="stats-loading">Loading…</p>
          ) : loggedRatings.length === 0 ? (
            <p className="stats-empty">No entries yet for this month. Log a few days to see your graph.</p>
          ) : (
            <>
              {average && (
                <p className="stats-average">
                  Average day rating: <strong>{average}</strong> / 5
                </p>
              )}
              <div className="bar-chart" role="img" aria-label={`Bar chart of daily ratings for ${monthLabel}`}>
                {ratingsByDay.map((rating, i) => (
                  <div key={i} className="bar-chart__col">
                    <div className="bar-chart__bar-wrap">
                      {rating !== null ? (
                        <div
                          className="bar-chart__bar"
                          style={{ height: `${(rating / 5) * 100}%` }}
                          title={`Day ${i + 1}: ${rating}/5`}
                        />
                      ) : (
                        <div className="bar-chart__bar bar-chart__bar--empty" />
                      )}
                    </div>
                    {(i + 1) % 5 === 0 || i === 0 ? (
                      <span className="bar-chart__label">{i + 1}</span>
                    ) : (
                      <span className="bar-chart__label bar-chart__label--spacer" />
                    )}
                  </div>
                ))}
              </div>
              <p className="stats-legend">Each bar is a day&apos;s rating (1–5). Empty days have no entry.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
