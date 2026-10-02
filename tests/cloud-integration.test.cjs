const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
async function setup({offline=false,role='admin',signinError=false,resetError=false,rpcError=false}={}){
 const elements=new Map(),saved=new Map(),calls=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},classList:{add(){},remove(){}},addEventListener(){},innerHTML:'',textContent:'',children:[],replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)},close(){this.closed=true;this.open=false},showModal(){this.open=true},elements:{email:{value:'admin@example.com'},password:{value:'secret'},confirmPassword:{value:''}},files:[]});return elements.get(id);};
 const ctx=vm.createContext({window:{HP_CLOUD_CONFIG:{url:'https://test.supabase.co',publishableKey:'sb_publishable_test',resetRedirectUrl:'https://hsienht.github.io/Hp-regimen/'}},document:{getElementById:element,querySelector:element,createElement:tag=>({tag,children:[],append(...items){this.children.push(...items)},addEventListener(){}})},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},sessionStorage:{},TextEncoder,Date,URL,setTimeout,structuredClone,alert(){},confirm:()=>true,prompt:()=> 'New template',crypto:{randomUUID:()=> '33333333-3333-4333-8333-333333333333'}});
 const run=s=>vm.runInContext(s,ctx);
 for(const file of ['defaults','storage','app'])run(fs.readFileSync(`js/${file}.js`,'utf8'));
 const db={system_drugs:JSON.parse(run('JSON.stringify(DEFAULT_DRUGS)')).map((d,i)=>({id:d.id,version:1,sort_order:i,drug_data:d})),system_regimens:JSON.parse(run('JSON.stringify(DEFAULT_PRESETS)')).map((p,i)=>({id:p.id,name:p.name,version:1,sort_order:i,regimen_data:p})),user_regimens:[]};
 let authCallback;
 let currentSession={user:{id:'11111111-1111-4111-8111-111111111111',email:'admin@example.com'}};
 const client={auth:{onAuthStateChange(fn){authCallback=fn;},getSession:async()=>({data:{session:currentSession}}),signInWithPassword:async()=>signinError?{error:{message:'Invalid login'}}:{data:{session:currentSession}},signOut:async()=>({data:null}),resetPasswordForEmail:async(email,options)=>{calls.push({reset:email,options});return resetError?{error:{message:'Reset unavailable'}}:{data:null};},updateUser:async attributes=>{calls.push({updatePassword:attributes.password});return {data:{user:currentSession.user}};}},from(table){
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
 },async rpc(name,args){calls.push({rpc:name,args:structuredClone(args)});
 if(rpcError)return {error:{message:'Version conflict'}};
 if(name==='hp_reorder_system_regimens'){
  const next=args.ordered_ids.map((id,index)=>({...db.system_regimens.find(r=>r.id===id),sort_order:index}));db.system_regimens=structuredClone(next);
 }
 if(name==='hp_delete_system_regimen')db.system_regimens=db.system_regimens.filter(r=>r.id!==args.regimen_id);
 return {data:name==='hp_import_personal'?args.templates.length:null};}};
 ctx.fakeSDK={createClient(){calls.push({initialized:true});return client;}};
 run(fs.readFileSync('js/transfer.js','utf8'));
 run(fs.readFileSync('js/cloud.js','utf8').replace("await import('https://esm.sh/@supabase/supabase-js@2.117.2')",'globalThis.fakeSDK').replace('HpCloud.start();',''));
 await run('HpCloud.start()');return {run,db,elements,saved,calls,emitAuth:(event,next=currentSession)=>authCallback(event,next)};
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
test('system order is staged then saved with full version snapshot',async()=>{
 const {run,calls}=await setup();run('HpCloud.openSystem();HpCloud.moveSystem(0,1)');
 assert.equal(calls.filter(c=>c.rpc==='hp_reorder_system_regimens').length,0);
 await run('HpCloud.saveSystemOrder()');const call=calls.find(c=>c.rpc==='hp_reorder_system_regimens');
 assert.equal(call.args.ordered_ids[1],'bqt');assert.equal(call.args.expected_versions.length,12);
 assert.equal(run('allPresets[1].id'),'s:bqt');
});
test('system deletion leaves the current prescription and removes template only',async()=>{
 const {run,calls}=await setup();const before=run('JSON.stringify(R)');run('HpCloud.openSystem()');await run("HpCloud.deleteSystem('bqt')");
 assert.ok(calls.some(c=>c.rpc==='hp_delete_system_regimen'));assert.equal(run('JSON.stringify(R)'),before);
 assert.equal(run("allPresets.some(p=>p.id==='s:bqt')"),false);
});
test('dirty system order blocks deletion and User cannot manage system library',async()=>{
 const admin=await setup();admin.run('HpCloud.openSystem();HpCloud.moveSystem(0,1)');await admin.run("HpCloud.deleteSystem('bqt')");
 assert.equal(admin.calls.filter(c=>c.rpc==='hp_delete_system_regimen').length,0);assert.match(admin.elements.get('cloudStatus').textContent,/先儲存排序/);
 const user=await setup({role:'user'});user.run('HpCloud.openSystem()');assert.match(user.elements.get('cloudStatus').textContent,/Admin/);assert.equal(user.elements.get('cloudSystemManager').hidden,true);
});
test('sorting conflict leaves cloud order unchanged and keeps draft open',async()=>{
 const {run,calls,elements}=await setup({rpcError:true});run('HpCloud.openSystem();HpCloud.moveSystem(0,1)');await run('HpCloud.saveSystemOrder()');
 assert.match(elements.get('cloudStatus').textContent,/Version conflict/);assert.equal(run('allPresets[0].id'),'s:bqt');assert.ok(calls.some(c=>c.rpc==='hp_reorder_system_regimens'));
});
test('reset request uses configured redirect and only runs on explicit submit',async()=>{
 const {run,calls,elements}=await setup();assert.equal(calls.filter(c=>c.reset).length,0);
 await run('HpCloud.requestReset()');const request=calls.find(c=>c.reset);assert.equal(request.options.redirectTo,'https://hsienht.github.io/Hp-regimen/');
 assert.match(elements.get('cloudAuthStatus').textContent,/若此帳號/);assert.equal(elements.get('cloudResetRequest').disabled,false);
});
test('reset request failures appear inside login dialog',async()=>{
 const {run,elements}=await setup({resetError:true});await run('HpCloud.requestReset()');assert.match(elements.get('cloudAuthStatus').textContent,/Reset unavailable/);assert.equal(elements.get('cloudResetRequest').disabled,false);
});
test('password validation rejects mismatch and clears plaintext form fields',async()=>{
 const {run,elements,calls}=await setup();run('HpCloud.openPassword()');const f=elements.get('cloudPasswordForm');f.elements.password.value='NewPassword123';f.elements.confirmPassword.value='DifferentPassword123';
 await run('HpCloud.updatePassword()');assert.match(elements.get('cloudPasswordStatus').textContent,/不一致/);assert.equal(calls.filter(c=>c.updatePassword).length,0);assert.equal(f.elements.password.value,'');
 f.elements.password.value='NewPassword123';f.elements.confirmPassword.value='NewPassword123';await run('HpCloud.updatePassword()');
 assert.equal(calls.filter(c=>c.updatePassword).length,1);assert.equal(elements.get('cloudPasswordDialog').open,false);assert.equal(f.elements.confirmPassword.value,'');
});
test('recovery event opens password dialog without calling APIs in Auth callback',async()=>{
 const {emitAuth,elements,calls}=await setup();const before=calls.length;emitAuth('PASSWORD_RECOVERY');
 assert.equal(elements.get('cloudPasswordDialog').open,true);assert.match(elements.get('cloudPasswordStatus').textContent,/設定新密碼/);assert.equal(calls.length,before);
 await new Promise(resolve=>setTimeout(resolve,5));
});
test('sign-in failures appear in login dialog; sign-out closes admin/password dialogs',async()=>{
 const {run,elements,emitAuth}=await setup({signinError:true});await run('HpCloud.signIn()');assert.match(elements.get('cloudAuthStatus').textContent,/Invalid login/);
 run('HpCloud.openSystem();HpCloud.openPassword()');emitAuth('SIGNED_OUT',null);
 assert.equal(elements.get('cloudSystemDialog').open,false);assert.equal(elements.get('cloudPasswordDialog').open,false);assert.equal(elements.get('cloudSystemManager').hidden,true);
});
test('last system regimen cannot be deleted through management UI',async()=>{
 const {run,db,elements,calls}=await setup();db.system_regimens=[db.system_regimens[0]];await run('HpCloud.refresh()');run('HpCloud.openSystem()');await run("HpCloud.deleteSystem('bqt')");
 assert.match(elements.get('cloudStatus').textContent,/至少需保留/);assert.equal(calls.filter(c=>c.rpc==='hp_delete_system_regimen').length,0);
});
test('invalid reset email and short password never call Auth endpoints',async()=>{
 const {run,elements,calls}=await setup();run("document.getElementById('cloudLoginForm');HpCloud.openPassword()");elements.get('cloudLoginForm').elements.email.value='bad-email';await run('HpCloud.requestReset()');
 assert.match(elements.get('cloudAuthStatus').textContent,/有效的 Email/);assert.equal(calls.filter(c=>c.reset).length,0);
 const f=elements.get('cloudPasswordForm');f.elements.password.value='short';f.elements.confirmPassword.value='short';await run('HpCloud.updatePassword()');
 assert.match(elements.get('cloudPasswordStatus').textContent,/8 個字元/);assert.equal(calls.filter(c=>c.updatePassword).length,0);
});
