const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(){const c=vm.createContext({window:{},TextEncoder,structuredClone,DRUGS_DB:[],dc:x=>JSON.parse(JSON.stringify(x)),defTimes:()=>['breakfast']});for(const f of ['defaults','transfer','cloud'])vm.runInContext(fs.readFileSync(`js/${f}.js`,'utf8').replace('HpCloud.start();',''),c);vm.runInContext('DRUGS_DB=DEFAULT_DRUGS',c);return s=>vm.runInContext(s,c);}
test('backup round trip includes saved configs, excludes UI and patient fields',()=>{
 const run=boot();const data=JSON.parse(run("JSON.stringify(HpTransfer.parse(JSON.stringify(HpTransfer.build(DRUGS_DB,[{...DEFAULT_PRESETS[0],patientName:'Private',clinicName:'Clinic',uid:9}]))))"));
 assert.equal(data.schemaVersion,1);assert.equal(data.personalRegimens[0].patientName,undefined);assert.equal(data.personalRegimens[0].uid,undefined);
});
test('import resolves strength by text rather than source subtype index',()=>{
 const run=boot();assert.equal(run("(()=>{const source=structuredClone(DRUGS_DB);source.find(x=>x.id==='tetracycline').subtypes.reverse();const p=structuredClone(DEFAULT_PRESETS[0]);return HpTransfer.prepare([p],source)[0].phases[0].drugs[2].subtype;})()"),1);
});
test('missing catalog entries, duplicate names, oversized and unknown versions reject',()=>{
 const run=boot();
 for(const code of ["HpTransfer.prepare([DEFAULT_PRESETS[0]],DRUGS_DB,DRUGS_DB.filter(x=>x.id!=='tetracycline'))","HpTransfer.prepare([DEFAULT_PRESETS[0],DEFAULT_PRESETS[0]],DRUGS_DB)","HpTransfer.parse(' '.repeat(2*1024*1024+1))","HpTransfer.parse(JSON.stringify({format:'hp-regimen-settings',schemaVersion:99}))"]){assert.throws(()=>run(code));}
});
test('catalog merge preserves existing indexes and appends backup strengths',()=>{
 const run=boot();assert.equal(run("(()=>{const incoming=structuredClone(DRUGS_DB);incoming.find(x=>x.id==='tetracycline').subtypes=['Tetracycline 250mg','Tetracycline 125mg'];return HpTransfer.mergeCatalog(incoming,DRUGS_DB).find(x=>x.id==='tetracycline').subtypes.join('|');})()"),'Tetracycline 500mg|Tetracycline 250mg|Tetracycline 125mg');
});
