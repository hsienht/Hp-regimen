-- Run in SQL Editor after 001/002. Test fixtures and changes are rolled back.
begin;
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','hp-rls-a@example.invalid'),
 ('22222222-2222-4222-8222-222222222222','hp-rls-b@example.invalid');
insert into public.user_regimens(user_id,name,regimen_data) values
 ('22222222-2222-4222-8222-222222222222','Private fixture','{}');
set local role anon;
do $$ begin
 if not exists(select 1 from public.system_regimens) then raise exception 'Guest cannot read seeded regimens';end if;
 begin
 insert into public.system_regimens(id,name,regimen_data) values('rls-unauthorized','No','{}');
 raise exception 'Guest unexpectedly wrote system data';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.user_regimens where user_id='22222222-2222-4222-8222-222222222222') then raise exception 'Cross-user read';end if;
 insert into public.user_regimens(user_id,name,regimen_data) values('11111111-1111-4111-8111-111111111111','Own fixture','{}');
 begin
 insert into public.user_regimens(user_id,name,regimen_data) values('22222222-2222-4222-8222-222222222222','No','{}');
 raise exception 'Cross-user insert';
 exception when insufficient_privilege then null;end;
 begin
 update public.profiles set role='admin' where id='11111111-1111-4111-8111-111111111111';
 raise exception 'Self escalation';
 exception when insufficient_privilege then null;end;
 begin
 insert into public.system_regimens(id,name,regimen_data) values('rls-user','No','{}');
 raise exception 'User wrote system data';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set role='admin' where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
insert into public.system_regimens(id,name,regimen_data) values('rls-admin','Admin fixture','{}');
update public.system_regimens set name='Updated fixture' where id='rls-admin';
do $$ begin
 if (select version from public.system_regimens where id='rls-admin')<>2 then raise exception 'Version did not increment';end if;
end $$;
reset role;
rollback;
