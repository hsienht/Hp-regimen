/* Cloud persistence only accepts explicitly saved configuration templates.
   Current prescription, clinicName and unrelated UI fields are never serialized. */
const HpCloud = (() => {
  let client=null, session=null, role='guest', system=[], personal=[], drugRows=[], epoch=0, authEpoch=0, recovery=false, systemDraft=null;
  const config=window.HP_CLOUD_CONFIG||{};
  const enabled=!!(config.url&&config.publishableKey);
  const cacheKey='hp_v3_public_'+config.url;
  function status(message){document.getElementById('cloudStatus').textContent=message;}
  function check(result){if(result.error)throw result.error;return result.data;}
  function text(value,max=5000){if(typeof value!=='string'||value.length>max)throw Error('文字格式不正確');return value;}
  function template(input,drugDb=DRUGS_DB){
    if(!input||!Array.isArray(input.phases)||input.phases.length<1||input.phases.length>2)throw Error('組套階段不正確');
    const out={name:text(input.name,200),isPhased:!!input.isPhased,notes:text(input.notes||'')};
    const days=x=>{if(!Number.isInteger(x)||x<1||x>60)throw Error('療程天數需介於 1–60');return x;};
    if(out.isPhased){if(input.phases.length!==2||!Array.isArray(input.phaseDurations)||input.phaseDurations.length!==2)throw Error('兩階段療程格式不正確');out.phaseDurations=input.phaseDurations.map(days);}
    else {if(input.phases.length!==1)throw Error('單階段療程格式不正確');out.duration=days(input.duration);}
    out.phases=input.phases.map(ph=>({drugs:ph.drugs.map(d=>{
      const db=drugDb.find(x=>x.id===d.drugId);
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
    const clean=template(p,drugDb);clean.phases.forEach(ph=>ph.drugs.forEach(d=>delete d.strength));
    clean.id=p.id;clean._cloud={scope,id:row.id,version:row.version};return clean;
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
    document.getElementById('cloudDrugManager').hidden=role!=='admin';
    document.getElementById('cloudBackup').hidden=!session;
    document.getElementById('cloudRestore').hidden=!session;
    document.getElementById('cloudLegacy').hidden=!session;
    document.getElementById('cloudRestoreDrugs').hidden=role!=='admin';
    document.getElementById('cloudSystemManager').hidden=role!=='admin';
    document.getElementById('cloudChangePassword').hidden=!session;
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
    const nextDrugs=HpTransfer.catalog(d.map(x=>x.drug_data));
    const remap=reg=>{const copy=dc(reg);copy.phases.forEach(ph=>ph.drugs.forEach(dr=>{
      const strength=oldDrugs.find(x=>x.id===dr.drugId)?.subtypes[dr.subtype];
      const subtype=nextDrugs.find(x=>x.id===dr.drugId)?.subtypes.indexOf(strength);
      if(subtype===undefined||subtype<0)throw Error('本次處方使用的藥品已異動；請完成處方後重新整理。');
      dr.subtype=subtype;
    }));return copy;};
    const current=remap(R),previous=remap(lastSavedR);
    [...s.map(r=>decode(r,'system',nextDrugs)),...u.map(r=>decode(r,'user',nextDrugs))];
    DRUGS_DB=nextDrugs;drugRows=d;R=current;lastSavedR=previous;system=s;personal=u;apply();
    renderPhaseSections();renderPreview();
    try{localStorage.setItem(cacheKey,JSON.stringify({drugs:DRUGS_DB,regimens:system}));}catch{ /* Online use remains available. */ }
    status('已取得雲端最新版；本次處方修改不會自動上傳');
  }
  async function action(fn,initializing=false,onError=status){try{if(!client&&!initializing)throw Error('尚未連接雲端');await fn();}catch(e){onError(e.message||'雲端操作失敗；本次處方仍保留');}finally{if(enabled)draw();}}
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
    if(create)payload.sort_order=Math.max(-1,...(scope==='user'?personal:system).map(r=>r.sort_order||0))+1;
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
    try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached&&!isDirty){const next=HpTransfer.catalog(cached.drugs);if(!Array.isArray(cached.regimens)||!cached.regimens.length)throw Error('Empty cache');cached.regimens.forEach(r=>decode(r,'system',next));DRUGS_DB=next;system=cached.regimens;personal=[];apply();loadPreset(allPresets[0].id);status('使用離線快取');}}
    catch{status('使用出廠設定');}
    await action(async()=>{
      if(config.publishableKey.startsWith('sb_secret_'))throw Error('請使用公開 publishable key，不能使用 secret key');
      const sdk=await import('https://esm.sh/@supabase/supabase-js@2.117.2');
      client=sdk.createClient(config.url,config.publishableKey,{auth:{storage:sessionStorage,persistSession:true,detectSessionInUrl:true,flowType:'implicit'}});
      client.auth.onAuthStateChange((event,next)=>{
        // Do not call asynchronous Auth APIs while the SDK's event lock is held.
        if(event==='SIGNED_OUT'){
          session=null;role='guest';personal=[];recovery=false;epoch++;authEpoch++;systemDraft=null;apply();
          document.getElementById('cloudSystemDialog').close();document.getElementById('cloudPasswordDialog').close();status('已登出');
        }else if(event==='PASSWORD_RECOVERY'&&next){
          recovery=true;session=next;role='user';personal=[];epoch++;authEpoch++;apply();
          document.getElementById('cloudLoginDialog').close();openPassword();
          setTimeout(()=>action(loadRole),0);
        }else if(event==='TOKEN_REFRESHED'&&next&&next.user.id===session?.user.id){session=next;}
        else if(event==='SIGNED_IN'&&next){
          const generation=authEpoch;
          setTimeout(()=>{
            if(generation!==authEpoch||session?.user.id===next.user.id)return;
            action(async()=>{session=next;role='user';personal=[];epoch++;authEpoch++;apply();await loadRole();await refresh();});
          },0);
        }
      });
      session=check(await client.auth.getSession()).session;
      if(session)await loadRole();
      await refresh();if(!isDirty)loadPreset(allPresets[0].id);
    },true);
    draw();
  }
  async function loadRole(){
    const userId=session?.user.id,generation=authEpoch;
    if(!userId){role='guest';return;}
    const profile=check(await client.from('profiles').select('role').eq('id',userId).single());
    if(generation===authEpoch&&session?.user.id===userId){role=profile.role;draw();}
  }
  function managerRows(){
    if(!systemDraft)return;
    const list=document.getElementById('cloudSystemList');list.replaceChildren();
    systemDraft.order.forEach((id,index)=>{
      const row=systemDraft.rows.find(r=>r.id===id),item=document.createElement('li');
      const name=document.createElement('span');name.textContent=row.name;item.append(name);
      for(const [label,offset] of [['上移',-1],['下移',1]]){
        const button=document.createElement('button');button.type='button';button.textContent=label;
        button.disabled=index+offset<0||index+offset>=systemDraft.order.length;
        button.addEventListener('click',()=>moveSystem(index,offset));item.append(button);
      }
      const remove=document.createElement('button');remove.type='button';remove.textContent='刪除';
      remove.disabled=systemDraft.order.length<=1;remove.addEventListener('click',()=>deleteSystem(id));item.append(remove);list.append(item);
    });
  }
  function openSystem(){try{
    requireAdmin();systemDraft={rows:dc(system),order:system.map(r=>r.id)};managerRows();document.getElementById('cloudSystemDialog').showModal();
  }catch(e){status(e.message);}}
  function moveSystem(index,offset){
    if(!systemDraft||![-1,1].includes(offset)||!Number.isInteger(index))return;
    const target=index+offset;if(index<0||index>=systemDraft.order.length||target<0||target>=systemDraft.order.length)return;
    [systemDraft.order[index],systemDraft.order[target]]=[systemDraft.order[target],systemDraft.order[index]];managerRows();
  }
  const versions=rows=>rows.map(r=>({id:r.id,version:r.version})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  async function saveSystemOrder(){return action(async()=>{
    requireAdmin();if(!systemDraft)throw Error('請先開啟系統組套管理');
    if(!confirm('確定儲存所有人共用的系統組套順序？'))return;
    check(await client.rpc('hp_reorder_system_regimens',{ordered_ids:[...systemDraft.order],expected_versions:versions(systemDraft.rows)}));
    await refresh();openSystem();status('系統組套順序已儲存，本次處方保留');
  });}
  async function deleteSystem(id){return action(async()=>{
    requireAdmin();if(!systemDraft)throw Error('請先開啟系統組套管理');
    const row=systemDraft.rows.find(r=>r.id===id);if(!row)throw Error('組套不存在');
    if(systemDraft.rows.length<=1)throw Error('至少需保留一個系統組套');
    if(systemDraft.order.some((value,index)=>value!==systemDraft.rows[index].id))throw Error('請先儲存排序，或重新開啟管理視窗後再刪除');
    if(!confirm(`確定刪除共用系統組套「${row.name}」？所有使用者將不再看到此組套，本次處方仍保留。`))return;
    check(await client.rpc('hp_delete_system_regimen',{regimen_id:id,expected_version:row.version}));
    await refresh();openSystem();status('系統組套已刪除，本次處方保留');
  });}
  function authMessage(message){document.getElementById('cloudAuthStatus').textContent=message;status(message);}
  function passwordMessage(message){document.getElementById('cloudPasswordStatus').textContent=message;status(message);}
  async function requestReset(){
    const email=document.getElementById('cloudLoginForm').elements.email.value.trim();
    try{
      if(!client)throw Error('尚未連接雲端');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('請先輸入有效的 Email');
      if(!config.resetRedirectUrl)throw Error('尚未設定密碼重設回到的網站網址');
      const redirect=new URL(config.resetRedirectUrl);if(redirect.protocol!=='https:'||redirect.username||redirect.password||redirect.hash||redirect.search)throw Error('密碼重設網址格式不正確');
      const button=document.getElementById('cloudResetRequest');button.disabled=true;
      try{check(await client.auth.resetPasswordForEmail(email,{redirectTo:redirect.href}));authMessage('重設要求已送出；若此帳號可重設密碼，請至信箱開啟連結。');}
      finally{button.disabled=false;}
    }catch(e){authMessage(e.message||'無法送出重設要求');}
  }
  function openPassword(){
    if(!session){status('請先登入，或由重設密碼信件的連結進入');return;}
    const form=document.getElementById('cloudPasswordForm');form.elements.password.value='';form.elements.confirmPassword.value='';
    document.getElementById('cloudPasswordStatus').textContent=recovery?'請設定新密碼':'請輸入新密碼';
    const dialog=document.getElementById('cloudPasswordDialog');if(!dialog.open)dialog.showModal();
  }
  async function updatePassword(){
    const form=document.getElementById('cloudPasswordForm'),password=form.elements.password.value,confirmation=form.elements.confirmPassword.value;
    try{
      if(!client||!session)throw Error('登入或重設連結已失效，請重新取得連結');
      if(password.length<8)throw Error('新密碼至少需要 8 個字元');
      if(password!==confirmation)throw Error('兩次輸入的密碼不一致');
      const button=document.getElementById('cloudPasswordSubmit');button.disabled=true;
      try{check(await client.auth.updateUser({password}));recovery=false;form.elements.password.value='';form.elements.confirmPassword.value='';document.getElementById('cloudPasswordDialog').close();status('密碼已更新');}
      finally{button.disabled=false;}
    }catch(e){passwordMessage(e.message||'密碼更新失敗');}
    finally{form.elements.password.value='';form.elements.confirmPassword.value='';}
  }
  function requireAdmin(){if(!session||role!=='admin')throw Error('需要 Admin 權限');}
  function openDrugs(){try{requireAdmin();dmOrigData=dc(DRUGS_DB);dmData=dc(DRUGS_DB);dmOpenIdx=null;dmDirty=false;renderDmList();syncDmBtns();document.getElementById('drugPanel').classList.add('open');document.getElementById('mainContent').style.display='none';}catch(e){status(e.message);}}
  async function persistDrugs(input){
    requireAdmin();const next=HpTransfer.catalog(input);
    for(const old of DRUGS_DB){
      const entry=next.find(d=>d.id===old.id);
      if(!entry||old.subtypes.some((s,i)=>entry.subtypes[i]!==s))throw Error('既有藥品與規格需保留原順序；可新增規格，不能刪除或改名。');
    }
    const changes=next.map((d,i)=>({id:d.id,drug_data:d,sort_order:i,version:drugRows.find(r=>r.id===d.id)?.version??null}));
    check(await client.rpc('hp_save_drugs',{changes}));
    await refresh();
  }
  async function saveDrugs(){return action(async()=>{
    if(!confirm('確定更新所有使用者共用的藥品檔？'))return;
    await persistDrugs(dmData.filter(d=>!d.deleted));closeDrugMgr();status('共用藥品檔已更新');
  });}
  function backup(){try{
    if(!session)throw Error('請先登入');
    const mine=personal.map(r=>decode(r,'user'));
    const shared=role==='admin'?system.map(r=>decode(r,'system')):[];
    HpTransfer.download(HpTransfer.build(DRUGS_DB,mine,shared));status('設定備份已下載，不包含本次處方');
  }catch(e){status(e.message);}}
  async function restoreText(raw,mode,includeSystem=false){return action(async()=>{
    if(!session)throw Error('請先登入');if(!['merge','replace'].includes(mode))throw Error('請選擇合併或取代');
    const file=HpTransfer.parse(raw);
    const source=includeSystem?[...file.personalRegimens,...(file.systemRegimens||[])]:file.personalRegimens;
    const prepared=HpTransfer.prepare(source,file.drugs,DRUGS_DB,mode==='replace');
    if(!prepared.length)throw Error('檔案中沒有可匯入的組套');
    const duplicates=prepared.filter(p=>personal.some(r=>r.name===p.name)).length;
    const notice=mode==='replace'?`取代模式：將刪除目前 ${personal.length} 個個人組套，改為檔案中的 ${prepared.length} 個。`:`合併模式：匯入 ${prepared.length-duplicates} 個新組套；保留目前同名的 ${duplicates} 個組套。`;
    if(!confirm(notice+'\n只影響目前帳號的個人組套，不更新共用系統組套。確定繼續？'))return;
    const expected_versions=personal.map(r=>({id:r.id,version:r.version})).sort((a,b)=>a.id.localeCompare(b.id));
    const count=check(await client.rpc('hp_import_personal',{templates:prepared,replace_existing:mode==='replace',expected_versions}));
    await refresh();status(`已匯入 ${count} 個個人組套`);document.getElementById('cloudRestoreDialog').close();
  });}
  async function restoreFile(){
    const input=document.getElementById('cloudRestoreFile'),file=input.files[0];
    if(!file){status('請先選擇 JSON 備份檔');return;}
    if(file.size>HpTransfer.MAX_BYTES){status('備份檔不得超過 2 MB');return;}
    try{await restoreText(await file.text(),document.getElementById('cloudRestoreMode').value,document.getElementById('cloudIncludeSystem').checked);}catch(e){status(e.message);}
  }
  async function importLegacy(){return action(async()=>{
    if(!session)throw Error('請先登入');
    const sourceDrugs=JSON.parse(localStorage.getItem('hp_drugs_v4')||'null');
    const sourcePresets=JSON.parse(localStorage.getItem('hp_presets_v7')||'null');
    if(!sourcePresets)throw Error('此瀏覽器沒有舊版 v7 組套資料');
    const backup=HpTransfer.build(sourceDrugs||DEFAULT_DRUGS,sourcePresets);
    await restoreText(JSON.stringify(backup),'merge');
  });}
  async function restoreDrugFile(){return action(async()=>{
    requireAdmin();const file=document.getElementById('cloudRestoreFile').files[0];
    if(!file||file.size>HpTransfer.MAX_BYTES)throw Error('請選擇 2 MB 以內的備份檔');
    const backup=HpTransfer.parse(await file.text());
    const merged=HpTransfer.mergeCatalog(backup.drugs,DRUGS_DB);
    if(!confirm('將以備份更新共用藥品名稱、圖示及囑言，並補齊缺少的規格。既有規格會保留。確定繼續？'))return;
    await persistDrugs(merged);status('已由備份更新共用藥品檔');
  });}
  return {enabled,template,start,refresh:()=>action(refresh),save,remove,openDrugs,saveDrugs,backup,restoreText,restoreFile,restoreDrugFile,importLegacy,
    openSystem,moveSystem,saveSystemOrder,deleteSystem,requestReset,openPassword,updatePassword,
    isAdmin:()=>!!session&&role==='admin',
    restore:()=>document.getElementById('cloudRestoreDialog').showModal(),
    login:()=>{document.getElementById('cloudAuthStatus').textContent='';document.getElementById('cloudLoginDialog').showModal();},
    signIn:()=>action(async()=>{
      const form=document.getElementById('cloudLoginForm');const email=form.elements.email.value,password=form.elements.password.value;
      form.elements.password.value='';
      session=check(await client.auth.signInWithPassword({email,password})).session;role='user';personal=[];epoch++;apply();
      authEpoch++;await loadRole();
      document.getElementById('cloudLoginDialog').close();await refresh();draw();
    },false,authMessage),
    logout:()=>action(async()=>{check(await client.auth.signOut());session=null;role='guest';personal=[];recovery=false;epoch++;authEpoch++;systemDraft=null;apply();document.getElementById('cloudSystemDialog').close();document.getElementById('cloudPasswordDialog').close();status('已登出；個人組套已移除');})};
})();
HpCloud.start();
