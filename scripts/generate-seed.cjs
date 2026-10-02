const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('js/defaults.js','utf8'),ctx);
const quote=s=>"'"+s.replaceAll("'","''")+"'";
let sql='-- Generated from js/defaults.js. Existing cloud edits are never overwritten.\nbegin;\n';
for (const [table,key,items] of [['system_drugs','drug_data',vm.runInContext('DEFAULT_DRUGS',ctx)],['system_regimens','regimen_data',vm.runInContext('DEFAULT_PRESETS',ctx)]]) {
 items.forEach((x,i)=>{sql+=`insert into public.${table}(id,${key},sort_order${table==='system_regimens'?',name':''}) values (${quote(x.id)},${quote(JSON.stringify(x))}::jsonb,${i}${table==='system_regimens'?','+quote(x.name):''}) on conflict (id) do nothing;\n`;});
}
sql+='commit;\n';fs.writeFileSync('supabase/002_seed.sql',sql);
