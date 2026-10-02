const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function boot(config={}){
 const elements=new Map(),saved=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},classList:{add(){},remove(){}},addEventListener(){},innerHTML:'',textContent:''});return elements.get(id);};
 const ctx=vm.createContext({window:{HP_CLOUD_CONFIG:config},document:{getElementById:element,querySelector:element},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},alert(){},confirm:()=>true});
 for(const file of ['defaults','storage','app','cloud'])vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8').replace('HpCloud.start();',''),ctx);
 return {run:s=>vm.runInContext(s,ctx),elements,saved};
}
test('full app initialization and PCAB/BQT preview generation',()=>{
 const {run,elements}=boot();
 assert.match(elements.get('presetGrid').innerHTML,/鉍劑四合一/);
 run("loadPreset('pcab_dual')");assert.match(elements.get('previewPaper').innerHTML,/Amoxicillin 250mg/);
 assert.equal(run("R.phases[0].drugs[1].pills"),3);
 run("loadPreset('bqt')");assert.equal(run("R.phases[0].drugs.slice(1).every(d=>d.freq===3)"),true);
});
test('cloud mode blocks legacy storage writes and hides ambiguous save',()=>{
 const {run,elements,saved}=boot({url:'https://test.supabase.co',publishableKey:'public'});
 run('saveCurrentPreset();saveAsNewPreset();resetToDefaults()');
 assert.equal(saved.size,0);assert.equal(elements.get('saveModBtn').style.display,'none');
});
