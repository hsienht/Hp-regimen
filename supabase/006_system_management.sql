begin;
-- All system writes take this lock before row locks, including direct REST writes.
create function private.lock_system_library() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('hp:system-regimens',0));return null;
end $$;
create trigger lock_system_library before insert or update or delete on public.system_regimens for each statement execute function private.lock_system_library();
create function private.keep_system_regimen() returns trigger language plpgsql set search_path='' as $$
begin
 if (select count(*) from public.system_regimens)<=1 then raise exception 'At least one system regimen must remain';end if;
 return old;
end $$;
create trigger keep_system_regimen before delete on public.system_regimens for each row execute function private.keep_system_regimen();
create function public.hp_reorder_system_regimens(ordered_ids jsonb,expected_versions jsonb) returns void
 language plpgsql security invoker set search_path='' as $$
declare actual_versions jsonb; item record;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if jsonb_typeof(ordered_ids) is distinct from 'array' or jsonb_array_length(ordered_ids)>200 then raise exception 'Invalid order';end if;
 perform pg_advisory_xact_lock(hashtextextended('hp:system-regimens',0));
 perform 1 from public.system_regimens order by id collate "C" for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version) order by id collate "C"),'[]'::jsonb)
 into actual_versions from public.system_regimens;
 if actual_versions is distinct from expected_versions then raise exception 'System library changed; reload before reordering';end if;
 if jsonb_array_length(ordered_ids)<>(select count(*) from public.system_regimens)
   or jsonb_array_length(ordered_ids)<>(select count(distinct value) from jsonb_array_elements_text(ordered_ids))
   or exists(select id from public.system_regimens except select value from jsonb_array_elements_text(ordered_ids)) then raise exception 'Order must include every system regimen once';end if;
 for item in select value,ordinality from jsonb_array_elements_text(ordered_ids) with ordinality loop
  update public.system_regimens set sort_order=item.ordinality-1 where id=item.value;
 end loop;
end $$;
create function public.hp_delete_system_regimen(regimen_id text,expected_version integer) returns void
 language plpgsql security invoker set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('hp:system-regimens',0));
 delete from public.system_regimens where id=regimen_id and version=expected_version;
 if not found then raise exception 'Regimen version conflict';end if;
end $$;
revoke all on function public.hp_reorder_system_regimens(jsonb,jsonb),public.hp_delete_system_regimen(text,integer) from public,anon;
grant execute on function public.hp_reorder_system_regimens(jsonb,jsonb),public.hp_delete_system_regimen(text,integer) to authenticated;
commit;
