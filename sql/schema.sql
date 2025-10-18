-- schema.sql (run in Supabase SQL editor)
-- Create required extensions
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists profiles (
  id uuid primary key default auth.uid(),
  full_name text not null,
  email text not null,
  gender text,
  branch text, -- Army/Navy/Air Force/Others
  rank text,
  phone text,
  role text not null default 'sailor',
  approved boolean not null default false,
  secretary_id uuid references profiles(id),
  avatar_url text,
  created_at timestamptz default now()
);

-- Handle new user registration by creating a profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'https://api.dicebear.com/8.x/pixel-art/svg?seed=' || new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Abbreviations
create table if not exists abbreviations (
  id uuid primary key default gen_random_uuid(),
  abbr text not null unique,
  expansion text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- System logs
create table if not exists system_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- Conversations & membership
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  member_id uuid references profiles(id),
  joined_at timestamptz default now(),
  unique(conversation_id, member_id)
);

-- Messages (simple schema)
create sequence if not exists messages_id_seq;
create table if not exists messages (
  id bigint primary key default nextval('messages_id_seq'),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Read receipts
create table if not exists message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id bigint references messages(id) on delete cascade,
  reader_id uuid references profiles(id),
  read_at timestamptz default now(),
  unique(message_id, reader_id)
);

-- Admin Authority Directory
create table if not exists authority_contacts (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    designation text,
    rank text,
    branch text,
    primary_phone text,
    alternate_phone text,
    email text not null,
    avatar_url text,
    linked_profile_id uuid references profiles(id) on delete set null,
    
    secretary_name text,
    secretary_phone text,
    secretary_avatar_url text,
    secretary_linked_profile_id uuid references profiles(id) on delete set null,
    
    status text not null default 'pending', -- 'pending' or 'approved'
    created_by uuid not null references profiles(id),
    updated_by uuid references profiles(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Row Level Security: enable on all tables
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table abbreviations enable row level security;
alter table system_logs enable row level security;
alter table message_reads enable row level security;
alter table authority_contacts enable row level security;

-- Helper Functions for RLS
create or replace function is_user_approved() returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.approved = true);
$$;

create or replace function is_super_admin() returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin');
$$;

create or replace function is_member(conv_id uuid) returns boolean language sql stable as $$
  select exists(select 1 from conversation_members cm where cm.conversation_id = conv_id and cm.member_id = auth.uid());
$$;

-- Policies for PROFILES
create policy "profiles_select_approved_users" on profiles for select using ( is_user_approved() );
create policy "profiles_update_self" on profiles for update using ( auth.uid() = id );
create policy "profiles_admin_manage" on profiles for all using ( is_super_admin() );

-- Policies for CONVERSATIONS and MESSAGES
create policy "conv_manage_if_member" on conversations for all using ( is_member(id) );
create policy "conv_insert_if_approved" on conversations for insert with check ( is_user_approved() );
create policy "messages_select_if_member" on messages for select using ( is_member(conversation_id) );
create policy "messages_insert_if_member" on messages for insert with check ( is_member(conversation_id) and sender_id = auth.uid() );
create policy "message_reads_manage_if_member" on message_reads for all using (
    exists(select 1 from messages m where m.id = message_id and is_member(m.conversation_id))
);

-- Policies for ABBREVIATIONS and SYSTEM_LOGS (Admin only)
create policy "abbr_select_approved" on abbreviations for select using ( is_user_approved() );
create policy "abbr_manage_super" on abbreviations for insert, update, delete using ( is_super_admin() );
create policy "logs_manage_super" on system_logs for all using ( is_super_admin() );

-- Policies for AUTHORITY_CONTACTS
create policy "contacts_select_approved_users" on authority_contacts for select using ( status = 'approved' and is_user_approved() );
create policy "contacts_select_pending_for_admin" on authority_contacts for select using ( status = 'pending' and is_super_admin() );
create policy "contacts_insert_self" on authority_contacts for insert with check ( created_by = auth.uid() and is_user_approved() );
create policy "contacts_manage_super_admin" on authority_contacts for all using ( is_super_admin() );
