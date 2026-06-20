import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useDiaryEntries } from '../hooks/useLogs';
import { getSupabaseConfigError, isSupabaseConfigured } from '../lib/supabase';
import {
  getCurrentMonthYear,
  hasMonthYearParams,
  monthYearPath,
  monthYearSearchParams,
  parseMonthYear,
} from '../lib/monthYear';

function formatDiaryEntryDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'long' }),
    label: date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
    day: date.getDate(),
  };
}

export function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { year, month } = parseMonthYear(searchParams);

  useEffect(() => {
    if (hasMonthYearParams(searchParams)) return;
    const current = getCurrentMonthYear();
    setSearchParams(monthYearSearchParams(current.year, current.month), { replace: true });
  }, [searchParams, setSearchParams]);
  const { entries, loading, error } = useDiaryEntries(year, month);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const updateMonth = (nextYear: number, nextMonth: number) => {
    setSearchParams(monthYearSearchParams(nextYear, nextMonth));
  };

  const prevMonth = () => {
    if (month === 0) updateMonth(year - 1, 11);
    else updateMonth(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 11) updateMonth(year + 1, 0);
    else updateMonth(year, month + 1);
  };

  return (
    <div className="app app--diary">
      <Header backTo={monthYearPath('/', year, month)} />

      <main className="main main--diary">
        {!isSupabaseConfigured() && (
          <div className="banner banner--error" role="alert">
            {getSupabaseConfigError()}
          </div>
        )}
        {error && (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        )}

        <section className="diary">
          <header className="diary__masthead">
            <p className="diary__eyebrow">Diary</p>
            <div className="diary__nav">
              <button type="button" className="calendar__nav-btn" onClick={prevMonth} aria-label="Previous month">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="diary__title">{monthLabel}</h1>
              <button type="button" className="calendar__nav-btn" onClick={nextMonth} aria-label="Next month">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </header>

          {loading ? (
            <p className="diary__status">Loading…</p>
          ) : entries.length === 0 ? (
            <div className="diary__empty">
              <p className="diary__status">Nothing written yet this month.</p>
            </div>
          ) : (
            <ol className="diary__entries">
              {entries.map((entry) => {
                const { weekday, label, day } = formatDiaryEntryDate(entry.logDate);

                return (
                  <li key={entry.id} className="diary-entry">
                    <article className="diary-entry__card">
                      <header className="diary-entry__header">
                        <div className="diary-entry__date-badge" aria-hidden="true">
                          {day}
                        </div>
                        <div className="diary-entry__date">
                          <time className="diary-entry__label" dateTime={entry.logDate}>
                            {label}
                          </time>
                          <span className="diary-entry__weekday">{weekday}</span>
                        </div>
                        {entry.wordOfDay && (
                          <span className="diary-entry__tag">{entry.wordOfDay}</span>
                        )}
                      </header>
                      <div className="diary-entry__body">
                        <p>{entry.whatHappened}</p>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}

          <footer className="diary__footer">
            <Link to={monthYearPath('/', year, month)} className="diary__back">
              Back to calendar
            </Link>
          </footer>
        </section>
      </main>
    </div>
  );
}
