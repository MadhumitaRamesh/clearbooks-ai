create table profiles (
  id uuid primary key references auth.users(id),
  owner_name text,
  shop_name text,
  created_at timestamptz default now()
);

create table records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  source_type text check (source_type in ('image','audio')),
  file_url text,
  status text check (status in ('pending','processing','done','failed')) default 'pending',
  created_at timestamptz default now()
);

create table extracted_data (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id),
  raw_text text,
  structured_json jsonb,
  created_at timestamptz default now()
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id),
  summary text,
  insight_json jsonb,
  created_at timestamptz default now()
);
