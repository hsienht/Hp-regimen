// ═══════════════════════════════════════════════
//  DEFAULT DATA
// ═══════════════════════════════════════════════

const DEFAULT_DRUGS = [
  {id:'ppi',           name:'PPI 制酸劑',             subtypes:['Omeprazole 20mg','Esomeprazole 40mg','Lansoprazole 30mg','Rabeprazole 20mg','Pantoprazole 40mg'], shape:'round',  color:'#FFA726',color2:null,       note:''},
  {id:'pcab',          name:'PCAB 制酸劑 (需自費)',     subtypes:['Vonoprazan 20mg'],                                                                              shape:'oval',   color:'#FF8A80',color2:null,       note:''},
  {id:'bismuth',       name:'KCB 鉍劑',                subtypes:['Bismuth Subcitrate 120mg'],                                                                     shape:'round',  color:'#90A4AE',color2:null,       note:'大便及舌頭顏色可能暫時變黑灰色。'},
  {id:'amoxicillin',   name:'Amoxicillin 抗生素',      subtypes:['Amoxicillin 250mg','Amoxicillin 500mg'],                                                        shape:'capsule',color:'#EF5350',color2:'#BDBDBD',note:'若對盤尼西林或青黴素類抗生素過敏，請主動告知醫師。'},
  {id:'clarithromycin',name:'Clarithromycin 抗生素',   subtypes:['Clarithromycin 500mg'],                                                                         shape:'round',  color:'#FFD740',color2:null,       note:'嘴巴會有金屬味或苦味。'},
  {id:'metronidazole', name:'Metronidazole 抗生素',    subtypes:['Metronidazole 250mg','Metronidazole 500mg'],                                                    shape:'round',  color:'#FF7043',color2:null,       note:'嘴巴會有金屬味。治療期間及停藥後 48–72 小時禁止飲酒。'},
  {id:'tetracycline',  name:'Tetracycline 抗生素',     subtypes:['Tetracycline 500mg','Tetracycline 250mg'],                                                                           shape:'capsule',color:'#66BB6A',color2:'#E0E0E0', note:'服藥前後 2 小時避免牛奶及鈣片。外出加強防曬（光敏感）。'},
  {id:'levofloxacin',  name:'Levofloxacin 抗生素',     subtypes:['Levofloxacin 500mg'],                                                                          shape:'oval',   color:'#80DEEA',color2:null,       note:'避免與鈣片、鐵劑同時服用。若出現腳跟痛或肌腱疼痛立即停藥並回診。'},
  {id:'rifabutin',     name:'Rifabutin 抗生素',         subtypes:['Rifabutin 150mg'],                                                                             shape:'capsule',color:'#CE93D8',color2:'#9575CD', note:'尿液、汗液、眼淚會暫時變橘紅色。'},
  {id:'doxycycline',   name:'Doxycycline 抗生素',       subtypes:['Doxycycline 100mg'],                                                                           shape:'capsule',color:'#FFB74D',color2:'#FFF176', note:'吞藥時搭配大量開水，服藥後 30 分鐘內不要平躺。外出加強防曬（光敏感）。'},
];

function mkD(drugId,freq,pills,times,subtype){return{drugId,subtype:subtype||0,freq,pills,times:times||null,customName:null,icon:null};}
const ALL_TS=['breakfast','lunch','dinner','sleep'];

const UN='1. 請按時服藥，切勿自行停藥，即使症狀改善也應完成整個療程。\n2. 如出現嚴重腸胃不適、嚴重過敏反應或其他異常，請立即回診。\n3. 治療結束後，請依醫師指示回診追蹤，確認幽門桿菌是否已根除。';

const DEFAULT_PRESETS=[
  {id:'bqt',      name:'鉍劑四合一處方',                          isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('bismuth',3,1),mkD('tetracycline',3,1),mkD('metronidazole',3,2)]}]},
  {id:'std_triple',name:'非鉍劑三合一處方',                        isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('clarithromycin',2,1)]}]},
  {id:'concomitant',name:'非鉍劑四合一處方',                       isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('clarithromycin',2,1),mkD('metronidazole',2,2)]}]},
  {id:'sequential',name:'序列四合一療法 (Sequential)',              isPhased:true, phaseDurations:[7,7], notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1)]},{drugs:[mkD('ppi',2,1,null,3),mkD('clarithromycin',2,1),mkD('metronidazole',2,2)]}]},
  {id:'hybrid',    name:'混合四合一療法 (Hybrid)',                  isPhased:true, phaseDurations:[7,7], notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1)]},{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('clarithromycin',2,1),mkD('metronidazole',2,2)]}]},
  {id:'rev_hybrid',name:'逆向混合四合一療法 (Reverse Hybrid)',      isPhased:true, phaseDurations:[7,7], notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('clarithromycin',2,1),mkD('metronidazole',2,2)]},{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1)]}]},
  {id:'levo_triple',name:'Levofloxacin三合一處方',                 isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('levofloxacin',1,1,['breakfast'])]}]},
  {id:'rifabutin', name:'Rifabutin三合一處方',                     isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',2,1,null,3),mkD('amoxicillin',2,2,null,1),mkD('rifabutin',2,1)]}]},
  {id:'hdppi_dual',name:'高劑量PPI二合一處方',                     isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('ppi',4,1,ALL_TS,3),mkD('amoxicillin',4,3,ALL_TS)]}]},
  {id:'pcab_dual', name:'PCAB二合一處方',                          isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('pcab',2,1),mkD('amoxicillin',3,3,null,0)]}]},
  {id:'pcab_triple',name:'PCAB三合一處方',                         isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('pcab',2,1),mkD('amoxicillin',2,2,null,1),mkD('clarithromycin',2,1)]}]},
  {id:'bap_triple',name:'BAP三合一處方',                           isPhased:false,duration:14,          notes:UN,phases:[{drugs:[mkD('pcab',2,1,['breakfast','dinner']),mkD('bismuth',4,1,ALL_TS),mkD('amoxicillin',4,3,ALL_TS)]}]},
];

const TIME_SLOTS=[{id:'breakfast',label:'早餐前'},{id:'lunch',label:'午餐前'},{id:'dinner',label:'晚餐前'},{id:'sleep',label:'睡前'}];
const TIME_ORDER=['breakfast','lunch','dinner','sleep'];
const PILL_COUNTS=[0.5,1,2,3,4];
const SHAPES=[{id:'round',label:'圓錠'},{id:'oval',label:'橢圓錠'},{id:'capsule',label:'膠囊'},{id:'small',label:'小圓錠'}];
const SW1=['#FFA726','#FF7043','#EF5350','#F48FB1','#CE93D8','#9FA8DA','#7986CB','#80CBC4','#A5D6A7','#66BB6A','#FFD740','#FFCC80','#90A4AE','#BDBDBD','#78909C','#37474F'];
const SW2=['#E0E0E0','#BDBDBD','#F5F5F5','#FFFFFF','#FFF9C4','#E8F5E9','#E3F2FD','#F3E5F5','#FBE9E7','#E0F7FA','#FCE4EC','#E8EAF6','#F1F8E9','#FFFDE7','#ECEFF1','#FBE9E7'];
