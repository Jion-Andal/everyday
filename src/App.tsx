import { useState } from 'react';
import { Calendar } from './components/Calendar';
import { Header } from './components/Header';
import { LogDetailModal } from './components/LogDetailModal';
import { LogModal } from './components/LogModal';
import { MonthStatsModal } from './components/MonthStatsModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLogs } from './hooks/useLogs';
import { deleteLog, saveLog } from './services/logs';
import type { DailyLog, LogFormData } from './types/log';
import './App.css';

function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { logsByDate, loading, error, refresh } = useLogs(year, month);

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(now);
  const [editingLog, setEditingLog] = useState<DailyLog | undefined>();

  const [detailLog, setDetailLog] = useState<DailyLog | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const openLogForToday = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const existing = logsByDate.get(dateStr);
    setLogDate(today);
    setEditingLog(existing);
    setLogModalOpen(true);
  };

  const handleDayClick = (date: Date, log?: DailyLog) => {
    if (log) {
      setDetailLog(log);
    } else {
      setLogDate(date);
      setEditingLog(undefined);
      setLogModalOpen(true);
    }
  };

  const handleSave = async (form: LogFormData) => {
    await saveLog(logDate, form, editingLog?.id);
    await refresh();
  };

  const handleDelete = async (log: DailyLog) => {
    await deleteLog(log);
    setDetailLog(null);
    await refresh();
  };

  const handleEdit = (log: DailyLog) => {
    setDetailLog(null);
    const [y, m, d] = log.logDate.split('-').map(Number);
    setLogDate(new Date(y, m - 1, d));
    setEditingLog(log);
    setLogModalOpen(true);
  };

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
    <div className="app">
      <Header />

      <main className="main">
        {error && (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="loading-text">Loading…</p>
        ) : (
          <Calendar
            year={year}
            month={month}
            logsByDate={logsByDate}
            onDayClick={handleDayClick}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
      </main>

      <footer className="fab-bar">
        <button
          type="button"
          className="fab fab--left"
          onClick={() => setStatsOpen(true)}
        >
          Was it a good month?
        </button>
        <button
          type="button"
          className="fab fab--right"
          onClick={openLogForToday}
        >
          Log your day
        </button>
      </footer>

      <LogModal
        open={logModalOpen}
        date={logDate}
        existingLog={editingLog}
        onClose={() => setLogModalOpen(false)}
        onSave={handleSave}
      />

      <LogDetailModal
        log={detailLog}
        onClose={() => setDetailLog(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <MonthStatsModal
        open={statsOpen}
        initialYear={year}
        initialMonth={month}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
