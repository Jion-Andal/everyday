-- Run this in the Supabase SQL Editor for the everyday app

-- Daily logs table
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  log_date date not null,
  word_of_day text not null default '',
  what_happened text not null default '',
  rating smallint not null check (rating >= 1 and rating <= 5),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, log_date)
);

create index if not exists daily_logs_device_date_idx
  on public.daily_logs (device_id, log_date desc);

alter table public.daily_logs enable row level security;

create policy "Allow all access to daily_logs"
  on public.daily_logs for all
  using (true)
  with check (true);

-- Storage bucket for log images
insert into storage.buckets (id, name, public)
values ('log-images', 'log-images', true)
on conflict (id) do nothing;

create policy "Allow public read on log-images"
  on storage.objects for select
  using (bucket_id = 'log-images');

create policy "Allow public upload on log-images"
  on storage.objects for insert
  with check (bucket_id = 'log-images');

create policy "Allow public update on log-images"
  on storage.objects for update
  using (bucket_id = 'log-images');

create policy "Allow public delete on log-images"
  on storage.objects for delete
  using (bucket_id = 'log-images');
