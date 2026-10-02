/* Configuration-only backups: no current prescription, credentials or clinic field. */
const HpTransfer=(()=>{
  const MAX_BYTES=2*1024*1024;
  function drug(raw){
    if(!raw||typeof raw.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id))throw Error('藥品 ID 格式不正確');
    const str=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('藥品文字格式不正確');return v;};
    const color=v=>{if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('藥品顏色格式不正確');return v;};
    const name=str(raw.name,200);if(!name.trim())throw Error('藥品名稱不可為空');
    if(!Array.isArray(raw.subtypes)||raw.subtypes.length<1||raw.subtypes.length>30)throw Error('藥品需有 1–30 個規格');
    const subtypes=raw.subtypes.map(s=>{s=str(s,200);if(!s.trim())throw Error('藥品規格不可為空');return s;});
    if(new Set(subtypes).size!==subtypes.length)throw Error('藥品規格不可重複');
    if(!SHAPES.some(s=>s.id===raw.shape))throw Error('藥品形狀格式不正確');
    return {id:raw.id,name,subtypes,shape:raw.shape,color:color(raw.color),color2:raw.color2?color(raw.color2):null,note:str(raw.note||'',5000)};
  }
  function catalog(items){
    if(!Array.isArray(items)||items.length<1||items.length>200)throw Error('藥品資料數量不正確');
    const clean=items.map(drug);if(new Set(clean.map(d=>d.id)).size!==clean.length)throw Error('藥品 ID 不可重複');return clean;
  }
  function prepare(regimens,sourceDrugs,targetDrugs=DRUGS_DB,allowDuplicateNames=false){
    if(!Array.isArray(regimens)||regimens.length>100)throw Error('每次最多匯入 100 個組套');
    const source=catalog(sourceDrugs),target=catalog(targetDrugs);
    const names=new Set();
    return regimens.map(raw=>{
      const p=dc(raw);if(!Array.isArray(p.phases))throw Error('組套格式不正確');
      p.phases.forEach(ph=>{if(!Array.isArray(ph.drugs)||ph.drugs.length>30)throw Error('組套藥品數量不正確');ph.drugs.forEach(d=>{
        const strength=d.strength||source.find(x=>x.id===d.drugId)?.subtypes[d.subtype];
        const db=target.find(x=>x.id===d.drugId),index=db?.subtypes.indexOf(strength);
        if(index===undefined||index<0)throw Error(`缺少藥品規格：${strength||d.drugId}。請先由管理者補齊藥品檔。`);
        d.subtype=index;
      });});
      const clean=HpCloud.template(p,target);
      if(!clean.name.trim())throw Error('組套名稱不可為空');
      if(!allowDuplicateNames&&names.has(clean.name))throw Error(`匯入檔有重複組套名稱：${clean.name}`);names.add(clean.name);
      return clean;
    });
  }
  function parse(raw){
    if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('備份檔不得超過 2 MB');
    const data=JSON.parse(raw);
    if(!data||data.format!=='hp-regimen-settings'||data.schemaVersion!==1)throw Error('不支援的備份格式或版本');
    data.drugs=catalog(data.drugs);
    if(!Array.isArray(data.personalRegimens)||data.personalRegimens.length>100)throw Error('個人組套格式不正確');
    return data;
  }
  function build(drugs,personal,system=[]){
    const cleanDrugs=catalog(drugs);
    return {format:'hp-regimen-settings',schemaVersion:1,exportedAt:new Date().toISOString(),drugs:cleanDrugs,
      personalRegimens:prepare(personal,cleanDrugs,cleanDrugs,true),systemRegimens:prepare(system,cleanDrugs,cleanDrugs,true)};
  }
  function download(data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`HpRegimen-settings-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
  }
  function mergeCatalog(imported,current){
    const backup=catalog(imported),existing=catalog(current);
    return [...existing.map(d=>{
      const from=backup.find(x=>x.id===d.id);return from?{...from,subtypes:[...d.subtypes,...from.subtypes.filter(s=>!d.subtypes.includes(s))]}:d;
    }),...backup.filter(d=>!existing.some(x=>x.id===d.id))];
  }
  return {drug,catalog,prepare,parse,build,download,mergeCatalog,MAX_BYTES};
})();
