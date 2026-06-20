import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen';
import { Calendar } from './components/Calendar';
import { Header } from './components/Header';
import { LogDetailModal } from './components/LogDetailModal';
import { LogModal } from './components/LogModal';
import { MonthStatsModal } from './components/MonthStatsModal';
import { SettingsSidebar } from './components/SettingsSidebar';
import { StoryExportCard } from './components/StoryExportCard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useLogs } from './hooks/useLogs';
import { deleteLog, saveLog } from './services/logs';
import { downloadStoryScreenshot } from './services/exportStory';
import { getSupabaseConfigError, isSupabaseConfigured } from './lib/supabase';
import {
  getCurrentMonthYear,
  hasMonthYearParams,
  monthYearPath,
  monthYearSearchParams,
  parseMonthYear,
} from './lib/monthYear';
import type { DailyLog, LogFormData } from './types/log';
import { DiaryPage } from './pages/DiaryPage';
import './App.css';

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { year, month } = parseMonthYear(searchParams);
  const { theme } = useTheme();
  const storyExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasMonthYearParams(searchParams)) return;
    const current = getCurrentMonthYear();
    setSearchParams(monthYearSearchParams(current.year, current.month), { replace: true });
  }, [searchParams, setSearchParams]);

  const setMonthYear = (nextYear: number, nextMonth: number) => {
    setSearchParams(monthYearSearchParams(nextYear, nextMonth), { replace: true });
  };

  const { logsByDate, loading, error, refresh } = useLogs(year, month);

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date());
  const [editingLog, setEditingLog] = useState<DailyLog | undefined>();

  const [detailLog, setDetailLog] = useState<DailyLog | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    if (month === 0) setMonthYear(year - 1, 11);
    else setMonthYear(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 11) setMonthYear(year + 1, 0);
    else setMonthYear(year, month + 1);
  };

  const handleExportStory = async () => {
    if (!storyExportRef.current) {
      throw new Error('Story export is not ready yet.');
    }
    await downloadStoryScreenshot(storyExportRef.current, year, month);
  };

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="main">
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
        <div className="calendar-actions">
          <Link
            to={monthYearPath('/diary', year, month)}
            className="btn btn--secondary calendar-diary-link"
          >
            Open Diary
          </Link>
        </div>
      </main>

      <footer className="fab-bar">
        <div className="fab-dock">
          <button
            type="button"
            className="fab fab--secondary"
            onClick={() => setStatsOpen(true)}
          >
            Was it a good month?
          </button>
          <button
            type="button"
            className="fab fab--primary"
            onClick={openLogForToday}
          >
            Log your day
          </button>
        </div>
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

      <SettingsSidebar
        open={settingsOpen}
        year={year}
        month={month}
        onExportStory={handleExportStory}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="story-export-host" aria-hidden="true">
        <StoryExportCard
          ref={storyExportRef}
          year={year}
          month={month}
          logsByDate={logsByDate}
          theme={theme}
        />
      </div>
    </div>
  );
}

function AppGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-screen">
        <p className="loading-text">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/diary" element={<DiaryPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
