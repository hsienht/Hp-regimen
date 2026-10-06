begin;
create schema if not exists private;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'user' check (role in ('user','admin')),
 created_at timestamptz not null default now()
);
create table public.system_regimens (
 id text primary key, name text not null,
 regimen_data jsonb not null check (jsonb_typeof(regimen_data) = 'object'),
 sort_order integer not null default 0, version integer not null default 1,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table public.system_drugs (
 id text primary key,
 drug_data jsonb not null check (jsonb_typeof(drug_data) = 'object'),
 sort_order integer not null default 0, version integer not null default 1,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table public.user_regimens (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, regimen_data jsonb not null check (jsonb_typeof(regimen_data) = 'object'),
 sort_order integer not null default 0, version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.user_regimens(user_id);
create function private.is_admin() returns boolean
 language sql stable security definer set search_path = ''
 as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
create function private.create_profile() returns trigger
 language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id) values(new.id); return new;
end $$;
revoke all on function private.create_profile() from public;
create trigger hp_create_profile after insert on auth.users for each row execute function private.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create function private.bump_version() returns trigger
 language plpgsql set search_path = '' as $$
begin
 new.version := old.version + 1; new.updated_at := now();
 if TG_TABLE_NAME in ('system_regimens','system_drugs') then new.updated_by := auth.uid(); end if;
 return new;
end $$;
create trigger regimen_version before update on public.system_regimens for each row execute function private.bump_version();
create trigger drug_version before update on public.system_drugs for each row execute function private.bump_version();
create trigger user_version before update on public.user_regimens for each row execute function private.bump_version();
alter table public.profiles enable row level security;
alter table public.system_regimens enable row level security;
alter table public.system_drugs enable row level security;
alter table public.user_regimens enable row level security;
-- Role changes are only possible through the trusted Dashboard/SQL editor.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
revoke all on public.system_regimens, public.system_drugs, public.user_regimens from anon, authenticated;
grant select on public.system_regimens, public.system_drugs to anon, authenticated;
grant insert, update, delete on public.system_regimens, public.system_drugs to authenticated;
grant select, insert, update, delete on public.user_regimens to authenticated;
create policy read_system_regimens on public.system_regimens for select to anon, authenticated using (true);
create policy read_system_drugs on public.system_drugs for select to anon, authenticated using (true);
create policy admin_regimens on public.system_regimens for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy admin_drugs on public.system_drugs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy own_regimens on public.user_regimens for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
commit;
