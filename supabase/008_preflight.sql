-- Read only: identify duplicate names. No results means no duplicates.
select 'system' as scope,null::uuid as user_id,btrim(name,E' \t\n\r'||chr(12288)) as name,count(*) as count,array_agg(id::text) as ids
from public.system_regimens group by btrim(name,E' \t\n\r'||chr(12288)) having count(*)>1
union all
select 'personal',user_id,btrim(name,E' \t\n\r'||chr(12288)),count(*),array_agg(id::text)
from public.user_regimens group by user_id,btrim(name,E' \t\n\r'||chr(12288)) having count(*)>1;
