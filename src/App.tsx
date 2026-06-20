import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useSearchParams } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen';
import { Calendar } from './components/Calendar';
import { Header } from './components/Header';
import { LogDetailModal } from './components/LogDetailModal';
import { LogModal } from './components/LogModal';
import { MonthStatsModal } from './components/MonthStatsModal';
import { SettingsSidebar } from './components/SettingsSidebar';
import { StoryExportCard } from './components/StoryExportCard';
import { WordCloudExportCard, type WordCloudExportHandle } from './components/WordCloudExportCard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogsProvider, useLogsStore } from './contexts/LogsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useCalendarLogs } from './hooks/useLogs';
import { usePageVisibility } from './hooks/usePageVisibility';
import { deleteLog, saveLog } from './services/logs';
import { downloadStoryScreenshot, downloadWordCloudScreenshot } from './services/exportStory';
import { hasWordOfDayWords } from './lib/wordCloudText';
import { getSupabaseConfigError, isSupabaseConfigured } from './lib/supabase';
import {
  getCurrentMonthYear,
  hasMonthYearParams,
  monthYearPath,
  monthYearSearchParams,
  parseMonthYear,
} from './lib/monthYear';
import type { DailyLog, ExportLog, LogFormData } from './types/log';
import { DiaryPage } from './pages/DiaryPage';
import './App.css';

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { year, month } = parseMonthYear(searchParams);
  const { theme } = useTheme();
  const storyExportRef = useRef<HTMLDivElement>(null);
  const wordCloudExportRef = useRef<WordCloudExportHandle>(null);
  const wordCloudHostRef = useRef<HTMLDivElement>(null);
  const [exportCardMounted, setExportCardMounted] = useState(false);
  const [wordCloudMounted, setWordCloudMounted] = useState(false);
  const [exportLogsByDate, setExportLogsByDate] = useState<Map<string, ExportLog>>(new Map());
  const [wordCloudLogs, setWordCloudLogs] = useState<ExportLog[]>([]);

  useEffect(() => {
    if (hasMonthYearParams(searchParams)) return;
    const current = getCurrentMonthYear();
    setSearchParams(monthYearSearchParams(current.year, current.month), { replace: true });
  }, [searchParams, setSearchParams]);

  const setMonthYear = useCallback(
    (nextYear: number, nextMonth: number) => {
      setSearchParams(monthYearSearchParams(nextYear, nextMonth), { replace: true });
    },
    [setSearchParams],
  );

  const { logsByDate, loading, error, refresh } = useCalendarLogs(year, month);
  const { loadLogByDate, loadExportLogs, invalidateLogDate } = useLogsStore();

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date());
  const [editingLog, setEditingLog] = useState<DailyLog | undefined>();

  const [detailLog, setDetailLog] = useState<DailyLog | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openLogForToday = async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const existing = logsByDate.get(dateStr);
    setLogDate(today);
    setEditingLog(existing ? await loadLogByDate(dateStr) ?? undefined : undefined);
    setLogModalOpen(true);
  };

  const handleDayClick = useCallback(
    async (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = logsByDate.get(dateStr);
      if (log) {
        const full = await loadLogByDate(dateStr);
        if (full) setDetailLog(full);
      } else {
        setLogDate(new Date(year, month, day));
        setEditingLog(undefined);
        setLogModalOpen(true);
      }
    },
    [year, month, logsByDate, loadLogByDate],
  );

  const handleSave = async (form: LogFormData) => {
    const saved = await saveLog(logDate, form, editingLog?.id);
    invalidateLogDate(saved.logDate);
    await refresh({ force: true });
  };

  const handleDelete = async (log: DailyLog) => {
    await deleteLog(log);
    setDetailLog(null);
    invalidateLogDate(log.logDate);
    await refresh({ force: true });
  };

  const handleEdit = (log: DailyLog) => {
    setDetailLog(null);
    const [y, m, d] = log.logDate.split('-').map(Number);
    setLogDate(new Date(y, m - 1, d));
    setEditingLog(log);
    setLogModalOpen(true);
  };

  const prevMonth = useCallback(() => {
    if (month === 0) setMonthYear(year - 1, 11);
    else setMonthYear(year, month - 1);
  }, [month, year, setMonthYear]);

  const nextMonth = useCallback(() => {
    if (month === 11) setMonthYear(year + 1, 0);
    else setMonthYear(year, month + 1);
  }, [month, year, setMonthYear]);

  const handleExportStory = async () => {
    const exportLogs = await loadExportLogs(year, month);
    setExportLogsByDate(new Map(exportLogs.map((log) => [log.logDate, log])));
    setExportCardMounted(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (!storyExportRef.current) {
      setExportCardMounted(false);
      setExportLogsByDate(new Map());
      throw new Error('Story export is not ready yet.');
    }

    try {
      await downloadStoryScreenshot(storyExportRef.current, year, month);
    } finally {
      setExportCardMounted(false);
      setExportLogsByDate(new Map());
    }
  };

  const handleExportWordCloud = async () => {
    const exportLogs = await loadExportLogs(year, month, true);
    if (!hasWordOfDayWords(exportLogs)) {
      throw new Error('Add at least one word of the day this month to create a word cloud.');
    }

    setWordCloudLogs(exportLogs);
    setWordCloudMounted(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (!wordCloudExportRef.current) {
      setWordCloudMounted(false);
      setWordCloudLogs([]);
      throw new Error('Word cloud export is not ready yet.');
    }

    try {
      await wordCloudExportRef.current.waitForRender();
      const exportNode = wordCloudHostRef.current?.firstElementChild;
      if (!exportNode || !(exportNode instanceof HTMLElement)) {
        throw new Error('Word cloud export is not ready yet.');
      }
      await downloadWordCloudScreenshot(exportNode, year, month);
    } finally {
      setWordCloudMounted(false);
      setWordCloudLogs([]);
    }
  };

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  return (
    <div className="app">
      <Header onOpenSettings={openSettings} />

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
        onExportWordCloud={handleExportWordCloud}
        onClose={() => setSettingsOpen(false)}
      />

      {exportCardMounted && (
        <div className="story-export-host" aria-hidden="true">
          <StoryExportCard
            ref={storyExportRef}
            year={year}
            month={month}
            logsByDate={exportLogsByDate}
            theme={theme}
          />
        </div>
      )}

      {wordCloudMounted && (
        <div ref={wordCloudHostRef} className="story-export-host story-export-host--wordcloud" aria-hidden="true">
          <WordCloudExportCard
            ref={wordCloudExportRef}
            year={year}
            month={month}
            logs={wordCloudLogs}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}

function AppGate() {
  const { session, loading } = useAuth();

  usePageVisibility();

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
        <LogsProvider>
          <AppGate />
        </LogsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
