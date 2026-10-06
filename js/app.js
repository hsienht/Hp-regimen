function cloudConfigured(){const c=window.HP_CLOUD_CONFIG;return !!(c&&c.url&&c.publishableKey);}
function localOnlyGuard(){if(!cloudConfigured())return false;alert('雲端模式請使用「我的組套／系統組套」儲存按鈕。共用藥品需由管理者維護。');return true;}
// ═══════════════════════════════════════════════
//  STATIC SIDE EFFECTS DATA
// ═══════════════════════════════════════════════
const DRUG_SIDE_EFFECTS={
  ppi:{name:'PPI（質子幫浦抑制劑）',subtitle:'Omeprazole / Esomeprazole / Lansoprazole / Rabeprazole / Pantoprazole',sections:[
    {title:'副作用',items:['頭痛、腹瀉、噁心、腹脹','長期使用：低鎂血症、低鈣 → 骨折風險上升','增加困難梭狀芽孢桿菌（C. diff）感染風險','長期使用可能增加慢性腎病或急性間質性腎炎風險（因果關係未確立）']},
    {title:'注意事項',items:['需於飯前服用（需胃酸活化）','與 Clopidogrel（保栓通）併用：Esomeprazole / Omeprazole 會降低其抗血小板效果，Rabeprazole / Pantoprazole 影響較小，HP 治療期間若有需求優先選用後二者']}
  ]},
  pcab:{name:'PCAB（鉀離子競爭性酸阻斷劑）',subtitle:'Vonoprazan（Vocinti® 福星定）',sections:[
    {title:'副作用',items:['頭痛、腹瀉、噁心','肝指數輕微升高（有肝功能異常通報）']},
    {title:'注意事項',items:['肝功能不良者需謹慎使用','主要經 CYP3A4 代謝，與 Itraconazole、Atazanavir 等 CYP3A4 抑制劑併用需注意','長期使用可能影響鈣質吸收（骨質疏鬆高風險者告知醫師）','屬自費藥品']}
  ]},
  bismuth:{name:'Bismuth Subcitrate（KCB® 鉍劑）',sections:[
    {title:'副作用',items:['糞便、舌頭變黑（正常現象，需事先告知患者）','便祕或腹瀉、噁心、食慾不振','長期大量使用：鉍中毒 → 神經毒性（腦病變、震顫、混亂）']},
    {title:'注意事項',items:['避免長期連續使用（不超過建議療程）','腎功能不良者慎用（鉍由腎臟排除）','服藥期間禁酒']}
  ]},
  amoxicillin:{name:'Amoxicillin',sections:[
    {title:'副作用',items:['腹瀉、噁心、胃腸不適（最常見）','皮疹（約 3–5%，多為非過敏性斑丘疹）','嚴重（少見）：過敏性休克、蕁麻疹、Stevens-Johnson 症候群']},
    {title:'注意事項',items:['青黴素過敏者禁用，使用前務必詢問過敏史','腹瀉嚴重時勿自行服用止瀉藥，需回診']}
  ]},
  clarithromycin:{name:'Clarithromycin',sections:[
    {title:'副作用',items:['金屬味或苦味（最常見主訴）','腹瀉、噁心、腹痛','QT 間期延長 → 心律不整風險（Torsades de pointes）']},
    {title:'注意事項',items:['強效 CYP3A4 抑制劑，與 Statins（Lovastatin、Simvastatin）併用 → 橫紋肌溶解風險，需暫停','心臟病患或 QT 延長病史者需謹慎','HP 治療期間為最常見抗藥性抗生素，台灣抗藥性率約 15–30%']}
  ]},
  metronidazole:{name:'Metronidazole',sections:[
    {title:'副作用',items:['噁心、頭痛、口中金屬味','周邊神經病變（手腳麻木、刺痛）── 長期使用風險']},
    {title:'注意事項',items:['服藥期間及停藥後 24 小時內絕對禁酒（Disulfiram-like reaction：潮紅、心悸、嘔吐）','癲癇病史或中樞神經疾病者禁用','懷孕（尤其妊娠初期）需特別謹慎']}
  ]},
  tetracycline:{name:'Tetracycline',sections:[
    {title:'副作用',items:['腸胃不適（噁心、嘔吐）','光過敏（曬太陽後皮膚容易曬傷）','8 歲以下兒童服用 → 牙齒永久變色，骨骼發育受影響']},
    {title:'注意事項',items:['需空腹服用（飯前 1 小時或飯後 2 小時）','避免與乳製品、制酸劑、鈣片、鐵劑同服（二三價金屬離子大幅降低吸收）','孕婦、哺乳婦、8 歲以下兒童禁用','外出做好防曬']}
  ]},
  levofloxacin:{name:'Levofloxacin',sections:[
    {title:'副作用',items:['腸胃不適、頭痛、頭暈','肌腱炎或肌腱斷裂（尤其 60 歲以上、併用類固醇者）','光過敏','QT 間期延長']},
    {title:'注意事項',items:['建議早餐前服用','避免與含二價金屬離子製劑（制酸劑、鐵劑、鈣片）同時服用，需間隔至少 2 小時','外出防曬','腎功能不良者需調整劑量','癲癇病史者慎用','台灣抗藥性率近年上升，需注意']}
  ]},
  rifabutin:{name:'Rifabutin',sections:[
    {title:'副作用',items:['體液（尿液、汗液、淚液、唾液）變橘紅色（正常現象，需告知患者）','皮疹、發燒、類流感症狀','血液毒性：血小板減少、白血球減少（出血或感染風險）','葡萄膜炎（眼睛發炎）── 較高劑量時']},
    {title:'注意事項',items:['肝臟酵素誘導劑（與口服避孕藥、Cyclosporine、抗凝血劑等多種藥物交互作用）','用於三線以後的救援療法，需確認其他治療失敗後才使用','定期監測血球計數']}
  ]},
  doxycycline:{name:'Doxycycline',sections:[
    {title:'副作用',items:['噁心、嘔吐、腹瀉、腹痛','光過敏（曬太陽後皮膚容易曬傷）','食道炎（未配足量水服藥）','8 歲以下兒童服用 → 牙齒永久變色，骨骼發育受影響']},
    {title:'注意事項',items:['空腹較佳；胃不適可與食物或牛奶併服，需配大量白開水，服後勿立即躺下','避免與制酸劑、鈣片、鐵劑同服（需間隔 1 小時前 / 2 小時後）','口服避孕藥效果降低，需改用其他避孕方法','外出做好防曬','長期使用需追蹤肝腎功能及血液凝血功能','孕婦、哺乳婦、8 歲以下兒童禁用','肝功能不全、食道疾病者慎用']}
  ]},
};

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
let R=dc(allPresets[0]);          // working regimen
let lastSavedR=dc(allPresets[0]); // snapshot for revert
let activePresetId=allPresets[0]?.id||null;
let isDirty=false;
let regimenNameEdited=false;      // user manually changed the regimen name

// Preset Manager state
let showMgr=false;
let mgrOrigNames={};  // {id:name} snapshot at open
let mgrOrigOrder=[];  // id[] snapshot at open
let mgrWorkOrder=[];  // id[] current working order
let mgrPendNames={};  // {id:newName} pending renames
let mgrPendDel=new Set(); // pending deletes (id)
let mgrMode=null;     // null | 'edit' | 'drag'
let mgrDragSrc=null;
let mgrDirty=false;

// Drug Manager state
let dmData=null;      // working copy during editing
let dmOrigData=null;  // snapshot at open (for revert)
let dmOpenIdx=null;   // expanded drug row index

// Icon editor state
let openIconEd=null;  // "ph{p}-dr{d}"
let uidCnt=0;
const nuid=()=>++uidCnt;
let svgCnt=0;

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════
function defTimes(f){return f===1?['breakfast']:f===2?['breakfast','dinner']:f===3?['breakfast','lunch','dinner']:['breakfast','lunch','dinner','sleep'];}
function addUids(reg){reg.phases.forEach(ph=>ph.drugs.forEach(d=>{if(!d.uid)d.uid=nuid();}));}
function getDB(drugId){return DRUGS_DB.find(d=>d.id===drugId)||null;}
function resolveIcon(drugId,ov){
  const d=getDB(drugId)||{shape:'round',color:'#ccc',color2:null};
  if(!ov)return{shape:d.shape,color:d.color,color2:d.color2||null};
  return{shape:ov.shape||d.shape,color:ov.color||d.color,color2:ov.color2!==undefined?ov.color2:(d.color2||null)};
}
function totalDays(reg){
  if(reg.isPhased)return(reg.phaseDurations||[7,7]).reduce((a,b)=>a+b,0);
  return reg.duration||14;
}
function getPresetName(id){return allPresets.find(p=>p.id===id)?.name||id;}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}

// ═══════════════════════════════════════════════
//  SVG RENDERING
// ═══════════════════════════════════════════════
function wholePill(icon){
  const {shape,color,color2}=icon;
  if(shape==='small')return`<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><ellipse cx="6.5" cy="6" rx="2.5" ry="1.5" fill="rgba(255,255,255,.32)" transform="rotate(-25 6.5 6)"/></svg>`;
  if(shape==='round')return`<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><ellipse cx="8.5" cy="8" rx="3.5" ry="2" fill="rgba(255,255,255,.32)" transform="rotate(-25 8.5 8)"/></svg>`;
  if(shape==='oval')return`<svg width="38" height="22" viewBox="0 0 38 22"><rect x="1" y="1" width="36" height="20" rx="10" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><rect x="5" y="5" width="14" height="6" rx="3" fill="rgba(255,255,255,.30)"/></svg>`;
  if(shape==='capsule'){const c2=color2||'#E0E0E0';return`<svg width="44" height="20" viewBox="0 0 44 20"><rect x="1" y="1" width="42" height="18" rx="9" fill="${c2}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><path d="M1 9 A9 9 0 0 1 10 0 L22 0 L22 20 L10 20 A9 9 0 0 1 1 11Z" fill="${color}"/><line x1="22" y1="1" x2="22" y2="19" stroke="rgba(0,0,0,.10)" stroke-width="1"/><ellipse cx="9" cy="7" rx="3.5" ry="2.2" fill="rgba(255,255,255,.32)" transform="rotate(-20 9 7)"/></svg>`;}
  return`<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${color||'#ccc'}" stroke="rgba(0,0,0,.18)" stroke-width="1"/></svg>`;
}
function halfPill(icon){
  const {shape,color,color2}=icon;
  const dash=`stroke="rgba(0,0,0,.18)" stroke-width="1"`;
  // viewBox covers only the left half of the pill coordinate space — no scaling, no clipPath needed.
  if(shape==='small')
    return`<svg width="9" height="18" viewBox="0 0 9 18" overflow="hidden"><circle cx="9" cy="9" r="8" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><line x1="8.5" y1="1" x2="8.5" y2="17" ${dash}/></svg>`;
  if(shape==='round')
    return`<svg width="12" height="24" viewBox="0 0 12 24" overflow="hidden"><circle cx="12" cy="12" r="11" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><line x1="11.5" y1="1" x2="11.5" y2="23" ${dash}/></svg>`;
  if(shape==='oval')
    return`<svg width="19" height="22" viewBox="0 0 19 22" overflow="hidden"><rect x="1" y="1" width="36" height="20" rx="10" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><line x1="18.5" y1="1" x2="18.5" y2="21" ${dash}/></svg>`;
  if(shape==='capsule'){const c2=color2||'#E0E0E0';
    return`<svg width="22" height="20" viewBox="0 0 22 20" overflow="hidden"><rect x="1" y="1" width="42" height="18" rx="9" fill="${c2}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><path d="M1 9 A9 9 0 0 1 10 0 L22 0 L22 20 L10 20 A9 9 0 0 1 1 11Z" fill="${color}"/><line x1="21.5" y1="1" x2="21.5" y2="19" ${dash}/></svg>`;}
  return`<svg width="12" height="24" viewBox="0 0 12 24" overflow="hidden"><circle cx="12" cy="12" r="11" fill="${color||'#ccc'}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><line x1="11.5" y1="1" x2="11.5" y2="23" ${dash}/></svg>`;
}
function pillsHTML(drugId,ov,count){
  const icon=resolveIcon(drugId,ov),whole=Math.floor(count),hasH=Math.abs(count%1)>0.1;
  let h='';for(let i=0;i<whole;i++)h+=wholePill(icon);
  if(hasH)h+=halfPill(icon);return h;
}
function drugIconSmall(drugId,ov){
  const{shape,color,color2}=resolveIcon(drugId,ov);
  if(shape==='capsule')return`<div style="width:22px;height:12px;border-radius:6px;background:linear-gradient(90deg,${color} 50%,${color2||'#E0E0E0'} 50%);border:1px solid rgba(0,0,0,.18);flex-shrink:0"></div>`;
  if(shape==='oval')return`<div style="width:22px;height:12px;border-radius:6px;background:${color};border:1px solid rgba(0,0,0,.18);flex-shrink:0"></div>`;
  const sz=shape==='small'?14:16;
  return`<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${color};border:1px solid rgba(0,0,0,.18);flex-shrink:0"></div>`;
}

// ═══════════════════════════════════════════════
//  INPUT PANEL RENDERING
// ═══════════════════════════════════════════════
function renderAll(){
  syncFormToR();renderPresets();renderPhaseSections();renderPreview();syncDirtyBtns();syncResetBtn();
}

// ── A5: Global reset ──
function isDefaultState(){
  const strip=obj=>JSON.parse(JSON.stringify(obj,(k,v)=>k==='uid'?undefined:v));
  if(JSON.stringify(strip(allPresets))!==JSON.stringify(strip(DEFAULT_PRESETS)))return false;
  if(DRUGS_DB.some(d=>d.deleted)||DRUGS_DB.length!==DEFAULT_DRUGS.length)return false;
  const normDrug=d=>({id:d.id,name:d.name,subtypes:d.subtypes,shape:d.shape,color:d.color,color2:d.color2||null,note:d.note||''});
  return JSON.stringify(DRUGS_DB.map(normDrug))===JSON.stringify(DEFAULT_DRUGS.map(normDrug));
}
function syncResetBtn(){
  const btn=document.getElementById('resetDefaultsBtn');if(!btn)return;
  if(isDefaultState()){btn.className='btn btn-sm defaults-off';btn.disabled=true;}
  else{btn.className='btn btn-sm warn';btn.disabled=false;}
}
function resetToDefaults(){
  if(localOnlyGuard())return;
  if(!confirm('確定要將所有組套與藥品恢復預設值嗎？（所有自訂內容將遺失）'))return;
  allPresets=dc(DEFAULT_PRESETS);savePresets();
  DRUGS_DB=dc(DEFAULT_DRUGS);saveDrugs();
  activePresetId=null;isDirty=false;mgrDirty=false;dmDirty=false;
  if(showMgr){showMgr=false;document.getElementById('mgrPanel').classList.remove('open');document.getElementById('mainContent').style.display='';document.getElementById('mgrToggleBtn').textContent='組套管理 ▾';}
  closeDrugMgr();
  R={name:'',isPhased:false,duration:14,notes:'',phases:[{drugs:[]}]};
  lastSavedR=dc(R);regimenNameEdited=false;openIconEd=null;
  document.getElementById('regimenName').value='';
  document.getElementById('duration').value='';
  document.getElementById('duration').disabled=false;
  document.getElementById('notes').value='';
  renderAll();
}

// ── B1: Manager dirty buttons ──
function syncMgrBtns(){
  document.getElementById('mgrSaveBtn').style.display=mgrDirty?'':'none';
  document.getElementById('mgrRevertBtn').style.display=mgrDirty?'':'none';
}

function syncFormToR(){
  document.getElementById('regimenName').value=document.getElementById('regimenName').value||R.name||'';
  document.getElementById('duration').value=totalDays(R);
  document.getElementById('duration').disabled=!!R.isPhased;
  document.getElementById('notes').value=R.notes||'';
  const pdSel=document.getElementById('phaseDurSelect');
  document.getElementById('phasedToggle').checked=!!R.isPhased;
  pdSel.style.display=R.isPhased?'':'none';
  if(R.isPhased&&R.phaseDurations)pdSel.value=R.phaseDurations[0]+'-'+R.phaseDurations[1];
}

function renderPresets(){
  const grid=document.getElementById('presetGrid');
  grid.innerHTML=allPresets.map(p=>
    `<button class="preset-btn${activePresetId===p.id?' active':''}" onclick="confirmLoadPreset('${p.id}')">${esc(p.name.replace(/（[^）]*）/g,'').replace(/\([^)]*\)/g,'').trim())}${p._cloud?(p._cloud.scope==='user'?' · 我的':' · 系統'):''}</button>`
  ).join('')+`<button class="preset-btn${!activePresetId?' active':''}" onclick="setCustomMode()">自訂組合</button>`;
}

function syncDirtyBtns(){
  document.getElementById('saveModBtn').style.display=(isDirty&&activePresetId&&!cloudConfigured())?'':'none';
  document.getElementById('revertBtn').style.display=isDirty?'':'none';
}
function rMatchesSaved(){
  function norm(reg){
    return JSON.parse(JSON.stringify(reg,(k,v)=>k==='uid'?undefined:v));
  }
  function normPhases(phases){
    return phases.map(ph=>({drugs:ph.drugs.map(d=>({
      drugId:d.drugId, subtype:d.subtype, freq:d.freq, pills:d.pills,
      times:[...(d.times||defTimes(d.freq))].sort((a,b)=>TIME_ORDER.indexOf(a)-TIME_ORDER.indexOf(b)),
      icon:d.icon||null
    }))}));
  }
  const cur={name:R.name||'',phases:normPhases(R.phases),isPhased:!!R.isPhased,phaseDurations:R.phaseDurations||null,duration:R.isPhased?null:(R.duration||14),notes:R.notes||''};
  const orig={name:lastSavedR.name||'',phases:normPhases(lastSavedR.phases),isPhased:!!lastSavedR.isPhased,phaseDurations:lastSavedR.phaseDurations||null,duration:lastSavedR.isPhased?null:(lastSavedR.duration||14),notes:lastSavedR.notes||''};
  return JSON.stringify(norm(cur))===JSON.stringify(norm(orig));
}
function onNotesInput(){R.notes=document.getElementById('notes').value;markDirty();renderPreview();}
function onDurationInput(){if(!R.isPhased)R.duration=parseInt(document.getElementById('duration').value)||14;markDirty();renderPreview();}
function markDirty(){isDirty=true;if(rMatchesSaved())isDirty=false;syncDirtyBtns();}

function renderPhaseSections(){
  const c=document.getElementById('phaseSections');
  if(R.isPhased){
    c.innerHTML=R.phases.map((_,pi)=>`
      <div class="phase-section">
        <div class="phase-header-row">
          <span class="phase-badge ${pi===0?'p1':'p2'}">${pi===0?'第一階段':'第二階段'}</span>
          <span style="font-size:12px;color:#888;margin-left:auto">${(R.phaseDurations||[7,7])[pi]} 天</span>
        </div>
        <div class="drug-list">${R.phases[pi].drugs.map((_,di)=>renderDrugRow(pi,di)).join('')}</div>
        <button class="add-drug-btn" onclick="addDrug(${pi})">＋ 新增藥物</button>
      </div>`).join('');
  }else{
    c.innerHTML=`<div class="drug-list">${R.phases[0].drugs.map((_,di)=>renderDrugRow(0,di)).join('')}</div><button class="add-drug-btn" onclick="addDrug(0)">＋ 新增藥物</button>`;
  }
}

function renderDrugRow(pi,di){
  const e=R.phases[pi].drugs[di];
  const drug=getDB(e.drugId);
  const times=e.times||defTimes(e.freq);
  const edKey=`ph${pi}-dr${di}`;
  const isOpen=openIconEd===edKey;
  const icon=resolveIcon(e.drugId,e.icon);

  const drugOpts=DRUGS_DB.filter(d=>!d.deleted).map(d=>`<option value="${d.id}"${d.id===e.drugId?' selected':''}>${esc(d.name)}</option>`).join('');
  const subOpts=(drug?.subtypes||['未知']).map((s,i)=>`<option value="${i}"${e.subtype===i?' selected':''}>${esc(s)}</option>`).join('');
  const freqBtns=[1,2,3,4].map(f=>`<button class="freq-btn${e.freq===f?' active':''}" onclick="setFreq(${pi},${di},${f})">${f}x</button>`).join('');
  const pillOpts=PILL_COUNTS.map(v=>`<option value="${v}"${e.pills===v?' selected':''}>${v}</option>`).join('');
  const chips=TIME_SLOTS.map(sl=>`<label class="time-lbl"><input type="checkbox"${times.includes(sl.id)?' checked':''} onchange="toggleTime(${pi},${di},'${sl.id}',this.checked)"><span class="time-chip">${sl.label}</span></label>`).join('');

  let ied='';
  if(isOpen){
    const shBtns=SHAPES.map(s=>`<button class="shape-btn${icon.shape===s.id?' active':''}" onclick="setShape(${pi},${di},'${s.id}')">${s.label}</button>`).join('');
    const sw1=SW1.map(c=>`<div class="swatch${icon.color===c?' on':''}" style="background:${c}" onclick="setColor(${pi},${di},'${c}',false)"></div>`).join('');
    const sw2=SW2.map(c=>`<div class="swatch${icon.color2===c?' on':''}" style="background:${c}" onclick="setColor(${pi},${di},'${c}',true)"></div>`).join('');
    const showC2=icon.shape==='capsule';
    ied=`<div class="icon-editor">
      <div class="ctrl-lbl">形狀</div><div class="shape-opts">${shBtns}</div>
      <div class="ctrl-lbl" style="margin-top:6px">主色</div><div class="swatch-row">${sw1}</div>
      <input class="hex-input" value="${icon.color}" placeholder="#RRGGBB" oninput="setColorHex(${pi},${di},this.value,false)">
      ${showC2?`<div class="ctrl-lbl" style="margin-top:6px">副色（膠囊右半）</div><div class="swatch-row">${sw2}</div><input class="hex-input" value="${icon.color2||''}" placeholder="#RRGGBB（選填）" oninput="setColorHex(${pi},${di},this.value,true)">`:``}
      <button class="reset-icon-btn" onclick="resetIcon(${pi},${di})">恢復預設圖示</button>
    </div>`;
  }

  return`<div class="drug-row">
    <div class="drug-row-header">
      <button class="drug-icon-btn" onclick="toggleIconEd('${edKey}')" title="修改圖示">${drugIconSmall(e.drugId,e.icon)}</button>
      <select class="drug-select" onchange="changeDrug(${pi},${di},this.value)">${drugOpts}</select>
      <button class="remove-btn" onclick="removeDrug(${pi},${di})">×</button>
    </div>
    <select class="subtype-select" onchange="setSubtype(${pi},${di},parseInt(this.value))">${subOpts}</select>
    <div class="controls-row">
      <div class="ctrl-grp"><div class="ctrl-lbl">頻率</div><div class="freq-btns">${freqBtns}</div></div>
      <div class="ctrl-grp"><div class="ctrl-lbl">每次顆數</div><select class="pills-sel" onchange="setPills(${pi},${di},parseFloat(this.value))">${pillOpts}</select></div>
    </div>
    <div class="time-row"><div class="ctrl-lbl">服藥時機</div><div class="time-chips">${chips}</div></div>
    ${ied}
  </div>`;
}

// ═══════════════════════════════════════════════
//  PREVIEW RENDERING
// ═══════════════════════════════════════════════
function renderPreview(){
  const paper=document.getElementById('previewPaper');
  const name=(document.getElementById('regimenName').value||'').trim()||'療程名稱';
  const dur=document.getElementById('duration').value||'14';
  const clinic=(document.getElementById('clinicName').value||'').trim();
  const notes=(document.getElementById('notes').value||'').trim();
  const empty=R.phases.every(ph=>ph.drugs.length===0);

  const thead=`<tr><th>療程</th><th>藥物</th>${TIME_SLOTS.map(s=>`<th>${s.label}</th>`).join('')}</tr>`;
  const fmtReg=n=>esc(n).replace(/\s*\(/,'<br>(');
  const fmtDrug=(e)=>{const db=getDB(e.drugId);const nm=e.customName||db?.name||e.drugId;const dose=db?.subtypes?.[e.subtype];return dose?`<span class="drug-nm">${esc(nm)}</span><br><span class="drug-dose">(${esc(dose)})</span>`:`<span class="drug-nm">${esc(nm)}</span>`;};
  let tbody='';

  if(empty){paper.innerHTML=`<div class="preview-title">幽門桿菌治療 服藥指南</div><div class="empty-hint">請選擇組套或新增藥物</div>`;return;}

  if(!R.isPhased){
    const drugs=R.phases[0].drugs;
    drugs.forEach((e,i)=>{
      const times=e.times||defTimes(e.freq);
      const rc=i===0?`<td class="col-reg" rowspan="${drugs.length}">${fmtReg(name)}</td>`:'';
      tbody+=`<tr>${rc}<td class="col-drug">${fmtDrug(e)}</td>${TIME_SLOTS.map(sl=>times.includes(sl.id)?`<td class="col-time"><div class="pills-cell">${pillsHTML(e.drugId,e.icon,e.pills)}</div></td>`:`<td class="col-time"><div class="pills-cell"></div></td>`).join('')}</tr>`;
    });
  }else{
    const pd=R.phaseDurations||[7,7];
    const total=R.phases.reduce((a,ph)=>a+ph.drugs.length,0)+R.phases.length;
    let first=true;
    R.phases.forEach((ph,pi)=>{
      const cls=pi===0?'':'p2';
      const label=pi===0?'第一階段':'第二階段';
      if(first){tbody+=`<tr class="phase-hdr ${cls}"><td class="col-reg" rowspan="${total}">${fmtReg(name)}</td><td colspan="5">${label}　${pd[pi]} 天</td></tr>`;first=false;}
      else tbody+=`<tr class="phase-hdr ${cls}"><td colspan="5">${label}　${pd[pi]} 天</td></tr>`;
      ph.drugs.forEach(e=>{
        const times=e.times||defTimes(e.freq);
        tbody+=`<tr><td class="col-drug">${fmtDrug(e)}</td>${TIME_SLOTS.map(sl=>times.includes(sl.id)?`<td class="col-time"><div class="pills-cell">${pillsHTML(e.drugId,e.icon,e.pills)}</div></td>`:`<td class="col-time"><div class="pills-cell"></div></td>`).join('')}</tr>`;
      });
    });
  }

  // Notes (left-aligned individual lines)
  const notesH=notes?`<div class="notes-sec"><div class="notes-title">提醒事項：</div>${notes.split('\n').filter(l=>l.trim()).map(l=>`<div class="notes-line">${esc(l.trim())}</div>`).join('')}</div>`:'';

  // Drug special notes (藥品特殊囑言) in preset drug order, skip empty
  const drugOrder=[];const seen=new Set();
  R.phases.forEach(ph=>ph.drugs.forEach(e=>{if(!seen.has(e.drugId)){seen.add(e.drugId);drugOrder.push(e);}}));
  const snLines=drugOrder.map(e=>{const db=getDB(e.drugId);const n=(db?.note||'').trim();if(!n)return'';const nm=e.customName||db?.name||e.drugId;return`<div class="special-notes-line">【${esc(nm)}】${esc(n)}</div>`;}).filter(Boolean);
  const specialNotesH=snLines.length?`<div class="special-notes-sec"><div class="special-notes-title">藥品特殊囑言：</div>${snLines.join('')}</div>`:'';

  // Side effects preview (screen only, not printed) — linked to current preset
  const seBlocksStr=buildSeBlocks(false);
  const sePreviewH=seBlocksStr?`<div class="se-preview"><div class="se-preview-title">藥品副作用及注意事項</div><div class="se-preview-hint">（僅供螢幕參考，不列印）</div>${seBlocksStr}</div>`:'';

  paper.innerHTML=`<div class="preview-title">幽門桿菌治療 服藥指南</div>
    <table class="med-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <div class="icon-footnote">※ 藥品圖示可能與實際藥品外觀不同</div>
    ${notesH}
    ${specialNotesH}
    <div class="footer-bar"><span>療程天數：<strong>${esc(String(dur))}</strong> 天</span>${clinic?`<span>${esc(clinic)}</span>`:'<span></span>'}</div>
    ${sePreviewH}`;
}

// ═══════════════════════════════════════════════
//  PRESET ACTIONS
// ═══════════════════════════════════════════════
function confirmLoadPreset(id){
  if(isDirty){
    if(cloudConfigured()){if(!confirm('切換組套將放棄本次修改，確定繼續？'))return;}
    else if(activePresetId){
      if(confirm(`「${getPresetName(activePresetId)}」有未儲存的修改，是否儲存？`))saveCurrentPreset(true);
      else return;
    }else{
      if(!confirm('目前有未儲存的自訂設定，確定要切換？'))return;
    }
  }
  loadPreset(id);
}

function loadPreset(id){
  const p=allPresets.find(x=>x.id===id);if(!p)return;
  R=dc(p);addUids(R);
  lastSavedR=dc(R);
  activePresetId=id;isDirty=false;regimenNameEdited=false;openIconEd=null;
  document.getElementById('regimenName').value=p.name;
  document.getElementById('notes').value=p.notes||'';
  document.getElementById('duration').value=totalDays(p);
  const pdSel=document.getElementById('phaseDurSelect');
  document.getElementById('phasedToggle').checked=!!p.isPhased;
  pdSel.style.display=p.isPhased?'':'none';
  if(p.isPhased&&p.phaseDurations)pdSel.value=p.phaseDurations[0]+'-'+p.phaseDurations[1];
  renderPresets();renderPhaseSections();renderPreview();syncDirtyBtns();
}

function setCustomMode(){
  if(!activePresetId)return;
  if(isDirty&&!confirm('目前組套有未儲存的修改，切換至自訂模式將清空藥物清單，確定繼續？'))return;
  R={name:'',isPhased:false,duration:14,notes:'',phases:[{drugs:[]}]};
  lastSavedR=dc(R);
  activePresetId=null;isDirty=false;regimenNameEdited=false;openIconEd=null;
  document.getElementById('regimenName').value='';
  document.getElementById('duration').value='';
  document.getElementById('duration').disabled=false;
  document.getElementById('notes').value='';
  document.getElementById('phasedToggle').checked=false;
  document.getElementById('phaseDurSelect').style.display='none';
  renderPresets();renderPhaseSections();renderPreview();syncDirtyBtns();
}

function saveCurrentPreset(silent){
  if(localOnlyGuard())return;
  const p=allPresets.find(x=>x.id===activePresetId);if(!p)return;
  if(R.isPhased&&R.phases.some(ph=>ph.drugs.length===0)){alert('兩階段療程的每個階段都需要至少一種藥物。');return;}
  const snap=dc(R);
  snap.id=activePresetId;
  snap.name=p.name;
  snap.notes=document.getElementById('notes').value;
  if(!snap.isPhased)snap.duration=parseInt(document.getElementById('duration').value)||14;
  Object.assign(p,snap);
  savePresets();
  lastSavedR=dc(R);
  isDirty=false;syncDirtyBtns();syncResetBtn();
  if(!silent)alert('組套已儲存！');
}

function revertToLastSaved(){
  if(!confirm('確定要回復至上次儲存的狀態？'))return;
  R=dc(lastSavedR);addUids(R);isDirty=false;openIconEd=null;
  document.getElementById('regimenName').value=activePresetId?getPresetName(activePresetId):(R.name||'');
  document.getElementById('notes').value=R.notes||'';
  document.getElementById('duration').value=totalDays(R);
  document.getElementById('duration').disabled=!!R.isPhased;
  const pdSel=document.getElementById('phaseDurSelect');
  document.getElementById('phasedToggle').checked=!!R.isPhased;
  pdSel.style.display=R.isPhased?'':'none';
  if(R.isPhased&&R.phaseDurations)pdSel.value=R.phaseDurations[0]+'-'+R.phaseDurations[1];
  renderPhaseSections();renderPreview();syncDirtyBtns();
}

function saveAsNewPreset(){
  if(localOnlyGuard())return;
  const name=(document.getElementById('regimenName').value||'').trim();
  if(!name){alert('請先輸入療程名稱。');return;}
  if(allPresets.some(p=>p.name===name)){alert(`已有相同名稱的組套「${name}」，請使用不同名稱。`);return;}
  if(!R.phases.some(ph=>ph.drugs.length>0)){alert('請先新增至少一種藥物。');return;}
  if(R.isPhased&&R.phases.some(ph=>ph.drugs.length===0)){alert('兩階段療程的每個階段都需要至少一種藥物。');return;}
  const id='c'+Date.now();
  const np=dc(R);np.id=id;np.name=name;
  if(!np.isPhased)np.duration=parseInt(document.getElementById('duration').value)||14;
  np.notes=document.getElementById('notes').value;
  allPresets.push(np);savePresets();
  lastSavedR=dc(R);activePresetId=id;isDirty=false;
  renderPresets();syncDirtyBtns();syncResetBtn();
  alert(`已儲存為新組套：${name}`);
}

function onRegimenNameInput(){regimenNameEdited=true;R.name=document.getElementById('regimenName').value;markDirty();renderPreview();}

function clearAll(){
  R={name:'',isPhased:false,duration:14,notes:'',phases:[{drugs:[]}]};
  lastSavedR=dc(R);activePresetId=null;isDirty=false;openIconEd=null;
  document.getElementById('regimenName').value='';
  document.getElementById('duration').value=14;
  document.getElementById('notes').value='';
  document.getElementById('clinicName').value='';
  document.getElementById('phasedToggle').checked=false;
  document.getElementById('phaseDurSelect').style.display='none';
  renderPresets();renderPhaseSections();renderPreview();syncDirtyBtns();
}

// ═══════════════════════════════════════════════
//  DRUG ENTRY HANDLERS
// ═══════════════════════════════════════════════
function addDrug(pi){
  const d=DRUGS_DB.find(x=>!x.deleted)||DRUGS_DB[0];
  R.phases[pi].drugs.push({uid:nuid(),drugId:d.id,subtype:0,freq:d.dfreq||2,pills:d.dpills||1,times:defTimes(d.dfreq||2),customName:null,icon:null});
  activePresetId=null;markDirty();openIconEd=null;renderPhaseSections();renderPreview();
}
function removeDrug(pi,di){R.phases[pi].drugs.splice(di,1);markDirty();openIconEd=null;renderPhaseSections();renderPreview();}
function changeDrug(pi,di,drugId){
  const d=getDB(drugId)||DRUGS_DB[0];
  R.phases[pi].drugs[di]={...R.phases[pi].drugs[di],drugId,subtype:0,freq:d.dfreq||2,pills:d.dpills||1,times:defTimes(d.dfreq||2),customName:null,icon:null};
  markDirty();openIconEd=null;renderPhaseSections();renderPreview();
}
function setFreq(pi,di,f){R.phases[pi].drugs[di].freq=f;R.phases[pi].drugs[di].times=defTimes(f);markDirty();renderPhaseSections();renderPreview();}
function setPills(pi,di,v){R.phases[pi].drugs[di].pills=v;markDirty();renderPreview();}
function setSubtype(pi,di,v){R.phases[pi].drugs[di].subtype=v;markDirty();renderPreview();}
function toggleTime(pi,di,tid,checked){
  const t=[...(R.phases[pi].drugs[di].times||defTimes(R.phases[pi].drugs[di].freq))];
  if(checked&&!t.includes(tid))t.push(tid);
  if(!checked){const i=t.indexOf(tid);if(i!==-1)t.splice(i,1);}
  t.sort((a,b)=>TIME_ORDER.indexOf(a)-TIME_ORDER.indexOf(b));
  R.phases[pi].drugs[di].times=t;markDirty();renderPreview();
}
function setCustomName(pi,di,v){R.phases[pi].drugs[di].customName=v.trim()||null;markDirty();renderPreview();}
function toggleIconEd(key){openIconEd=openIconEd===key?null:key;renderPhaseSections();}
function ensureIcon(pi,di){if(!R.phases[pi].drugs[di].icon)R.phases[pi].drugs[di].icon=dc(resolveIcon(R.phases[pi].drugs[di].drugId,null));}
function setShape(pi,di,sh){ensureIcon(pi,di);R.phases[pi].drugs[di].icon.shape=sh;markDirty();renderPhaseSections();renderPreview();}
function setColor(pi,di,c,isSec){ensureIcon(pi,di);if(isSec)R.phases[pi].drugs[di].icon.color2=c;else R.phases[pi].drugs[di].icon.color=c;markDirty();renderPhaseSections();renderPreview();}
function setColorHex(pi,di,v,isSec){if(/^#[0-9a-fA-F]{6}$/.test(v))setColor(pi,di,v,isSec);}
function resetIcon(pi,di){R.phases[pi].drugs[di].icon=null;markDirty();renderPhaseSections();renderPreview();}

function togglePhased(){
  R.isPhased=document.getElementById('phasedToggle').checked;
  const pdSel=document.getElementById('phaseDurSelect');
  const durEl=document.getElementById('duration');
  if(R.isPhased){
    if(!R.phaseDurations)R.phaseDurations=[7,7];
    if(R.phases.length<2)R.phases.push({drugs:[]});
    pdSel.style.display='';
    pdSel.value=R.phaseDurations[0]+'-'+R.phaseDurations[1];
    durEl.value=R.phaseDurations[0]+R.phaseDurations[1];
    durEl.disabled=true;
  }else{
    pdSel.style.display='none';
    durEl.disabled=false;
    R.duration=parseInt(durEl.value)||14;
  }
  markDirty();openIconEd=null;renderPhaseSections();renderPreview();
}

function setPhaseDur(val){
  const[a,b]=val.split('-').map(Number);
  R.phaseDurations=[a,b];
  document.getElementById('duration').value=a+b;
  markDirty();renderPhaseSections();renderPreview();
}

// ═══════════════════════════════════════════════
//  PRESET MANAGER
// ═══════════════════════════════════════════════
function toggleMgr(){
  if(localOnlyGuard())return;if(showMgr)closeMgr();else openMgr();}

function openMgr(){
  showMgr=true;
  document.getElementById('mgrPanel').classList.add('open');
  document.getElementById('mainContent').style.display='none';
  document.getElementById('mgrToggleBtn').textContent='組套管理 ▴';
  mgrOrigOrder=allPresets.map(p=>p.id);
  mgrOrigNames=Object.fromEntries(allPresets.map(p=>[p.id,p.name]));
  mgrWorkOrder=[...mgrOrigOrder];
  mgrPendNames={};mgrPendDel=new Set();mgrMode=null;mgrDirty=false;
  renderPresetMgr();
}

function closeMgr(){
  if(mgrDirty){
    const ans=confirm('組套管理有未儲存的修改，是否儲存？');
    if(ans)mgrSave(true);
    else return;
  }
  showMgr=false;
  document.getElementById('mgrPanel').classList.remove('open');
  document.getElementById('mainContent').style.display='';
  document.getElementById('mgrToggleBtn').textContent='組套管理 ▾';
}

function renderPresetMgr(){
  const list=document.getElementById('mgrList');
  let hintText='';
  if(mgrMode==='drag')hintText='排序模式：儲存前無法修改名稱';
  else if(mgrMode==='edit')hintText='編輯模式：儲存前無法進行排序';
  document.getElementById('mgrModeHint').textContent=hintText;

  list.innerHTML=mgrWorkOrder.map((id,idx)=>{
    const origIdx=mgrOrigOrder.indexOf(id);
    const isDel=mgrPendDel.has(id);
    const isRenamed=mgrPendNames[id]!==undefined&&mgrPendNames[id]!==mgrOrigNames[id];
    const isMoved=mgrMode==='drag'&&origIdx!==idx;
    const curName=mgrPendNames[id]!==undefined?mgrPendNames[id]:mgrOrigNames[id];
    const rowCls=isMoved?'mgr-row reordered':'mgr-row';
    const inputCls=isDel?'mgr-name-input deleted':isRenamed?'mgr-name-input modified':'mgr-name-input';
    return`<div class="${rowCls}" id="mgr-row-${idx}" draggable="true"
      ondragstart="mgrDragStart(event,${idx})"
      ondragover="mgrDragOver(event,${idx})"
      ondrop="mgrDrop(event,${idx})"
      ondragend="mgrDragEnd()">
      <span class="mgr-drag-handle">⠿</span>
      <input type="text" class="${inputCls}" value="${esc(curName)}"
        data-id="${id}"
        oninput="mgrNameInput('${id}',this.value)"
        ${isDel?'disabled':''}>
      <button class="mgr-del-btn${isDel?' active':''}" onclick="mgrToggleDel('${id}')" title="${isDel?'取消刪除':'刪除'}">
        ${isDel?'↩':'🗑'}
      </button>
    </div>`;
  }).join('');
  syncMgrBtns();
}

function mgrNameInput(id,val){
  if(mgrMode==='drag'){alert('排序模式進行中，請先儲存或回復排序，再修改名稱。');renderPresetMgr();return;}
  mgrMode='edit';
  if(val===mgrOrigNames[id])delete mgrPendNames[id];
  else mgrPendNames[id]=val;
  mgrDirty=Object.keys(mgrPendNames).length>0||mgrPendDel.size>0;
  const inp=document.querySelector(`[data-id="${id}"]`);
  if(inp){const isRen=mgrPendNames[id]!==undefined&&mgrPendNames[id]!==mgrOrigNames[id];inp.className='mgr-name-input'+(isRen?' modified':'');}
  syncMgrBtns();
}

function mgrToggleDel(id){
  if(mgrMode==='drag'){alert('排序模式進行中，請先儲存或回復排序，再進行刪除。');return;}
  mgrMode='edit';
  if(mgrPendDel.has(id))mgrPendDel.delete(id);else mgrPendDel.add(id);
  mgrDirty=Object.keys(mgrPendNames).length>0||mgrPendDel.size>0;
  renderPresetMgr();
}

function mgrDragStart(e,idx){
  if(mgrMode==='edit'){alert('名稱/刪除編輯進行中，請先儲存或回復，再進行排序。');e.preventDefault();return;}
  mgrDragSrc=idx;e.dataTransfer.effectAllowed='move';
}
function mgrDragOver(e,idx){e.preventDefault();document.querySelectorAll('.mgr-row').forEach(r=>r.classList.remove('drag-over'));if(mgrDragSrc!==null&&mgrDragSrc!==idx){const rows=document.querySelectorAll('.mgr-row');if(rows[idx])rows[idx].classList.add('drag-over');}}
function mgrDrop(e,targetIdx){
  e.preventDefault();
  if(mgrDragSrc===null||mgrDragSrc===targetIdx){mgrDragEnd();return;}
  mgrMode='drag';
  const o=[...mgrWorkOrder];const[m]=o.splice(mgrDragSrc,1);o.splice(targetIdx,0,m);
  mgrWorkOrder=o;mgrDirty=true;mgrDragEnd();renderPresetMgr();
}
function mgrDragEnd(){mgrDragSrc=null;document.querySelectorAll('.mgr-row').forEach(r=>r.classList.remove('drag-over'));}

function mgrSave(silent){
  for(const[id,name]of Object.entries(mgrPendNames)){
    const p=allPresets.find(x=>x.id===id);if(p&&name.trim())p.name=name.trim();
  }
  for(const id of mgrPendDel){
    const i=allPresets.findIndex(p=>p.id===id);if(i!==-1){allPresets.splice(i,1);if(activePresetId===id){activePresetId=null;isDirty=false;}}
  }
  const surviving=mgrWorkOrder.filter(id=>!mgrPendDel.has(id));
  allPresets.sort((a,b)=>{const ia=surviving.indexOf(a.id),ib=surviving.indexOf(b.id);return(ia<0?999:ia)-(ib<0?999:ib);});
  savePresets();mgrDirty=false;mgrMode=null;
  syncMgrBtns();syncResetBtn();
  renderPresets();renderPresetMgr();
  if(!silent)alert('組套設定已儲存！');
}

function mgrRevert(){
  mgrWorkOrder=[...mgrOrigOrder];mgrPendNames={};mgrPendDel=new Set();mgrMode=null;mgrDirty=false;
  renderPresetMgr();
}

// ═══════════════════════════════════════════════
//  DRUG MANAGER PANEL (C2/C3/C4/C5)
// ═══════════════════════════════════════════════
let dmDirty=false;

function openDrugMgr(){
  if(cloudConfigured())return HpCloud.openDrugs();
  dmOrigData=dc(DRUGS_DB);dmData=dc(DRUGS_DB);dmOpenIdx=null;dmDirty=false;
  renderDmList();syncDmBtns();
  document.getElementById('drugPanel').classList.add('open');
  document.getElementById('mainContent').style.display='none';
}
function closeDrugMgr(){
  document.getElementById('drugPanel').classList.remove('open');
  document.getElementById('mainContent').style.display='';
  dmData=null;dmOrigData=null;dmOpenIdx=null;dmDirty=false;
}
function revertDrugMgr(){
  dmData=dc(dmOrigData);dmOpenIdx=null;dmDirty=false;
  syncDmBtns();renderDmList();
}
function syncDmBtns(){
  document.getElementById('dmSaveBtn').style.display=dmDirty?'':'none';
  document.getElementById('dmRevertBtn').style.display=dmDirty?'':'none';
}

function renderDmList(){
  const el=document.getElementById('dmList');
  el.innerHTML=dmData.map((d,i)=>{
    const isOpen=dmOpenIdx===i;
    const sub=(d.subtypes||[]).map((s,si)=>`<div class="dm-subtype-row">
      <input class="dm-subtype-input" value="${esc(s)}" ${cloudConfigured()&&si<(dmOrigData.find(x=>x.id===d.id)?.subtypes.length||0)?'readonly':''} oninput="dmEditSubtype(${i},${si},this.value)">
      <button class="dm-subtype-del" onclick="dmDelSubtype(${i},${si})">×</button>
    </div>`).join('');
    const shBtns=SHAPES.map(s=>`<button class="shape-btn${d.shape===s.id?' active':''}" onclick="dmSetShape(${i},'${s.id}')">${s.label}</button>`).join('');
    const sw1=SW1.map(c=>`<div class="swatch${d.color===c?' on':''}" style="background:${c}" onclick="dmSetColor(${i},'${c}',false)"></div>`).join('');
    const sw2=SW2.map(c=>`<div class="swatch${(d.color2||'')=== c?' on':''}" style="background:${c}" onclick="dmSetColor(${i},'${c}',true)"></div>`).join('');
    const showC2=d.shape==='capsule';
    const delCls=d.deleted?'deleted':'';
    return`<div class="dm-drug-row ${delCls}" id="dm-row-${i}">
      <div class="dm-drug-header${d.deleted?' deleted':''}" onclick="dmToggleOpen(${i})">
        <div style="flex-shrink:0">${drugIconSmall(d.id,null)}</div>
        <input class="dm-drug-name-input" value="${esc(d.name)}" onclick="event.stopPropagation()" oninput="dmEditName(${i},this.value)">
        <span class="dm-expand-icon">${isOpen?'▲':'▼'}</span>
        <button style="margin-left:6px;flex-shrink:0" class="btn btn-sm${d.deleted?' warn':'danger'}" onclick="event.stopPropagation();dmToggleDel(${i})">${d.deleted?'恢復':'刪除'}</button>
      </div>
      ${isOpen?`<div class="dm-drug-body open">
        <div class="dm-section-label">劑量選項</div>
        <div class="dm-subtypes">${sub}</div>
        <button class="dm-add-subtype-btn" onclick="dmAddSubtype(${i})">＋ 新增劑量</button>
        <div class="dm-section-label">預設圖示形狀</div>
        <div class="shape-opts">${shBtns}</div>
        <div class="dm-section-label">主色</div>
        <div class="swatch-row">${sw1}</div>
        <input class="hex-input" value="${d.color}" placeholder="#RRGGBB" oninput="dmSetColorHex(${i},this.value,false)">
        ${showC2?`<div class="dm-section-label">副色（膠囊右半）</div><div class="swatch-row">${sw2}</div><input class="hex-input" value="${d.color2||''}" placeholder="#RRGGBB（選填）" oninput="dmSetColorHex(${i},this.value,true)">`:``}
        <div class="dm-section-label">藥品特殊囑言</div>
        <textarea class="dm-note-ta" oninput="dmEditNote(${i},this.value);autoExpandTa(this)" placeholder="服藥時的特殊提醒事項（選填）">${esc(d.note||'')}</textarea>
      </div>`:''}
    </div>`;
  }).join('');
}

function dmToggleOpen(i){dmOpenIdx=dmOpenIdx===i?null:i;renderDmList();}
function dmEditName(i,v){if(dmData[i]){dmData[i].name=v;dmDirty=true;syncDmBtns();}}
function dmEditSubtype(i,si,v){if(dmData[i]){dmData[i].subtypes[si]=v;dmDirty=true;syncDmBtns();}}
function dmDelSubtype(i,si){
  if(!dmData[i])return;
  if(cloudConfigured()&&si<(dmOrigData.find(d=>d.id===dmData[i].id)?.subtypes.length||0)){alert('既有規格不能刪除，可新增規格。');return;}
  const used=allPresets.filter(p=>p.phases.some(ph=>ph.drugs.some(d=>d.drugId===dmData[i].id&&(d.subtype||0)===si)));
  if(used.length>0){alert(`以下組套正在使用「${dmData[i].name}」此劑量選項，無法刪除：\n${used.map(p=>p.name).join('\n')}`);return;}
  dmData[i].subtypes.splice(si,1);dmDirty=true;syncDmBtns();renderDmList();
}
function dmAddSubtype(i){if(dmData[i]){dmData[i].subtypes.push('');dmDirty=true;syncDmBtns();renderDmList();}}
function dmSetShape(i,sh){if(dmData[i]){dmData[i].shape=sh;dmDirty=true;syncDmBtns();renderDmList();}}
function dmSetColor(i,c,isSec){if(dmData[i]){if(isSec)dmData[i].color2=c;else dmData[i].color=c;dmDirty=true;syncDmBtns();renderDmList();}}
function dmSetColorHex(i,v,isSec){if(/^#[0-9a-fA-F]{6}$/.test(v))dmSetColor(i,v,isSec);}
function dmToggleDel(i){
  if(!dmData[i])return;
  if(cloudConfigured()&&dmOrigData.some(d=>d.id===dmData[i].id)){alert('共用既有藥品不能刪除，以保護其他使用者的組套。');return;}
  if(dmData[i].deleted){
    dmData[i].deleted=false;dmDirty=true;syncDmBtns();renderDmList();return;
  }
  const used=allPresets.filter(p=>p.phases.some(ph=>ph.drugs.some(d=>d.drugId===dmData[i].id)));
  if(used.length>0){alert(`以下組套正在使用「${dmData[i].name}」，無法刪除：\n${used.map(p=>p.name).join('\n')}`);return;}
  const isNew=!dmOrigData.some(d=>d.id===dmData[i].id);
  if(isNew){dmData.splice(i,1);if(dmOpenIdx===i)dmOpenIdx=null;else if(dmOpenIdx>i)dmOpenIdx--;}
  else{dmData[i].deleted=true;}
  dmDirty=true;syncDmBtns();renderDmList();
}
function dmAddDrug(){
  dmData.push({id:'drug_'+Date.now(),name:'',subtypes:[''],shape:'round',color:'#90A4AE',color2:null,dfreq:2,dpills:1,deleted:false});
  dmOpenIdx=dmData.length-1;dmDirty=true;syncDmBtns();renderDmList();
}
function saveDrugMgr(silent){
  if(cloudConfigured())return HpCloud.saveDrugs();
  for(const d of dmData){
    if(d.deleted)continue;
    if(!(d.name||'').trim()){alert('藥品名稱不可為空，請填寫後再儲存。');return false;}
    if(!d.subtypes||d.subtypes.length===0){alert(`「${d.name||'（未命名）'}」需要至少一個劑量選項。`);return false;}
    if(d.subtypes.some(s=>!(s||'').trim())){alert(`「${d.name}」有空白的劑量選項，請填寫後再儲存。`);return false;}
  }
  DRUGS_DB=dc(dmData.filter(d=>!d.deleted));saveDrugs();
  dmData=dc(DRUGS_DB);dmOrigData=dc(DRUGS_DB);dmOpenIdx=null;dmDirty=false;
  syncDmBtns();syncResetBtn();renderPhaseSections();renderPresets();
  if(!silent)alert('藥品設定已儲存！');
  return true;
}
function cancelDrugMgr(){
  if(cloudConfigured()){
    if(dmDirty){if(confirm('藥品設定有修改，是否儲存到雲端？'))return HpCloud.saveDrugs();return;}
    closeDrugMgr();return;
  }
  if(dmDirty){
    const ans=confirm('藥品管理有未儲存的修改，是否儲存？');
    if(ans){if(!saveDrugMgr(true))return;closeDrugMgr();return;}
    else return;
  }
  closeDrugMgr();
}

// ═══════════════════════════════════════════════
//  DRUG MANAGER — NOTE FIELD
// ═══════════════════════════════════════════════
function dmEditNote(i,v){if(dmData[i]){dmData[i].note=v;dmDirty=true;syncDmBtns();}}
function autoExpandTa(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}

// ═══════════════════════════════════════════════
//  SIDE EFFECTS OVERLAY
// ═══════════════════════════════════════════════
function buildSeBlocks(allDrugs){
  const entries=allDrugs
    ? DRUGS_DB.filter(d=>!d.deleted).map(d=>({drugId:d.id,customName:null}))
    : (()=>{const order=[];const seen=new Set();R.phases.forEach(ph=>ph.drugs.forEach(e=>{if(!seen.has(e.drugId)){seen.add(e.drugId);order.push(e);}}));return order;})();
  return entries.map(e=>{
    const se=DRUG_SIDE_EFFECTS[e.drugId];if(!se)return'';
    const db=getDB(e.drugId);const nm=e.customName||db?.name||e.drugId;
    const sub=se.subtitle?`<div style="font-size:11px;color:#888;font-style:italic;margin-bottom:6px">${se.subtitle}</div>`:'';
    const sects=se.sections.map(s=>`<div class="se-sub">▸ ${s.title}</div>`+s.items.map((it,idx)=>`<div class="se-item">${idx+1}. ${it}</div>`).join('')).join('');
    return`<div class="se-drug-block"><div class="se-drug-hdr">${esc(se.name||nm)}</div>${sub}${sects}</div>`;
  }).filter(Boolean).join('');
}
function openSeOverlay(){
  const overlay=document.getElementById('seOverlay');
  const content=document.getElementById('seOverlayContent');
  // Show ALL drugs regardless of current preset
  const blocks=buildSeBlocks(true);
  content.innerHTML=blocks||'<p style="color:#bbb;font-size:14px;text-align:center;padding:40px 0">尚無藥品資料</p>';
  overlay.classList.add('open');
  document.querySelector('.input-panel').classList.add('main-locked');
}
function closeSeOverlay(){
  document.getElementById('seOverlay').classList.remove('open');
  document.querySelector('.input-panel').classList.remove('main-locked');
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
// View switching never reloads a regimen or changes prescription data.
const mobilePaneScroll={edit:0,previewTop:0,previewLeft:0};
function setMobilePreview(show){
  const app=document.querySelector('.app');
  const editor=document.querySelector('.input-panel');
  const preview=document.getElementById('previewPanel');
  const wasPreview=app.classList.contains('mobile-preview');
  if(wasPreview===show)return;
  if(show){mobilePaneScroll.edit=editor.scrollTop;}
  else{mobilePaneScroll.previewTop=preview.scrollTop;mobilePaneScroll.previewLeft=preview.scrollLeft;}
  app.classList.toggle('mobile-preview',show);
  document.getElementById('mobilePreviewBtn').hidden=show;
  document.getElementById('mobilePreviewBtn').setAttribute('aria-expanded',String(show));
  document.getElementById('mobileEditBtn').hidden=!show;
  document.getElementById('mobilePrintBtn').hidden=!show;
  if(show){preview.scrollTop=mobilePaneScroll.previewTop;preview.scrollLeft=mobilePaneScroll.previewLeft;document.getElementById('mobileEditBtn').focus({preventScroll:true});}
  else{editor.scrollTop=mobilePaneScroll.edit;document.getElementById('mobilePreviewBtn').focus({preventScroll:true});}
}
addUids(R);
document.getElementById('clinicName').addEventListener('input',renderPreview);
loadPreset(allPresets[0]?.id);
syncResetBtn();
