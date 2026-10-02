begin;
-- All personal writes acquire the same per-account lock as import RPCs.
create function private.lock_personal_library() returns trigger language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null then perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));end if;
 return null;
end $$;
create trigger lock_personal_library before insert or update or delete on public.user_regimens for each statement execute function private.lock_personal_library();
create function private.protect_personal_owner() returns trigger language plpgsql set search_path='' as $$
begin
 if new.user_id<>old.user_id then raise exception 'Owner cannot change';end if;return new;
end $$;
create trigger protect_personal_owner before update on public.user_regimens for each row execute function private.protect_personal_owner();
-- Existing strength order is immutable: historical presets may still use indexes.
create function private.protect_drug_strengths() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then raise exception 'Existing drugs cannot be deleted';end if;
 if new.id<>old.id then raise exception 'Drug ID cannot change';end if;
 if jsonb_array_length(new.drug_data->'subtypes')<jsonb_array_length(old.drug_data->'subtypes') then raise exception 'Existing strengths cannot be removed';end if;
 for i in 0..jsonb_array_length(old.drug_data->'subtypes')-1 loop
  if (new.drug_data->'subtypes'->i) is distinct from (old.drug_data->'subtypes'->i) then raise exception 'Existing strengths cannot be renamed or reordered';end if;
 end loop;
 return new;
end $$;
create trigger protect_drug_strengths before update or delete on public.system_drugs for each row execute function private.protect_drug_strengths();
create function public.hp_save_drugs(changes jsonb) returns void
 language plpgsql security invoker set search_path='' as $$
declare item jsonb; current_version integer;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if jsonb_typeof(changes)<>'array' or jsonb_array_length(changes)>200 then raise exception 'Invalid drug changes';end if;
 -- A single RPC transaction prevents partial saves on version conflicts.
 perform 1 from public.system_drugs order by id for update;
 for item in select value from jsonb_array_elements(changes) loop
  if (item->>'id') !~ '^[a-zA-Z0-9_-]+$' or jsonb_typeof(item->'drug_data')<>'object'
    or jsonb_typeof(item->'drug_data'->'subtypes')<>'array'
    or jsonb_array_length(item->'drug_data'->'subtypes')<1 then raise exception 'Invalid drug data';end if;
  select version into current_version from public.system_drugs where id=item->>'id';
  if found then
   if current_version is distinct from (item->>'version')::integer then raise exception 'Drug version conflict';end if;
   update public.system_drugs set drug_data=item->'drug_data',sort_order=(item->>'sort_order')::integer where id=item->>'id';
  else
   if item->>'version' is not null then raise exception 'Missing drug / version conflict';end if;
   insert into public.system_drugs(id,drug_data,sort_order,updated_by) values(item->>'id',item->'drug_data',(item->>'sort_order')::integer,auth.uid());
  end if;
 end loop;
end $$;
create function public.hp_import_personal(templates jsonb, replace_existing boolean, expected_versions jsonb) returns integer
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
  if replace_existing or not exists(select 1 from public.user_regimens where user_id=auth.uid() and name=item->>'name') then
   insert into public.user_regimens(user_id,name,regimen_data,sort_order) values(auth.uid(),item->>'name',item,inserted);
   inserted:=inserted+1;
  end if;
 end loop;
 return inserted;
end $$;
revoke all on function public.hp_save_drugs(jsonb),public.hp_import_personal(jsonb,boolean,jsonb) from public,anon;
grant execute on function public.hp_save_drugs(jsonb),public.hp_import_personal(jsonb,boolean,jsonb) to authenticated;
commit;
