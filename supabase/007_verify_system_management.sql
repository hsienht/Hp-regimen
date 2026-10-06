-- Run after 006. Fixtures and changes are rolled back.
begin;
insert into auth.users(id,email) values('44444444-4444-4444-8444-444444444444','hp-system-test@example.invalid');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
set local role authenticated;
do $$ begin
 begin
  perform public.hp_delete_system_regimen('bqt',1);
  raise exception 'User deleted a system regimen';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set role='admin' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$
declare expected jsonb; new_order jsonb; failed boolean:=false; keep_id text;
begin
 select jsonb_agg(jsonb_build_object('id',id,'version',version) order by id collate "C") into expected from public.system_regimens;
 select jsonb_agg(id order by sort_order desc,id collate "C") into new_order from public.system_regimens;
 perform public.hp_reorder_system_regimens(new_order,expected);
 if (select id from public.system_regimens order by sort_order limit 1)<>(new_order->>0) then raise exception 'Sort not persisted';end if;
 begin
  perform public.hp_reorder_system_regimens(new_order,expected);
 exception when others then failed:=true;end;
 if not failed then raise exception 'Stale order accepted';end if;
 select id into keep_id from public.system_regimens order by sort_order limit 1;
 delete from public.system_regimens where id<>keep_id;
 failed:=false;
 begin
  perform public.hp_delete_system_regimen(keep_id,(select version from public.system_regimens where id=keep_id));
 exception when others then failed:=true;end;
 if not failed or (select count(*) from public.system_regimens)<>1 then raise exception 'Last regimen protection failed';end if;
end $$;
reset role;
rollback;
