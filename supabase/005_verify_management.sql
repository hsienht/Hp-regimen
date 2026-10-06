-- Run after 004. Changes and fixtures are rolled back.
begin;
insert into auth.users(id,email) values('33333333-3333-4333-8333-333333333333','hp-admin-test@example.invalid');
update public.profiles set role='admin' where id='33333333-3333-4333-8333-333333333333';
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
set local role authenticated;
do $$
declare before_version integer; data jsonb; failed boolean:=false; expected jsonb;
begin
 select version,drug_data into before_version,data from public.system_drugs where id='tetracycline';
 begin
  perform public.hp_save_drugs(jsonb_build_array(
   jsonb_build_object('id','tetracycline','drug_data',data||'{"name":"Temporary"}'::jsonb,'sort_order',6,'version',before_version),
   jsonb_build_object('id','ppi','drug_data',(select drug_data from public.system_drugs where id='ppi'),'sort_order',0,'version',-1)));
 exception when others then failed:=true;end;
 if not failed then raise exception 'Stale drug version accepted';end if;
 if (select version from public.system_drugs where id='tetracycline')<>before_version then raise exception 'Partial save was not rolled back';end if;
 failed:=false;
 begin
  update public.system_drugs set drug_data=jsonb_set(drug_data,'{subtypes}','["Changed"]'::jsonb) where id='tetracycline';
 exception when others then failed:=true;end;
 if not failed then raise exception 'Existing strength changed';end if;
 perform public.hp_import_personal('[{"name":"Test backup","duration":14,"isPhased":false,"notes":"","phases":[{"drugs":[]}]}]',false,'[]');
 if (select count(*) from public.user_regimens)<>1 then raise exception 'Import failed';end if;
 failed:=false;
 begin
  perform public.hp_import_personal('[]',true,'[]');
 exception when others then failed:=true;end;
 if not failed then raise exception 'Stale import snapshot accepted';end if;
 select jsonb_agg(jsonb_build_object('id',id,'version',version) order by id) into expected from public.user_regimens;
 perform public.hp_import_personal('[]',true,expected);
 if exists(select 1 from public.user_regimens) then raise exception 'Replace failed';end if;
end $$;
reset role;
rollback;
