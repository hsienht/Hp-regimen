-- Run once in the TEST project after 006. Existing duplicate names cause a safe rollback.
begin;
do $$ begin
 if exists(select 1 from public.system_regimens group by btrim(name,E' \t\n\r'||chr(12288)) having count(*)>1)
 or exists(select 1 from public.user_regimens group by user_id,btrim(name,E' \t\n\r'||chr(12288)) having count(*)>1) then
  raise exception 'Existing duplicate names: run 008_preflight.sql and rename duplicates before migration';
 end if;
end $$;
create unique index system_regimens_unique_name on public.system_regimens(btrim(name,E' \t\n\r'||chr(12288)));
create unique index user_regimens_unique_name on public.user_regimens(user_id,btrim(name,E' \t\n\r'||chr(12288)));
create function private.normalize_regimen_name() returns trigger language plpgsql set search_path='' as $$
begin
 new.name:=btrim(new.name,E' \t\n\r'||chr(12288));
 if length(new.name) not between 1 and 200 then raise exception 'Invalid regimen name';end if;
 return new;
end $$;
create trigger normalize_regimen_name before insert or update on public.system_regimens for each row execute function private.normalize_regimen_name();
create trigger normalize_regimen_name before insert or update on public.user_regimens for each row execute function private.normalize_regimen_name();
create table public.user_favorites (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 system_id text references public.system_regimens(id) on delete cascade,
 personal_id uuid references public.user_regimens(id) on delete cascade,
 created_at timestamptz not null default now(),
 check ((system_id is not null)::integer+(personal_id is not null)::integer=1),
 unique(user_id,system_id),unique(user_id,personal_id)
);
alter table public.user_favorites enable row level security;
revoke all on public.user_favorites from public,anon,authenticated;
grant select,insert,delete on public.user_favorites to authenticated;
create policy favorites_read on public.user_favorites for select to authenticated using(user_id=auth.uid());
create policy favorites_delete on public.user_favorites for delete to authenticated using(user_id=auth.uid());
create policy favorites_insert on public.user_favorites for insert to authenticated with check(
 user_id=auth.uid() and (system_id is not null or exists(select 1 from public.user_regimens r where r.id=personal_id and r.user_id=auth.uid()))
);
create function public.hp_merge_favorites(items jsonb) returns integer language plpgsql security invoker set search_path='' as $$
declare item jsonb; added integer:=0; n integer;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>200 then raise exception 'Invalid favorites';end if;
 for item in select value from jsonb_array_elements(items) loop
  if item->>'scope'='system' then
   insert into public.user_favorites(user_id,system_id) values(auth.uid(),item->>'id') on conflict do nothing;
  elsif item->>'scope'='user' then
   insert into public.user_favorites(user_id,personal_id) values(auth.uid(),(item->>'id')::uuid) on conflict do nothing;
  else raise exception 'Invalid favorite scope';end if;
  get diagnostics n=row_count;added:=added+n;
 end loop;
 return added;
end $$;
revoke all on function public.hp_merge_favorites(jsonb) from public,anon;
grant execute on function public.hp_merge_favorites(jsonb) to authenticated;
create or replace function public.hp_import_personal(templates jsonb, replace_existing boolean, expected_versions jsonb) returns integer
 language plpgsql security invoker set search_path='' as $$
declare item jsonb; inserted integer:=0; actual_versions jsonb;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 if jsonb_typeof(templates)<>'array' or jsonb_array_length(templates)>100 then raise exception 'Invalid templates';end if;
 -- Serialize imports per account (also handles the empty-library case).
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 perform 1 from public.user_regimens where user_id=auth.uid() order by id for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version) order by id),'[]'::jsonb)
 into actual_versions from public.user_regimens where user_id=auth.uid();
 if actual_versions is distinct from expected_versions then raise exception 'Personal library changed; reload before importing';end if;
 if replace_existing then delete from public.user_regimens where user_id=auth.uid();end if;
 for item in select value from jsonb_array_elements(templates) loop
  if jsonb_typeof(item)<>'object' or length(item->>'name') not between 1 and 200
    or jsonb_typeof(item->'phases')<>'array' then raise exception 'Invalid regimen';end if;
  if replace_existing or not exists(select 1 from public.user_regimens where user_id=auth.uid() and btrim(name,E' \t\n\r'||chr(12288))=btrim(item->>'name',E' \t\n\r'||chr(12288))) then
   insert into public.user_regimens(user_id,name,regimen_data,sort_order) values(auth.uid(),item->>'name',item,inserted);
   inserted:=inserted+1;
  end if;
 end loop;
 return inserted;
end $$;
commit;
