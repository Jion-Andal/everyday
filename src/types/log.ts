export interface DailyLog {
  id: string;
  userId: string;
  logDate: string;
  wordOfDay: string;
  whatHappened: string;
  rating: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Minimal fields for rendering the calendar grid. */
export interface CalendarLog {
  id: string;
  logDate: string;
  wordOfDay: string;
  imageUrl: string | null;
}

/** Fields needed for the diary page. */
export interface DiaryEntry {
  id: string;
  logDate: string;
  wordOfDay: string;
  whatHappened: string;
}

/** Fields needed for story export images. */
export interface ExportLog {
  logDate: string;
  wordOfDay: string;
  imageUrl: string | null;
}

export interface LogFormData {
  wordOfDay: string;
  whatHappened: string;
  rating: number;
  imageFile: File | null;
  imagePreview: string | null;
}

export const EMPTY_LOG_FORM: LogFormData = {
  wordOfDay: '',
  whatHappened: '',
  rating: 3,
  imageFile: null,
  imagePreview: null,
};
