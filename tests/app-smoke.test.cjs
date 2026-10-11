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
test('categorized selector preserves complete names and marks system/personal sources',()=>{
 const {run,elements}=boot();
 run("allPresets.push({...dc(allPresets[0]),id:'u:mine',name:'我的組套（10 天）',_cloud:{scope:'user'}});selectPresetCategory('all')");
 assert.match(elements.get('presetGrid').innerHTML,/我的組套（10 天）（個人）/);
 run("selectPresetCategory('system')");assert.doesNotMatch(elements.get('presetGrid').innerHTML,/<option[^>]*>我的組套/);
 run("selectPresetCategory('personal')");assert.match(elements.get('presetGrid').innerHTML,/我的組套（10 天）（個人）/);
});
test('favorites persist per project/account and preserve the current prescription',()=>{
 const {run,elements}=boot();
 run("window.HP_CLOUD_CONFIG={url:'https://test.supabase.co'};window.hpFavoriteAccount='account-a';const before=JSON.stringify(R);toggleFavorite()");
 assert.equal(run('JSON.stringify(R)===before'),true);
 assert.equal(run('readFavorites().includes(activePresetId)'),true);
 run("window.hpFavoriteAccount='account-b';selectPresetCategory('favorites')");
 assert.equal(run('readFavorites().length'),0);assert.match(elements.get('presetGrid').innerHTML,/此分類尚無組套/);
 run("window.hpFavoriteAccount='account-a';renderPresets()");assert.equal(run('readFavorites().length'),1);
 run("window.HP_CLOUD_CONFIG.url='https://prod.supabase.co'");assert.equal(run('readFavorites().length'),0);
});
test('canceling a dropdown switch keeps selected regimen and unsaved prescription',()=>{
 const {run,elements}=boot({url:'https://test.supabase.co',publishableKey:'public'});
 run("isDirty=true;R.duration=10;const original=activePresetId;confirm=()=>false;choosePreset('pcab_dual')");
 assert.equal(run('activePresetId===original'),true);assert.equal(run('R.duration'),10);
 assert.match(elements.get('presetGrid').innerHTML,new RegExp(`value="${run('original')}" selected`));
});
test('a deleted favorite is absent and damaged browser storage does not prevent rendering',()=>{
 const {run,elements,saved}=boot();
 run("toggleFavorite();allPresets=allPresets.filter(p=>p.id!==activePresetId);selectPresetCategory('favorites')");
 assert.match(elements.get('presetGrid').innerHTML,/此分類尚無組套/);
 saved.set(run('favoriteKey()'),'broken-json');run('renderPresets()');assert.equal(run('readFavorites().length'),0);
});
