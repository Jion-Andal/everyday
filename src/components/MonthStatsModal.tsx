import { useEffect, useMemo, useState } from 'react';
import { useRatings } from '../hooks/useLogs';

interface MonthStatsModalProps {
  open: boolean;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 16, bottom: 36, left: 36 };

const PASTEL_COLORS: Record<number, string> = {
  1: '#F4A6A6',
  2: '#F7C59F',
  3: '#F9E4A8',
  4: '#B8E0B8',
  5: '#A8C8EC',
};

const RATING_HINTS: Record<number, string> = {
  1: 'hate this day',
  2: 'rough day',
  3: 'meh day',
  4: 'nice day',
  5: 'great day',
};

function getYTicks(maxCount: number): number[] {
  if (maxCount <= 6) {
    return Array.from({ length: maxCount + 1 }, (_, i) => i);
  }
  const step = Math.ceil(maxCount / 4);
  const ticks: number[] = [0];
  for (let value = step; value < maxCount; value += step) ticks.push(value);
  ticks.push(maxCount);
  return [...new Set(ticks)];
}

function countToY(count: number, maxCount: number): number {
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  return PADDING.top + plotHeight - (count / maxCount) * plotHeight;
}

function RatingsBarChart({
  ratings,
  monthLabel,
}: {
  ratings: number[];
  monthLabel: string;
}) {
  const { bars, maxCount, yTicks } = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) counts[rating]++;

    const maxCount = Math.max(...Object.values(counts), 1);
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const barGap = 12;
    const barWidth = (plotWidth - barGap * 4) / 5;

    const bars = ([1, 2, 3, 4, 5] as const).map((rating, index) => {
      const count = counts[rating];
      const height = (count / maxCount) * plotHeight;
      const x = PADDING.left + index * (barWidth + barGap);
      const y = PADDING.top + plotHeight - height;

      return {
        rating,
        count,
        x,
        y,
        width: barWidth,
        height,
        color: PASTEL_COLORS[rating],
      };
    });

    return { bars, maxCount, yTicks: getYTicks(maxCount) };
  }, [ratings]);

  const baselineY = CHART_HEIGHT - PADDING.bottom;

  return (
    <div className="bar-chart" role="img" aria-label={`Bar chart of daily ratings for ${monthLabel}`}>
      <svg
        className="bar-chart__svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {yTicks.map((tick) => {
          const y = countToY(tick, maxCount);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                className="bar-chart__grid"
              />
              <text x={PADDING.left - 8} y={y + 4} className="bar-chart__axis-label" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING.left}
          y1={baselineY}
          x2={CHART_WIDTH - PADDING.right}
          y2={baselineY}
          className="bar-chart__axis"
        />

        {bars.map((bar) => (
          <g key={bar.rating}>
            {bar.height > 0 && (
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={4}
                ry={4}
                fill={bar.color}
                className="bar-chart__bar"
              >
                <title>{`${bar.rating}/5 — ${RATING_HINTS[bar.rating]}: ${bar.count} day${bar.count === 1 ? '' : 's'}`}</title>
              </rect>
            )}
            <text
              x={bar.x + bar.width / 2}
              y={baselineY + 18}
              className="bar-chart__axis-label bar-chart__axis-label--x"
              textAnchor="middle"
            >
              {bar.rating}
            </text>
            {bar.count > 0 && (
              <text
                x={bar.x + bar.width / 2}
                y={bar.y - 6}
                className="bar-chart__value"
                textAnchor="middle"
              >
                {bar.count}
              </text>
            )}
          </g>
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
  const { ratings, loading } = useRatings(year, month, open);

  useEffect(() => {
    if (!open) return;
    setYear(initialYear);
    setMonth(initialMonth);
  }, [open, initialYear, initialMonth]);

  if (!open) return null;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const average =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
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
          ) : ratings.length === 0 ? (
            <p className="stats-empty">No entries yet for this month. Log a few days to see your breakdown.</p>
          ) : (
            <>
              {average && (
                <p className="stats-average">
                  Average day rating: <strong>{average}</strong> / 5
                </p>
              )}
              <RatingsBarChart ratings={ratings} monthLabel={monthLabel} />
              <p className="stats-legend">
                Bar height is the number of logged days at each rating (1–5).
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
