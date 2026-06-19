export interface DailyLog {
  id: string;
  deviceId: string;
  logDate: string;
  wordOfDay: string;
  whatHappened: string;
  rating: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
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
