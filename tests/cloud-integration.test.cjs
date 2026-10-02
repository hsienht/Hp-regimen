const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
async function setup({offline=false,role='admin'}={}){
 const elements=new Map(),saved=new Map(),calls=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},classList:{add(){},remove(){}},addEventListener(){},innerHTML:'',textContent:'',close(){this.closed=true},showModal(){},elements:{email:{value:'admin@example.com'},password:{value:'secret'}},files:[]});return elements.get(id);};
 const ctx=vm.createContext({window:{HP_CLOUD_CONFIG:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test'}},document:{getElementById:element,querySelector:element},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},sessionStorage:{},TextEncoder,Date,structuredClone,alert(){},confirm:()=>true,prompt:()=> 'New template',crypto:{randomUUID:()=> '33333333-3333-4333-8333-333333333333'}});
 const run=s=>vm.runInContext(s,ctx);
 for(const file of ['defaults','storage','app'])run(fs.readFileSync(`js/${file}.js`,'utf8'));
 const db={system_drugs:JSON.parse(run('JSON.stringify(DEFAULT_DRUGS)')).map((d,i)=>({id:d.id,version:1,sort_order:i,drug_data:d})),system_regimens:JSON.parse(run('JSON.stringify(DEFAULT_PRESETS)')).map((p,i)=>({id:p.id,name:p.name,version:1,sort_order:i,regimen_data:p})),user_regimens:[]};
 let currentSession={user:{id:'11111111-1111-4111-8111-111111111111',email:'admin@example.com'}};
 const client={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:currentSession}}),signInWithPassword:async()=>({data:{session:currentSession}}),signOut:async()=>({data:null})},from(table){
  const filters=[];let op='read',payload;
  const q={select(){return q},order(){return q},eq(k,v){filters.push([k,v]);return q},single:async()=>({data:{role}}),insert(p){op='insert';payload=p;return q},update(p){op='update';payload=p;return q},delete(){op='delete';return q},then(resolve,reject){
   calls.push({table,op,filters,payload});
   if(offline)return Promise.resolve({error:{message:'offline'}}).then(resolve,reject);
   let rows=db[table].filter(r=>filters.every(([k,v])=>r[k]===v));
   if(op==='insert'){rows=[{...structuredClone(payload),id:payload.id||'44444444-4444-4444-8444-444444444444',version:1}];db[table].push(...rows);}
   if(op==='update'){rows.forEach(r=>Object.assign(r,structuredClone(payload),{version:r.version+1}));}
   if(op==='delete')db[table]=db[table].filter(r=>!rows.includes(r));
   return Promise.resolve({data:structuredClone(rows)}).then(resolve,reject);
  }};return q;
 },async rpc(name,args){calls.push({rpc:name,args:structuredClone(args)});return {data:name==='hp_import_personal'?args.templates.length:null};}};
 ctx.fakeSDK={createClient(){calls.push({initialized:true});return client;}};
 run(fs.readFileSync('js/transfer.js','utf8'));
 run(fs.readFileSync('js/cloud.js','utf8').replace("await import('https://esm.sh/@supabase/supabase-js@2.117.2')",'globalThis.fakeSDK').replace('HpCloud.start();',''));
 await run('HpCloud.start()');return {run,db,elements,saved,calls};
}
test('configured startup actually initializes client and reads cloud tables',async()=>{
 const {run,calls,elements}=await setup();assert.ok(calls.some(c=>c.initialized));assert.ok(calls.some(c=>c.table==='system_drugs'));
 assert.equal(run('activePresetId'),'s:bqt');assert.match(elements.get('cloudStatus').textContent,/最新版/);
});
test('offline error leaves current prescription usable',async()=>{
 const {run,elements}=await setup({offline:true});assert.match(elements.get('cloudStatus').textContent,/offline/);assert.equal(run('R.phases[0].drugs.length'),4);
});
test('system save rejects a stale version without changing cloud data',async()=>{
 const {run,db,elements}=await setup();db.system_regimens[0].version=2;
 run('R.duration=10;isDirty=true');await run("HpCloud.save('system')");
 assert.match(elements.get('cloudStatus').textContent,/版本已變更/);assert.equal(db.system_regimens[0].regimen_data.duration,14);
});
test('personal save serializes only a template and records selected strength',async()=>{
 const {run,calls}=await setup();await run("HpCloud.save('user',true)");
 const call=calls.find(c=>c.table==='user_regimens'&&c.op==='insert');assert.ok(call);
 assert.equal(call.payload.regimen_data.phases[0].drugs[2].strength,'Tetracycline 500mg');assert.equal(call.payload.regimen_data.clinicName,undefined);
 assert.equal(run('isDirty'),false);
});
test('personal import uses one RPC, replace flag and version snapshot',async()=>{
 const {run,calls}=await setup();await run("HpCloud.restoreText(JSON.stringify(HpTransfer.build(DRUGS_DB,[DEFAULT_PRESETS[0]])),'replace')");
 const call=calls.find(c=>c.rpc==='hp_import_personal');assert.equal(call.args.replace_existing,true);assert.deepEqual(call.args.expected_versions,[]);
 assert.equal(call.args.templates[0].id,undefined);
});
test('admin drug save uses one RPC and rejects renaming existing strengths',async()=>{
 const {run,calls,elements}=await setup();run("HpCloud.openDrugs();dmData[0].name='Updated PPI'");await run('HpCloud.saveDrugs()');
 assert.ok(calls.some(c=>c.rpc==='hp_save_drugs'));
 run("HpCloud.openDrugs();dmData[0].subtypes[0]='Changed strength'");await run('HpCloud.saveDrugs()');
 assert.match(elements.get('cloudStatus').textContent,/不能刪除或改名/);
});
test('logout removes personal templates and never puts them in public cache',async()=>{
 const {run,saved}=await setup();await run("HpCloud.save('user',true)");
 assert.ok(run("allPresets.some(p=>p._cloud.scope==='user')"));
 const cache=JSON.parse([...saved.values()][0]);assert.equal(cache.personalRegimens,undefined);assert.ok(cache.regimens.every(r=>r.id!=='44444444-4444-4444-8444-444444444444'));
 await run('HpCloud.logout()');assert.equal(run("allPresets.some(p=>p._cloud.scope==='user')"),false);
});
