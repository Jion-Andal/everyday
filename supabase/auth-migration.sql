-- Run this if you already created daily_logs with device_id (existing deployments)

alter table public.daily_logs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Remove open policy from original schema
drop policy if exists "Allow all access to daily_logs" on public.daily_logs;

-- Drop device-based constraint if present
alter table public.daily_logs drop constraint if exists daily_logs_device_id_log_date_key;

-- Add user-based constraint (after backfill or for new rows only)
alter table public.daily_logs drop constraint if exists daily_logs_user_id_log_date_key;
alter table public.daily_logs
  add constraint daily_logs_user_id_log_date_key unique (user_id, log_date);

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date desc);

drop policy if exists "Users read own logs" on public.daily_logs;
drop policy if exists "Users insert own logs" on public.daily_logs;
drop policy if exists "Users update own logs" on public.daily_logs;
drop policy if exists "Users delete own logs" on public.daily_logs;

create policy "Users read own logs"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own logs"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "Users update own logs"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own logs"
  on public.daily_logs for delete
  using (auth.uid() = user_id);

-- Storage: replace open policies with user-scoped ones
drop policy if exists "Allow public read on log-images" on storage.objects;
drop policy if exists "Allow public upload on log-images" on storage.objects;
drop policy if exists "Allow public update on log-images" on storage.objects;
drop policy if exists "Allow public delete on log-images" on storage.objects;
drop policy if exists "Users read own log images" on storage.objects;
drop policy if exists "Users upload own log images" on storage.objects;
drop policy if exists "Users update own log images" on storage.objects;
drop policy if exists "Users delete own log images" on storage.objects;
drop policy if exists "Public read log images" on storage.objects;

create policy "Users read own log images"
  on storage.objects for select
  using (
    bucket_id = 'log-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users upload own log images"
  on storage.objects for insert
  with check (
    bucket_id = 'log-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own log images"
  on storage.objects for update
  using (
    bucket_id = 'log-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own log images"
  on storage.objects for delete
  using (
    bucket_id = 'log-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read log images"
  on storage.objects for select
  using (bucket_id = 'log-images');

-- Optional: drop legacy column after migrating data
-- alter table public.daily_logs drop column if exists device_id;
