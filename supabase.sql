-- Supabase schema for ESP32 DHT11 dashboard

create extension if not exists "pgcrypto";

-- Auth profile table for roles and user metadata
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Devices table with ownership and status
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  serial text unique,
  location text,
  status text not null default 'active',
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

-- Sensor readings table
create table if not exists readings (
  id bigserial primary key,
  device_id uuid references devices(id) on delete cascade,
  temperature numeric,
  humidity numeric,
  recorded_at timestamptz not null default now()
);

-- Enable row level security for all business tables
alter table profiles enable row level security;
alter table devices enable row level security;
alter table readings enable row level security;

-- Profiles policies
create policy "Profiles: user can select own profile" on profiles
  for select using (auth.uid() = id);
create policy "Profiles: admins can select all" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Profiles: user can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Profiles: admins can update all" on profiles
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Devices policies
create policy "Devices: owner can select" on devices
  for select using (
    owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Devices: owner can insert" on devices
  for insert with check (
    owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Devices: admin can update" on devices
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Devices: admin can delete" on devices
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Readings policies
create policy "Readings: device owner or admin can select" on readings
  for select using (
    exists (
      select 1 from devices d where d.id = readings.device_id and (
        d.owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  );
create policy "Readings: device owner or admin can insert" on readings
  for insert with check (
    exists (
      select 1 from devices d where d.id = readings.device_id and (
        d.owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      )
    )
  );
create policy "Readings: allow public insert for ESP32 devices" on readings
  for insert with check (auth.role() = 'anon');

-- Note: Public insert on readings is enabled so ESP32 devices can post via anon key.
-- For production, replace device uploads with a secure edge function or server-side proxy.
