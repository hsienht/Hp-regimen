const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function boot(){
 const ctx=vm.createContext({window:{},DRUGS_DB:[],defTimes:f=>['breakfast'],structuredClone});
 vm.runInContext(fs.readFileSync('js/defaults.js','utf8'),ctx);
 vm.runInContext('DRUGS_DB=DEFAULT_DRUGS',ctx);
 vm.runInContext(fs.readFileSync('js/cloud.js','utf8'),ctx);
 return s=>vm.runInContext(s,ctx);
}
test('unconfigured cloud does not request DOM or network',()=>assert.equal(boot()('HpCloud.enabled'),false));
test('explicit template serialization excludes clinic/patient/metadata and UI IDs',()=>{
 const run=boot();const result=JSON.parse(run("JSON.stringify(HpCloud.template({...DEFAULT_PRESETS[0],patientName:'Private',clinicName:'Clinic',_cloud:{id:'x'},uid:42}))"));
 assert.deepEqual(Object.keys(result).sort(),['duration','isPhased','name','notes','phases']);
 assert.equal(result.phases[0].drugs[2].strength,'Tetracycline 500mg');
 assert.equal(result.phases[0].drugs[2].freq,3);
});
test('reject invalid dose, phase, duration and icon payloads',()=>{
 const run=boot();
 for(const mutation of ["p.duration=0","p.phases[0].drugs[0].pills=99","p.phases[0].drugs[0].subtype=99","p.phaseDurations=[];p.isPhased=true","p.phases[0].drugs[0].icon={shape:'round',color:'red;position:fixed'}"]){
 assert.throws(()=>run(`(()=>{const p=structuredClone(DEFAULT_PRESETS[0]);${mutation};return HpCloud.template(p)})()`));
 }
});
test('PCAB dual serializes 750mg as three 250mg capsules TID',()=>{
 const run=boot();const data=JSON.parse(run("JSON.stringify(HpCloud.template(DEFAULT_PRESETS.find(x=>x.id==='pcab_dual')).phases[0].drugs[1])"));
 assert.equal(data.strength,'Amoxicillin 250mg');assert.equal(data.pills,3);assert.equal(data.freq,3);
});
