import { requireSupabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';
import type { CalendarLog, DailyLog, DiaryEntry, ExportLog, LogFormData } from '../types/log';

interface DbLogRow {
  id: string;
  user_id: string;
  log_date: string;
  word_of_day: string;
  what_happened: string;
  rating: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DbCalendarRow {
  id: string;
  log_date: string;
  word_of_day: string;
  image_url: string | null;
}

interface DbDiaryRow {
  id: string;
  log_date: string;
  word_of_day: string;
  what_happened: string;
}

interface DbExportRow {
  log_date: string;
  word_of_day: string;
  image_url: string | null;
}

interface DbRatingRow {
  rating: number;
}

function mapRow(row: DbLogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    wordOfDay: row.word_of_day,
    whatHappened: row.what_happened,
    rating: row.rating,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCalendarRow(row: DbCalendarRow): CalendarLog {
  return {
    id: row.id,
    logDate: row.log_date,
    wordOfDay: row.word_of_day,
    imageUrl: row.image_url,
  };
}

function mapDiaryRow(row: DbDiaryRow): DiaryEntry {
  return {
    id: row.id,
    logDate: row.log_date,
    wordOfDay: row.word_of_day,
    whatHappened: row.what_happened,
  };
}

function mapExportRow(row: DbExportRow): ExportLog {
  return {
    logDate: row.log_date,
    wordOfDay: row.word_of_day,
    imageUrl: row.image_url,
  };
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthDateRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

async function requireUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(getErrorMessage(error));
  if (!data.user) throw new Error('You must be signed in to continue.');
  return data.user.id;
}

function throwDbError(error: { message: string } | null): void {
  if (error) throw new Error(getErrorMessage(error));
}

export async function fetchCalendarLogsForMonth(
  year: number,
  month: number,
): Promise<CalendarLog[]> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const { start, end } = monthDateRange(year, month);

  const { data, error } = await client
    .from('daily_logs')
    .select('id, log_date, word_of_day, image_url')
    .eq('user_id', userId)
    .gte('log_date', start)
    .lte('log_date', end)
    .order('log_date', { ascending: true });

  if (error) throwDbError(error);
  return (data as DbCalendarRow[]).map(mapCalendarRow);
}

export async function fetchDiaryEntriesForMonth(
  year: number,
  month: number,
): Promise<DiaryEntry[]> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const { start, end } = monthDateRange(year, month);

  const { data, error } = await client
    .from('daily_logs')
    .select('id, log_date, word_of_day, what_happened')
    .eq('user_id', userId)
    .gte('log_date', start)
    .lte('log_date', end)
    .neq('what_happened', '')
    .order('log_date', { ascending: true });

  if (error) throwDbError(error);

  return (data as DbDiaryRow[])
    .map(mapDiaryRow)
    .filter((entry) => entry.whatHappened.trim());
}

export async function fetchRatingsForMonth(year: number, month: number): Promise<number[]> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const { start, end } = monthDateRange(year, month);

  const { data, error } = await client
    .from('daily_logs')
    .select('rating')
    .eq('user_id', userId)
    .gte('log_date', start)
    .lte('log_date', end);

  if (error) throwDbError(error);
  return (data as DbRatingRow[]).map((row) => row.rating);
}

export async function fetchExportLogsForMonth(
  year: number,
  month: number,
): Promise<ExportLog[]> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const { start, end } = monthDateRange(year, month);

  const { data, error } = await client
    .from('daily_logs')
    .select('log_date, word_of_day, image_url')
    .eq('user_id', userId)
    .gte('log_date', start)
    .lte('log_date', end)
    .order('log_date', { ascending: true });

  if (error) throwDbError(error);
  return (data as DbExportRow[]).map(mapExportRow);
}

export async function fetchLogByDate(logDate: string): Promise<DailyLog | null> {
  const client = requireSupabase();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (error) throwDbError(error);
  return data ? mapRow(data as DbLogRow) : null;
}

export async function uploadLogImage(file: File, logDate: string): Promise<string> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${logDate}.${ext}`;

  const { error: uploadError } = await client.storage
    .from('log-images')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(getErrorMessage(uploadError));

  const { data } = client.storage.from('log-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveLog(logDate: Date, form: LogFormData, existingId?: string): Promise<DailyLog> {
  const client = requireSupabase();
  const userId = await requireUserId();
  const dateStr = toDateString(logDate);

  let imageUrl: string | null = form.imagePreview && !form.imageFile ? form.imagePreview : null;
  if (form.imageFile) {
    imageUrl = await uploadLogImage(form.imageFile, dateStr);
  }

  const payload = {
    user_id: userId,
    log_date: dateStr,
    word_of_day: form.wordOfDay.trim(),
    what_happened: form.whatHappened.trim(),
    rating: form.rating,
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { data, error } = await client
      .from('daily_logs')
      .update(payload)
      .eq('id', existingId)
      .eq('user_id', userId)
      .select()
      .single();
    throwDbError(error);
    return mapRow(data as DbLogRow);
  }

  const { data, error } = await client
    .from('daily_logs')
    .insert(payload)
    .select()
    .single();
  if (error?.code === '23505') {
    const { data: updated, error: updateError } = await client
      .from('daily_logs')
      .update(payload)
      .eq('user_id', userId)
      .eq('log_date', dateStr)
      .select()
      .single();
    throwDbError(updateError);
    return mapRow(updated as DbLogRow);
  }
  throwDbError(error);
  return mapRow(data as DbLogRow);
}

export async function deleteLog(log: Pick<DailyLog, 'id' | 'imageUrl'>): Promise<void> {
  const client = requireSupabase();
  const userId = await requireUserId();

  if (log.imageUrl) {
    const urlParts = log.imageUrl.split('/log-images/');
    if (urlParts[1]) {
      await client.storage.from('log-images').remove([decodeURIComponent(urlParts[1])]);
    }
  }

  const { error } = await client
    .from('daily_logs')
    .delete()
    .eq('id', log.id)
    .eq('user_id', userId);
  if (error) throwDbError(error);
}

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
