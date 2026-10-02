const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function boot(seed={}) {
  const saved=new Map(Object.entries(seed));
  const ctx=vm.createContext({localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}});
  for(const path of ['js/defaults.js','js/storage.js']) vm.runInContext(fs.readFileSync(path,'utf8'),ctx);
  return {saved,run:s=>vm.runInContext(s,ctx)};
}
test('factory strengths and requested regimens',()=>{
 const {run}=boot();
 assert.equal(run("DEFAULT_DRUGS.find(d=>d.id==='tetracycline').subtypes.join('|')"),'Tetracycline 500mg|Tetracycline 250mg');
 assert.equal(run("DEFAULT_PRESETS.find(p=>p.id==='bqt').phases[0].drugs.slice(1).map(d=>d.freq).join(',')"),'3,3,3');
 assert.equal(run("JSON.stringify(DEFAULT_PRESETS.find(p=>p.id==='pcab_dual').phases[0].drugs[1])"),JSON.stringify({drugId:'amoxicillin',subtype:0,freq:3,pills:3,times:null,customName:null,icon:null}));
});
test('saved v7 custom regimens survive; writes use legacy keys',()=>{
 const custom={id:'mine',name:'Custom',phases:[{drugs:[]}]};
 const {run,saved}=boot({hp_presets_v7:JSON.stringify([custom])});
 assert.equal(run('allPresets[0].id'),'mine');
 run('savePresets();saveDrugs()');
 assert.equal(JSON.parse(saved.get('hp_presets_v7'))[0].name,'Custom');
 assert.ok(saved.has('hp_drugs_v4'));
});
test('v6 custom migration and corrupt data fallback',()=>{
 const {run}=boot({hp_presets_v6:JSON.stringify([{id:'mine',phases:[{drugs:[]}]}]),hp_drugs_v4:'broken'});
 assert.equal(run("allPresets.at(-1).id"),'mine');
 assert.equal(run('DRUGS_DB.length'),10);
});
test('adapter can be replaced without changing UI persistence functions',()=>{
 const {run}=boot();
 assert.equal(run("let recorded;HpStorage.setAdapter({read:()=>null,write:(k,v)=>recorded=k});savePresets();recorded"),'hp_presets_v7');
});
