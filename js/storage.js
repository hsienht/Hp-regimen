// V3.0A local adapter. Cloud authentication and synchronization are deferred.
// Only configuration collections belong here; current prescription R stays in memory.
const HpStorage = (() => {
  let adapter = {
    read(key) { return localStorage.getItem(key); },
    write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };
  return {
    read(key) { return adapter.read(key); },
    write(key, value) { return adapter.write(key, value); },
    setAdapter(next) {
      if (!next || typeof next.read !== 'function' || typeof next.write !== 'function') {
        throw new TypeError('Storage adapter requires read and write methods');
      }
      adapter = next;
    }
  };
})();

// ═══════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════
function dc(x){return JSON.parse(JSON.stringify(x));}

let DRUGS_DB=(()=>{try{const s4=HpStorage.read('hp_drugs_v4');if(s4){const d=JSON.parse(s4);if(Array.isArray(d)&&d.length)return d;}const sold=HpStorage.read('hp_drugs_v3')||HpStorage.read('hp_drugs_v2');if(sold){const d=JSON.parse(sold);if(Array.isArray(d)&&d.length){d.forEach(dr=>{const def=DEFAULT_DRUGS.find(x=>x.id===dr.id);if(def)dr.note=def.note;});// Re-sort to match DEFAULT_DRUGS order
const sorted=DEFAULT_DRUGS.map(def=>d.find(dr=>dr.id===def.id)).filter(Boolean);d.filter(dr=>!DEFAULT_DRUGS.find(def=>def.id===dr.id)).forEach(dr=>sorted.push(dr));return sorted;}}}catch{}return dc(DEFAULT_DRUGS);})();
let allPresets=(()=>{try{const s7=HpStorage.read('hp_presets_v7');if(s7){const p=JSON.parse(s7);if(Array.isArray(p)&&p.length)return p;}// Migrate: use fresh defaults, append custom presets from v6
const base=dc(DEFAULT_PRESETS);const builtinIds=new Set(base.map(x=>x.id));const s6=HpStorage.read('hp_presets_v6');if(s6){const old=JSON.parse(s6);if(Array.isArray(old))old.forEach(p=>{if(!builtinIds.has(p.id))base.push(p);});}return base;}catch{}return dc(DEFAULT_PRESETS);})();

function saveDrugs(){HpStorage.write('hp_drugs_v4',DRUGS_DB);}
function savePresets(){HpStorage.write('hp_presets_v7',allPresets);}

// Migrate existing localStorage data (drug list cleanup)
(function(){
  let pChanged=false;
  if(pChanged)savePresets();

  let dChanged=false;
  ['tinidazole','furazolidone'].forEach(rmId=>{const i=DRUGS_DB.findIndex(d=>d.id===rmId);if(i!==-1){DRUGS_DB.splice(i,1);dChanged=true;}});
  const amox=DRUGS_DB.find(d=>d.id==='amoxicillin');
  if(amox){const before=amox.subtypes.length;amox.subtypes=amox.subtypes.filter(s=>s!=='Amoxicillin 1000mg');if(amox.subtypes.length!==before)dChanged=true;}
  // Migrate drug subtype display names (remove brand names)
  const subtypeRenames={'Vonoprazan 20mg (Takecab)':'Vonoprazan 20mg','Bismuth Subcitrate 120mg (De-Nol)':'Bismuth Subcitrate 120mg','Tetracycline HCl 500mg':'Tetracycline 500mg','Clarithromycin 500mg (Klaricid)':'Clarithromycin 500mg','Levofloxacin 500mg (Cravit)':'Levofloxacin 500mg'};
  DRUGS_DB.forEach(d=>{if(d.subtypes)d.subtypes=d.subtypes.map(s=>{if(subtypeRenames[s]){dChanged=true;return subtypeRenames[s];}return s;});});
  // Migrate PPI subtype 0→3 (Omeprazole→Rabeprazole/Pariet) in all saved presets
  allPresets.forEach(p=>{p.phases.forEach(ph=>{ph.drugs.forEach(d=>{if(d.drugId==='ppi'&&d.subtype===0){d.subtype=3;pChanged=true;}});});});
  // Ensure all drugs have a note field (defensive)
  DRUGS_DB.forEach(d=>{if(d.note===undefined){d.note='';dChanged=true;}});
  if(dChanged)saveDrugs();
})();
