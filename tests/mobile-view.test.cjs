const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
test('mobile switch preserves independent pane scroll positions without touching prescription',()=>{
  const editor={scrollTop:150},preview={scrollTop:0,scrollLeft:0},classes=new Set();
  const button=()=>({hidden:false,setAttribute(){},focus(){}});
  const elements={previewPanel:preview,mobilePreviewBtn:button(),mobileEditBtn:button(),mobilePrintBtn:button()};
  const prescription={duration:10,phases:[{drugs:[{drugId:'amoxicillin',pills:3}]}]};
  const ctx=vm.createContext({R:prescription,document:{querySelector:s=>s==='.app'?{classList:{contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)}}:editor,getElementById:id=>elements[id]}});
  const source=fs.readFileSync('js/app.js','utf8'),start=source.indexOf('const mobilePaneScroll=');
  vm.runInContext(source.slice(start,source.indexOf('addUids(R);',start)),ctx);
  vm.runInContext('setMobilePreview(true)',ctx);
  assert(classes.has('mobile-preview'));assert(elements.mobilePreviewBtn.hidden);assert(!elements.mobileEditBtn.hidden);
  preview.scrollTop=90;preview.scrollLeft=120;
  vm.runInContext('setMobilePreview(false)',ctx);assert.equal(editor.scrollTop,150);
  vm.runInContext('setMobilePreview(true)',ctx);assert.equal(preview.scrollTop,90);assert.equal(preview.scrollLeft,120);
  assert.equal(ctx.R,prescription);assert.equal(ctx.R.duration,10);
});
