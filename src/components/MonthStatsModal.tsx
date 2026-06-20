import { useEffect, useMemo, useState } from 'react';
import { fetchLogsForMonth } from '../services/logs';
import type { DailyLog } from '../types/log';

interface MonthStatsModalProps {
  open: boolean;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 180;
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 };

function ratingToY(rating: number): number {
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  return PADDING.top + plotHeight - ((rating - 1) / 4) * plotHeight;
}

function dayToX(day: number, daysInMonth: number): number {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  if (daysInMonth <= 1) return PADDING.left + plotWidth / 2;
  return PADDING.left + ((day - 1) / (daysInMonth - 1)) * plotWidth;
}

function buildLineSegments(ratings: (number | null)[], daysInMonth: number): string[] {
  const segments: string[] = [];
  let current = '';

  ratings.forEach((rating, index) => {
    const day = index + 1;
    if (rating === null) {
      if (current) {
        segments.push(current);
        current = '';
      }
      return;
    }

    const x = dayToX(day, daysInMonth).toFixed(1);
    const y = ratingToY(rating).toFixed(1);
    current += current ? ` L ${x} ${y}` : `M ${x} ${y}`;
  });

  if (current) segments.push(current);
  return segments;
}

function RatingsLineChart({
  ratingsByDay,
  daysInMonth,
  monthLabel,
}: {
  ratingsByDay: (number | null)[];
  daysInMonth: number;
  monthLabel: string;
}) {
  const lineSegments = useMemo(
    () => buildLineSegments(ratingsByDay, daysInMonth),
    [ratingsByDay, daysInMonth],
  );

  const points = useMemo(
    () =>
      ratingsByDay.flatMap((rating, index) =>
        rating === null
          ? []
          : [{ day: index + 1, rating, x: dayToX(index + 1, daysInMonth), y: ratingToY(rating) }],
      ),
    [ratingsByDay, daysInMonth],
  );

  const xLabels = useMemo(() => {
    const labels: number[] = [1];
    for (let day = 5; day <= daysInMonth; day += 5) labels.push(day);
    if (labels[labels.length - 1] !== daysInMonth) labels.push(daysInMonth);
    return [...new Set(labels)];
  }, [daysInMonth]);

  return (
    <div className="line-chart" role="img" aria-label={`Line chart of daily ratings for ${monthLabel}`}>
      <svg
        className="line-chart__svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {[1, 2, 3, 4, 5].map((level) => {
          const y = ratingToY(level);
          return (
            <g key={level}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                className="line-chart__grid"
              />
              <text x={PADDING.left - 8} y={y + 4} className="line-chart__axis-label" textAnchor="end">
                {level}
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING.left}
          y1={CHART_HEIGHT - PADDING.bottom}
          x2={CHART_WIDTH - PADDING.right}
          y2={CHART_HEIGHT - PADDING.bottom}
          className="line-chart__axis"
        />

        {lineSegments.map((segment, index) => (
          <path key={index} d={segment} className="line-chart__line" />
        ))}

        {points.map((point) => (
          <circle
            key={point.day}
            cx={point.x}
            cy={point.y}
            r={3.5}
            className="line-chart__point"
          >
            <title>{`Day ${point.day}: ${point.rating}/5`}</title>
          </circle>
        ))}

        {xLabels.map((day) => (
          <text
            key={day}
            x={dayToX(day, daysInMonth)}
            y={CHART_HEIGHT - 8}
            className="line-chart__axis-label line-chart__axis-label--x"
            textAnchor="middle"
          >
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
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
        <header className="modal__header modal__header--stats">
          <h2 id="stats-modal-title" className="modal__title">
            Was it a good month?
          </h2>
          <div className="stats-nav">
            <button type="button" className="calendar__nav-btn" onClick={prevMonth} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="stats-month">{monthLabel}</span>
            <button type="button" className="calendar__nav-btn" onClick={nextMonth} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
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
              <RatingsLineChart
                ratingsByDay={ratingsByDay}
                daysInMonth={daysInMonth}
                monthLabel={monthLabel}
              />
              <p className="stats-legend">
                Each point is a day&apos;s rating (1–5). Gaps mean no entry that day.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
