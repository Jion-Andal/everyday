import { requireSupabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import type { DailyLog, LogFormData } from '../types/log';

interface DbLogRow {
  id: string;
  device_id: string;
  log_date: string;
  word_of_day: string;
  what_happened: string;
  rating: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DbLogRow): DailyLog {
  return {
    id: row.id,
    deviceId: row.device_id,
    logDate: row.log_date,
    wordOfDay: row.word_of_day,
    whatHappened: row.what_happened,
    rating: row.rating,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchLogsForMonth(year: number, month: number): Promise<DailyLog[]> {
  const client = requireSupabase();
  const deviceId = getDeviceId();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await client
    .from('daily_logs')
    .select('*')
    .eq('device_id', deviceId)
    .gte('log_date', start)
    .lte('log_date', end)
    .order('log_date', { ascending: true });

  if (error) throw error;
  return (data as DbLogRow[]).map(mapRow);
}

export async function uploadLogImage(file: File, logDate: string): Promise<string> {
  const client = requireSupabase();
  const deviceId = getDeviceId();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${deviceId}/${logDate}.${ext}`;

  const { error: uploadError } = await client.storage
    .from('log-images')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from('log-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveLog(logDate: Date, form: LogFormData, existingId?: string): Promise<DailyLog> {
  const client = requireSupabase();
  const deviceId = getDeviceId();
  const dateStr = toDateString(logDate);

  let imageUrl: string | null = form.imagePreview && !form.imageFile ? form.imagePreview : null;
  if (form.imageFile) {
    imageUrl = await uploadLogImage(form.imageFile, dateStr);
  }

  const payload = {
    device_id: deviceId,
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
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as DbLogRow);
  }

  const { data, error } = await client
    .from('daily_logs')
    .upsert(payload, { onConflict: 'device_id,log_date' })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbLogRow);
}

export async function deleteLog(log: DailyLog): Promise<void> {
  const client = requireSupabase();

  if (log.imageUrl) {
    const urlParts = log.imageUrl.split('/log-images/');
    if (urlParts[1]) {
      await client.storage.from('log-images').remove([decodeURIComponent(urlParts[1])]);
    }
  }

  const { error } = await client.from('daily_logs').delete().eq('id', log.id);
  if (error) throw error;
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
