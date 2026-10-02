/* Cloud persistence only accepts explicitly saved configuration templates.
   Current prescription, clinicName and unrelated UI fields are never serialized. */
const HpCloud = (() => {
  let client=null, session=null, role='guest', system=[], personal=[], epoch=0;
  const config=window.HP_CLOUD_CONFIG||{};
  const enabled=!!(config.url&&config.publishableKey);
  const cacheKey='hp_v3_public_'+config.url;
  function status(message){document.getElementById('cloudStatus').textContent=message;}
  function check(result){if(result.error)throw result.error;return result.data;}
  function text(value,max=5000){if(typeof value!=='string'||value.length>max)throw Error('文字格式不正確');return value;}
  function template(input){
    if(!input||!Array.isArray(input.phases)||input.phases.length<1||input.phases.length>2)throw Error('組套階段不正確');
    const out={name:text(input.name,200),isPhased:!!input.isPhased,notes:text(input.notes||'')};
    const days=x=>{if(!Number.isInteger(x)||x<1||x>60)throw Error('療程天數需介於 1–60');return x;};
    if(out.isPhased){if(input.phases.length!==2||!Array.isArray(input.phaseDurations)||input.phaseDurations.length!==2)throw Error('兩階段療程格式不正確');out.phaseDurations=input.phaseDurations.map(days);}
    else {if(input.phases.length!==1)throw Error('單階段療程格式不正確');out.duration=days(input.duration);}
    out.phases=input.phases.map(ph=>({drugs:ph.drugs.map(d=>{
      const db=DRUGS_DB.find(x=>x.id===d.drugId);
      if(!db||!Number.isInteger(d.subtype)||!db.subtypes[d.subtype]||![1,2,3,4].includes(d.freq)||!PILL_COUNTS.includes(d.pills))throw Error('藥品或劑量格式不正確');
      const times=d.times||defTimes(d.freq);
      if(!Array.isArray(times)||!times.length||times.some(t=>!TIME_ORDER.includes(t)))throw Error('服藥時段不正確');
      const color=x=>{if(!/^#[0-9a-f]{6}$/i.test(x))throw Error('藥錠顏色格式不正確');return x;};
      if(d.icon&&!SHAPES.some(x=>x.id===d.icon.shape))throw Error('藥錠圖示格式不正確');
      const icon=d.icon?{shape:d.icon.shape,color:color(d.icon.color),color2:d.icon.color2?color(d.icon.color2):null}:null;
      return {drugId:d.drugId,subtype:d.subtype,strength:db.subtypes[d.subtype],freq:d.freq,pills:d.pills,times:[...new Set(times)],customName:d.customName?text(d.customName,200):null,icon};
    })}));
    return out;
  }
  function decode(row,scope,drugDb=DRUGS_DB){
    if(!/^[a-zA-Z0-9_-]+$/.test(row.id))throw Error('雲端組套 ID 格式不正確');
    const p=dc(row.regimen_data);p.id=(scope==='user'?'u:':'s:')+row.id;p.name=row.name;
    p.phases.forEach(ph=>ph.drugs.forEach(d=>{
      const db=drugDb.find(x=>x.id===d.drugId);
      if(d.strength){const i=db?.subtypes.indexOf(d.strength);if(i===undefined||i<0)throw Error('組套藥品規格已異動，請管理者修復');d.subtype=i;delete d.strength;}
    }));
    p._cloud={scope,id:row.id,version:row.version};return p;
  }
  function apply(){
    allPresets=[...system.map(r=>decode(r,'system')),...personal.map(r=>decode(r,'user'))];
    renderPresets();syncDirtyBtns();draw();
  }
  function draw(){
    document.getElementById('cloudLogin').hidden=!!session;
    document.getElementById('cloudLogout').hidden=!session;
    document.getElementById('cloudSaveNew').hidden=!session;
    document.getElementById('cloudSavePersonal').hidden=!session;
    document.getElementById('cloudDeletePersonal').hidden=!session;
    document.getElementById('cloudSaveSystem').hidden=role!=='admin';
    document.getElementById('cloudNewSystem').hidden=role!=='admin';
    document.getElementById('cloudAccount').textContent=session?`${session.user.email} (${role})`:'訪客';
  }
  async function refresh(){
    const request=++epoch, userId=session?.user.id;
    status('讀取雲端設定中…');
    const [drugs,regimens,mine]=await Promise.all([
      client.from('system_drugs').select('*').order('sort_order'),
      client.from('system_regimens').select('*').order('sort_order'),
      userId?client.from('user_regimens').select('*').eq('user_id',userId).order('sort_order'):Promise.resolve({data:[]})
    ]);
    const d=check(drugs),s=check(regimens),u=check(mine);
    if(request!==epoch||userId!==session?.user.id)return;
    if(!d.length||!s.length)throw Error('雲端尚未匯入出廠資料');
    const oldDrugs=DRUGS_DB;
    // A refresh must not change the meaning of the in-progress prescription.
    const nextDrugs=d.map(x=>x.drug_data);
    const remap=reg=>{const copy=dc(reg);copy.phases.forEach(ph=>ph.drugs.forEach(dr=>{
      const strength=oldDrugs.find(x=>x.id===dr.drugId)?.subtypes[dr.subtype];
      const subtype=nextDrugs.find(x=>x.id===dr.drugId)?.subtypes.indexOf(strength);
      if(subtype===undefined||subtype<0)throw Error('本次處方使用的藥品已異動；請完成處方後重新整理。');
      dr.subtype=subtype;
    }));return copy;};
    const current=remap(R),previous=remap(lastSavedR);
    [...s.map(r=>decode(r,'system',nextDrugs)),...u.map(r=>decode(r,'user',nextDrugs))];
    DRUGS_DB=nextDrugs;R=current;lastSavedR=previous;system=s;personal=u;apply();
    renderPhaseSections();renderPreview();
    try{localStorage.setItem(cacheKey,JSON.stringify({drugs:DRUGS_DB,regimens:system}));}catch{ /* Online use remains available. */ }
    status('已取得雲端最新版；本次處方修改不會自動上傳');
  }
  async function action(fn){try{if(!client)throw Error('尚未連接雲端');await fn();}catch(e){status(e.message||'雲端操作失敗；本次處方仍保留');}finally{if(enabled)draw();}}
  async function save(scope,create=false){return action(async()=>{
    if(!session)throw Error('請先登入');if(scope==='system'&&role!=='admin')throw Error('需要 Admin 權限');
    const source=allPresets.find(x=>x.id===activePresetId)?._cloud;
    if(!create&&source?.scope!==scope)throw Error(scope==='system'?'請先載入系統組套':'請先載入我的組套');
    const name=create?prompt('新組套名稱',R.name):R.name;if(name===null)return;
    if(!name.trim())throw Error('請輸入組套名稱');
    if(!confirm(scope==='system'?'將更新所有人共用的系統組套，確定儲存？':'確定將本次設定儲存為個人組套？'))return;
    const payload={name,regimen_data:template({...R,name})};
    const table=scope==='system'?'system_regimens':'user_regimens';
    if(scope==='user')payload.user_id=session.user.id;
    let result;
    if(create){if(scope==='system')payload.id='custom_'+crypto.randomUUID();result=await client.from(table).insert(payload).select();}
    else result=await client.from(table).update(payload).eq('id',source.id).eq('version',source.version).select();
    const rows=check(result);if(!rows.length)throw Error('版本已變更或權限不足，請重新載入後再儲存');
    await refresh();loadPreset((scope==='user'?'u:':'s:')+rows[0].id);status('組套已儲存至雲端');
  });}
  async function remove(){return action(async()=>{
    const source=allPresets.find(x=>x.id===activePresetId)?._cloud;
    if(!session||source?.scope!=='user')throw Error('請先載入我的組套');
    if(!confirm('確定刪除這個個人組套？本次處方仍保留。'))return;
    const rows=check(await client.from('user_regimens').delete().eq('id',source.id).eq('version',source.version).select());
    if(!rows.length)throw Error('版本已變更或權限不足');await refresh();status('個人組套已刪除');
  });}
  async function start(){
    if(!enabled)return;
    document.getElementById('cloudPanel').hidden=false;
    try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached&&!isDirty){DRUGS_DB=cached.drugs;system=cached.regimens;personal=[];apply();loadPreset(allPresets[0].id);status('使用離線快取');}}
    catch{status('使用出廠設定');}
    await action(async()=>{
      const sdk=await import('https://esm.sh/@supabase/supabase-js@2.117.2');
      client=sdk.createClient(config.url,config.publishableKey,{auth:{storage:sessionStorage,persistSession:true}});
      client.auth.onAuthStateChange((event,next)=>{
        if(event==='SIGNED_OUT'){session=null;role='guest';personal=[];epoch++;apply();status('已登出');}
      });
      session=check(await client.auth.getSession()).session;
      if(session)role=check(await client.from('profiles').select('role').eq('id',session.user.id).single()).role;
      await refresh();if(!isDirty)loadPreset(allPresets[0].id);
    });
    draw();
  }
  return {enabled,template,start,refresh:()=>action(refresh),save,remove,
    login:()=>document.getElementById('cloudLoginDialog').showModal(),
    signIn:()=>action(async()=>{
      const form=document.getElementById('cloudLoginForm');const email=form.elements.email.value,password=form.elements.password.value;
      form.elements.password.value='';
      session=check(await client.auth.signInWithPassword({email,password})).session;role='user';personal=[];
      role=check(await client.from('profiles').select('role').eq('id',session.user.id).single()).role;
      document.getElementById('cloudLoginDialog').close();await refresh();draw();
    }),
    logout:()=>action(async()=>{check(await client.auth.signOut());session=null;role='guest';personal=[];epoch++;apply();status('已登出；個人組套已移除');})};
})();
HpCloud.start();
