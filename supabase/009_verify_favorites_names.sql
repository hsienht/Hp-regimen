-- Run whole script after 008 in TEST project. All fixtures roll back.
begin;
insert into auth.users(id,email) values
('55555555-5555-4555-8555-555555555555','hp-favorite-a@example.invalid'),
('66666666-6666-4666-8666-666666666666','hp-favorite-b@example.invalid');
insert into public.user_regimens(id,user_id,name,regimen_data) values
('77777777-7777-4777-8777-777777777777','55555555-5555-4555-8555-555555555555','Favorite test','{}'),
('88888888-8888-4888-8888-888888888888','66666666-6666-4666-8666-666666666666','Favorite test','{}');
set local role anon;
do $$ begin
 begin
 perform 1 from public.user_favorites;
 raise exception 'Guest read favorites';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
set local role authenticated;
select public.hp_merge_favorites('[{"scope":"user","id":"77777777-7777-4777-8777-777777777777"}]');
select public.hp_merge_favorites('[{"scope":"user","id":"77777777-7777-4777-8777-777777777777"}]');
do $$ begin
 if (select count(*) from public.user_favorites)<>1 then raise exception 'Favorite duplicate';end if;
 begin
 perform public.hp_merge_favorites('[{"scope":"user","id":"88888888-8888-4888-8888-888888888888"}]');
 raise exception 'Cross-user favorite allowed';
 exception when insufficient_privilege then null;end;
 begin
 insert into public.user_regimens(user_id,name,regimen_data) values(auth.uid(),' Favorite test ','{}');
 raise exception 'Duplicate name allowed';
 exception when unique_violation then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.user_favorites) then raise exception 'Cross-user read';end if;
 delete from public.user_favorites;
end $$;
reset role;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
set local role authenticated;
delete from public.user_regimens where id='77777777-7777-4777-8777-777777777777';
do $$ begin
 if exists(select 1 from public.user_favorites) then raise exception 'Delete did not clear favorite';end if;
end $$;
reset role;
rollback;
