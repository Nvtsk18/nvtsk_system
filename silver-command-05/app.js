(()=>{"use strict";
const BASE="nvtsk05_independent";
let lab=sessionStorage.getItem(BASE+"_mode")==="lab";
let KEY=lab?BASE+"_lab":BASE;
const  $=s=>document.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial=()=>({version:1,cases:[{id:"demo-1",title:"PV Dachmontage · Demo",city:"Stockach",price:12500},{id:"demo-2",title:"Solarprojekt · Demo",city:"Singen",price:8300},{id:"demo-3",title:"Anmeldung · Demo",city:"Überlingen",price:3900},{id:"demo-4",title:"PV Anlage · Demo",city:"Konstanz",price:6400}],shards:[{id:"sample-dc",title:"Монтаж DC · Demo",kind:"DC",caseId:"demo-1",price:800,assignee:"member-0",status:"draft"},{id:"sample-ac",title:"Подключение AC · Demo",kind:"AC",caseId:"demo-2",price:1400,assignee:null,status:"draft"},{id:"sample-plan",title:"Проектирование · Demo",kind:"Projektierung",caseId:"demo-4",price:640,assignee:null,status:"draft"}],garage:[{id:"rail",title:"Einlegeschiene 5,90 м",qty:24,art:"rail"},{id:"clamp",title:"Mittelklemme 1,8 см",qty:48,art:"clamp"},{id:"module",title:"PV-модуль",qty:18,art:"module"},{id:"vertical",title:"CN37 · вертикаль",qty:36,art:"vertical"},{id:"van",title:"Sprinter 313 · Demo",qty:1,art:"van"},{id:"car",title:"Seat Leon · Demo",qty:1,art:"car"},{id:"trailer",title:"Anhänger · Demo",qty:1,art:"trailer"}],crew:[{name:"Demo Monteur",role:"Monteur"}],tasks:[]});
const {roles,migrate,validate,apply}=NVModel;
const actor=()=>state.crew.find(c=>c.id===state.actor);
const lead=()=>actor().role===roles[0], warehouse=()=>lead()||actor().role===roles[2];
let state, raw, history=[], damaged=false;
function readStore(){
  raw=localStorage.getItem(KEY);
  const record=raw?JSON.parse(raw):initial();
  state=validate(migrate(record.format===1?record.data:record));
  history=record.format===1?record.history.map(item=>validate(migrate(item))):[];
  damaged=false;
}
try{readStore()}catch{damaged=true;state=validate(migrate(initial()));history=[]}
async function change(operation,undo=false,recovery=false){
  const write=()=>{
    if(damaged&&!recovery)throw Error("Повреждённые данные. Откройте настройки для восстановления.");
    if(localStorage.getItem(KEY)!==raw)throw Error("Данные изменились в другой вкладке. Обновите страницу.");
    const next=validate(operation()), past=undo?history.slice(0,-1):[...history,state].slice(-10);
    const record=JSON.stringify({format:1,data:next,history:past});
    if(damaged&&raw!==null)localStorage.setItem(KEY+"_damaged",raw);
    localStorage.setItem(KEY,record);raw=record;state=next;history=past;damaged=false;render();
  };
  try{if(navigator.locks)await navigator.locks.request(KEY,write);else write();return true}
  catch(error){alert(error.message);return false}
}
const money=n=>Number(n||0).toLocaleString("de-DE",{maximumFractionDigits:2});
const pct=id=>{const s=state.shards.filter(x=>x.caseId===id);return s.length?Math.round(100*s.filter(x=>x.status==="accepted").length/s.length):0};
const button=(label,action,id)=>'<button data-action="'+action+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+label+'</button>';
const panel=(title,route,body)=>'<section class="panel"><div class="panelhead"><h2>'+title+'</h2><button data-route="'+route+'">Открыть →</button></div>'+body+'</section>';
const stat=(symbol,label,value,detail)=>'<div class="stat"><span class="symbol">'+symbol+'</span><div><strong>'+esc(value)+'</strong><label>'+label+'</label><small>'+detail+'</small></div></div>';
const row=c=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb"><img src="art/roof.webp" alt="" loading="lazy"></span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><span class="casemeta"><b>'+pct(c.id)+'%</b><small>'+money(c.price)+' €</small></span></button>';
const shard=s=>'<button class="shard" data-route="case/'+esc(s.caseId)+'"><span class="ring" style="--p:'+(s.status==="accepted"?100:0)+'%"><b>'+(s.status==="accepted"?"100%":"0%")+'</b></span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(statusName[s.status])+'</small></span><b>›</b></button>';
const iconPaths={
 home:"M2 10 12 2l10 8 M5 9v12h5v-7h4v7h5V9",
 layers:"m2 8 10-5 10 5-10 5z M2 12l10 5 10-5 M2 16l10 5 10-5",
 box:"M3 7l9-5 9 5v11l-9 5-9-5z M3 7l9 5 9-5 M12 12v11",
 van:"M2 6h13v11H2z M15 9h4l3 4v4h-7 M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
 team:"M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2c0-6 14-6 14 0v2 M16 4c5 0 5 8 0 8 M18 15c3 0 5 2 5 6",
 pulse:"M3 21v-6h3v6z M10 21V11h3v10z M17 21V6h3v15z M2 10l7-5 5 1 7-5",
 coins:"M4 8c0-4 14-4 14 0s-14 4-14 0z M4 8v9c0 4 14 4 14 0V8 M4 13c0 4 14 4 14 0",
 check:"M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2z M9 2h6v4H9z M8 13l3 3 6-7",
 settings:"M12 3l2 3 4-1 1 4 3 3-3 3-1 4-4-1-2 3-2-3-4 1-1-4-3-3 3-3 1-4 4 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
 screen:"M2 3h20v14H2z M12 17v4 M7 21h10",
 field:"M3 16h18 M5 16v-3c0-5 3-8 7-8s7 3 7 8v3 M10 4v8 M14 4v8 M2 17v3h20v-3",
 clock:"M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v7l4 2"};
const icon=name=>'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+iconPaths[name]+'"/></svg>';
const demoCaseLocations={Stockach:[47.851,9.012],Singen:[47.760,8.841],"Überlingen":[47.769,9.171],Konstanz:[47.660,9.175]};
function caseMiniMap(){
 const bounds={west:8.68,east:9.37,south:47.52,north:47.98};
 const placed=state.cases.map(c=>({c,coord:c.id.startsWith("demo-")?demoCaseLocations[c.city]:null})).filter(x=>x.coord);
 const pins=placed.map(({c,coord})=>{const x=100*(coord[1]-bounds.west)/(bounds.east-bounds.west),y=100*(bounds.north-coord[0])/(bounds.north-bounds.south);return '<button class="mapcasepin" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" data-route="case/'+esc(c.id)+'" title="'+esc(c.title+' · '+c.city)+'" aria-label="Открыть '+esc(c.title)+'"><span></span></button>'}).join('');
 const bbox=[bounds.west,bounds.south,bounds.east,bounds.north].join('%2C');
 return '<section class="panel casemap"><div class="panelhead"><h2>Карта кейсов</h2><small>'+placed.length+' с отметками · '+state.cases.length+' всего</small></div><div class="casemapviewport"><iframe loading="lazy" title="OpenStreetMap · регион Bodensee" src="https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&layer=mapnik" referrerpolicy="no-referrer" tabindex="-1"></iframe><div class="casemappins">'+pins+'</div><span class="casemapcredit">© OpenStreetMap contributors</span></div><div class="casemaplegend"><span><i></i> Демо-кейсы по центру города</span><button data-route="projects">Все кейсы →</button></div><p class="casemapnote">Точки показывают только демо-кейсы. Для реальных адресов координаты пока не определяются — ложные точки не создаются.</p></section>';
}
function dashboard(){
 const open=state.shards.filter(s=>s.status!=="accepted");
 const review=open.filter(s=>s.status==="submitted");
 const materials=state.garage.filter(m=>!["van","car","trailer"].includes(m.art));
 const fleet=state.garage.filter(m=>["van","car","trailer"].includes(m.art));
 const total=state.cases.reduce((n,c)=>n+c.price,0);
 const metrics=[["layers","Проекты",state.cases.length,"projects"],["box","Задачи",state.shards.length,"projects"],["check","Приёмка",review.length,"projects"],["van","Lager",materials.length+" / "+fleet.length,"lager"],["coins","Merit",money(total),"pulse"]];
 const statsHtml=metrics.map(([sym,label,value,route])=>'<button class="stat" data-route="'+route+'"><span class="symbol">'+icon(sym)+'</span><span class="stattext"><span class="statlabel">'+esc(label)+'</span><strong>'+esc(value)+'</strong></span></button>').join("");
 const caseRows=state.cases.slice(0,5).map(c=>{const shards=state.shards.filter(s=>s.caseId===c.id);return '<article class="homeproject"><button class="homeprojectmain" data-route="case/'+esc(c.id)+'"><img src="art/roof.webp" alt="" loading="lazy"><span><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+' · '+shards.length+' Shard · '+money(c.price)+' €</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><b>'+pct(c.id)+'%</b></button><div class="homeprojectshards">'+shards.slice(0,3).map(x=>'<button data-route="case/'+esc(c.id)+'"><span>'+icon(x.status==="submitted"?"check":"box")+'</span>'+esc(x.title)+'<small>'+esc(statusName[x.status])+'</small></button>').join("")+(shards.length===0?'<small>Нет задач</small>':'')+'</div></article>'}).join("")||'<p>Создайте первый Case.</p>';
 const quick='<div class="homeactions">'+(lead()?'<button data-action="new-case">'+icon("layers")+'<span>Новый Case</span></button>':'')+'<button data-route="projects">'+icon("check")+'<span>Проекты и задачи</span></button><button data-route="lager">'+icon("box")+'<span>Material</span></button><button data-route="fuhrpark">'+icon("van")+'<span>Fuhrpark</span></button><button data-route="field">'+icon("field")+'<span>Field Mode</span></button><button data-route="social">'+icon("team")+'<span>Сообщество</span></button></div>';
 const stockPreview=materials.slice(0,3).map(m=>'<button class="homestockrow" data-route="lager"><img src="art/'+esc(["rail","clamp","module","vertical"].includes(m.art)?m.art:"rail")+'.webp" alt=""><span>'+esc(m.title)+'</span><strong>'+esc(m.qty)+'</strong></button>').join("")||'<p>Материалы не добавлены</p>';
 const fleetPreview=fleet.slice(0,3).map(m=>'<button class="homefleetitem" data-route="fuhrpark"><img src="art/'+esc(m.art)+'.webp" alt=""><span>'+esc(m.title.replace(" · Demo",""))+'</span></button>').join("");
 return '<section class="hero homehero"><div><span class="homeeyebrow">SILVER COMMAND / OPERATIONS</span><h1>NVTSK <em>//</em> Command</h1><p>Проекты, задачи, материалы и команда — единый центр управления</p></div><img src="art/roof.webp" alt="PV-проект" loading="lazy"></section><div class="stats desktopmetrics homemetrics">'+statsHtml+'</div><section class="panel homequick"><div class="panelhead"><h2>Быстрые действия</h2></div>'+quick+'</section><div class="homegrid"><section class="panel homeprojects"><div class="panelhead"><h2>Проекты + задачи</h2><button data-route="projects">Все проекты →</button></div>'+caseRows+'</section><section class="panel homelager"><div class="panelhead"><h2>Lager</h2><button data-route="lager">Открыть →</button></div><div class="homelagerstats"><button data-route="lager">'+icon("box")+'<strong>'+materials.length+'</strong><small>Material</small></button><button data-route="fuhrpark">'+icon("van")+'<strong>'+fleet.length+'</strong><small>Fuhrpark</small></button></div><h3>Материалы</h3>'+stockPreview+'<h3>Автопарк</h3><div class="homefleet">'+fleetPreview+'</div></section></div>'+caseMiniMap()+panel("Сообщество","social",'<div class="socialteaser"><img src="art/roof.webp" alt=""><div><strong>Новости с объектов</strong><p>Публикации и обсуждения команды</p><button data-route="social">Открыть ленту →</button></div></div>')+'<div class="future"><button data-route="pulse">'+icon("coins")+' Merit</button><button data-route="team">'+icon("team")+' Команда</button><button data-route="settings">'+icon("settings")+' Настройки</button></div>';
}
const heading=(name,action="")=>'<div class="screenhead"><h1>'+name+'</h1>'+action+'</div>';
function projects(){
 const all=state.shards,review=all.filter(x=>x.status==="submitted"),active=all.filter(x=>x.status==="draft");
 const cases=state.cases.map(c=>{const linked=all.filter(x=>x.caseId===c.id);return '<section class="panel projectgroup"><div class="projectgrouphead"><img src="art/roof.webp" alt="" loading="lazy"><div><h2>'+esc(c.title)+'</h2><small>⌖ '+esc(c.city)+' · '+money(c.price)+' € · '+linked.length+' Shard</small><div class="progress"><i style="width:'+pct(c.id)+'%"></i></div></div><button data-route="case/'+esc(c.id)+'">Открыть Case →</button></div><div class="projectshards">'+(linked.length?linked.map(shardRow).join(""):'<p>Нет Shard. Создайте этап работ в Case.</p>')+'</div></section>'}).join("")||'<p>Создайте первый Case.</p>';
 return heading("Проекты и задачи",button("＋ Новый Case","new-case")+button("⚡ Электромонтаж","new-electrical"))+'<div class="unifiedstats">'+stat(icon("layers"),"Case",state.cases.length,"Проекты")+stat(icon("box"),"Shard",all.length,"Задачи")+stat(icon("clock"),"На приёмке",review.length,"Ожидают проверки")+'</div>'+panel("Приёмка · "+review.length,"projects",review.map(shardRow).join("")||'<p>Нет заданий на проверке</p>')+panel("В работе · "+active.length,"projects",active.map(shardRow).join("")||'<p>Нет активных задач</p>')+'<div class="projectgroups">'+cases+'</div>';
}
const statusName={draft:"В работе",submitted:"На проверке",accepted:"Принято"};
const member=id=>state.crew.find(c=>c.id===id)?.name||"Без назначения";
const options=(items,value)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join("");
const teamOptions=()=>state.crew.map(c=>[c.id,c.name+" · "+c.role]);
function shardRow(s){
  let actions="";
  if(s.status==="draft" && lead())actions+=button("Назначить","assign",s.id);
  if(s.status==="draft" && state.actor===s.assignee)actions+=button("На проверку","submit",s.id);
  if(s.status==="submitted" && lead() && state.actor!==s.assignee)actions+=button("Принять","accept",s.id)+button("На доработку","revise",s.id);
  return '<article class="taskrow"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(member(s.assignee))+' · '+statusName[s.status]+'</small><p>'+esc(s.notes||'')+'</p><div>'+fileLinks(s.files)+'</div></div><div>'+actions+'</div></article>';
}
function caseMaterialHistory(caseId){
 const related=new Set(state.shards.filter(s=>s.caseId===caseId).map(s=>s.id));
 const moves=state.moves.filter(m=>related.has(m.shardId)).slice().reverse();
 if(!moves.length)return '<p>Движений материалов нет</p>';
 return moves.map(m=>{
  const item=state.garage.find(x=>x.id===m.itemId);
  const shard=state.shards.find(x=>x.id===m.shardId);
  const operator=state.crew.find(x=>x.id===m.actor);
  const kind={issue:"Выдача",return:"Возврат",receive:"Приход"}[m.type]||m.type;
  return '<div class="taskrow"><div><strong>'+esc(kind)+' · '+esc(item?.title||"Материал")+' · '+esc(m.qty)+'</strong><small>'+esc(shard?.title||"Shard")+' · '+esc(operator?.name||"Участник")+'</small></div></div>';
 }).join("");
}
function caseTeam(id){
 const linked=state.shards.filter(s=>s.caseId===id);
 const ids=new Set(linked.map(s=>s.assignee).filter(Boolean));
 const rows=state.crew.filter(c=>ids.has(c.id)||c.role==="Руководитель").map(c=>{
 const assigned=linked.filter(s=>s.assignee===c.id);
 return '<article class="taskrow"><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.role)+' · '+(assigned.length?assigned.map(x=>esc(x.title)).join(", "):"Управление Case")+'</small></div><div>'+(lead()?'<button data-route="team">Участники →</button>':'')+'</div></article>';
 }).join("");
 const unassigned=linked.filter(s=>!s.assignee);
 return '<section class="panel"><div class="panelhead"><h2>Команда Case</h2>'+(lead()?'<button data-route="team">Управление участниками →</button>':'')+'</div>'+(rows||'<p>Участники пока не назначены</p>')+(unassigned.length?'<p class="hint">Без исполнителя: '+unassigned.map(x=>esc(x.title)).join(", ")+'</p>':'')+'<p class="hint">Приглашения между устройствами пока недоступны. Назначения сохраняются локально; доступ не синхронизируется.</p></section>';
}
function detail(id){
  const c=state.cases.find(x=>x.id===id);
  if(!c)return heading("Case не найден");
  const shards=state.shards.filter(s=>s.caseId===id);
  return '<button class="back" data-route="projects">← Проекты</button><section class="panel casehead"><img src="art/roof.webp" alt=""><div><h1>'+esc(c.title)+'</h1><p>'+esc(c.city)+'</p><p>'+esc(c.address||'')+'</p><p>'+esc(c.notes||'')+'</p><div>'+fileLinks(c.files)+'</div><span class="progress"><i style="width:'+pct(id)+'%"></i></span><small>Готовность '+pct(id)+'%</small></div></section><div class="details">'+stat("▤","Shard",shards.length,"Этапы")+stat("€","Бюджет",money(c.price),"EUR")+stat("◇","Merit",money(c.price),"Эмиссия Case")+'</div><section class="panel"><div class="panelhead"><h2>Shards</h2><button data-route="lager">Lager</button></div>'+shards.map(shardRow).join("")+(lead()?button("＋ Новый Shard","new-shard",id):"")+'</section>'+caseTeam(id)+'<section class="panel"><h2>Материалы Case · история</h2>'+caseMaterialHistory(id)+'</section>';
}
const warehousePhotos=[
 {name:"novotegra Einlegeschiene",brand:"novotegra",kind:"Einlegesystem · не привязано к артикулу",image:"https://www.novotegra.com/fileadmin/_processed_/d/9/csm_einlegeschiene-kombination-03-0013xx_e3262ee072.jpg",url:"https://www.novotegra.com/fileadmin/04_Downloads/Certificates/novotegra_system/Montagesystemkatalog/DE-novotegra-Montage-Systemkatalog.pdf",verified:false},
 {name:"novotegra Kurzprofil C47",brand:"novotegra",kind:"Kurzprofil · не привязано к артикулу",image:"https://www.novotegra.com/fileadmin/_processed_/c/4/csm_kurzprofil-c47-03-001108_431a324da3.jpg",url:"https://www.novotegra.com/de/montagesysteme/fassade/metall-fassade-kurzprofil",verified:false},
 {name:"K2 SingleRail 36",brand:"K2 Systems",kind:"5,95 м · Artikel 2004260 · EN AW-6063 T66",image:"art/rail.webp",url:"https://catalogue.k2-systems.com/de/singlerail-36/2004260",verified:true,illustration:true}
];
const articleShops={
 "2004260":[{name:"MAXSEL",url:"https://www.maxsel.de/produkt/k2-2004260-singlerail-36-595-m/"},{name:"SolarLogic",url:"https://shop.solarlogic.de/de/products/k2-mounting-rail-singlerail-36-with-5-95-m-sl-000975"},{name:"SOLARCRAFT",url:"https://solarcraft.eu/de/k2-systems-singlerail-36-5-95-m-2004260.html"}],
 "03-001670":[{name:"BayWa r.e.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/c-n-schiene-37-5-90m.html"},{name:"MAXSEL",url:"https://www.maxsel.de/produkt/novotegra-03-001670-c-n-schiene-37-590m/"}],
 "03-001347":[{name:"BayWa r.e.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/schienenverbinder-set-c-n-37-s.html"},{name:"Elektroshop Bischof",url:"https://www.elektroshop-bischof.de/novotegra-03-001347-schienenverbinder-set-c-n-37-s"},{name:"MAXSEL",url:"https://www.maxsel.de/produkt/novotegra-03-001347/"}]
};
const shopLinks=sku=>(articleShops[String(sku||"").trim()]||[]).map(x=>'<a class="stocksource" target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">Купить · '+esc(x.name)+' ↗</a>').join(" ");
const systemReferences=[
 {title:"novotegra C-N-Schiene 37 · 5,90 м",article:"03-001670",detail:"Алюминиевый профиль 52 × 37 мм; не путать с Einlegeschiene.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/c-n-schiene-37-5-90m.html"},
 {title:"novotegra Schienenverbinder-Set C-N 37 S",article:"03-001347",detail:"Соединитель длиной 250 мм для C-N-Schiene 37.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/schienenverbinder-set-c-n-37-s.html"},
 {title:"K2 SingleRail 36 · 5,95 м",article:"2004260 · GTIN 4251786213344 · 36 × 39,4 мм · 4,579 кг",detail:"Алюминий EN AW-6063 T66. Система крепления подбирается по покрытию и статике в K2 Base.",url:"https://catalogue.k2-systems.com/de/singlerail-36/2004260"},
 {title:"K2 SingleRail 36/50 RailConnector",article:"Системный соединитель",detail:"Использовать только в совместимых конфигурациях по инструкции K2; момент затяжки и расположение проверять по актуальному руководству.",url:"https://catalogue.k2-systems.com/en/resource-access?file=4cd5ecfbec174967aacdf50449a1cfec"},
 {title:"novotegra Insertion System",article:"Комплект зависит от варианта монтажа",detail:"Insertion Rail Plus, Support Rail IR, EPDM-T и крепёж подбираются по конкретной схеме; комплект не универсальный.",url:"https://www.novotegra.com/fileadmin/04_Downloads/Mounting_instruction/Tile_Roof/Insertion_System_Side-Fix/mounting-instructions-tile-roof-side-fix-novotegra.pdf"}
];
function garage(view="material"){
 const moves=state.moves.slice().reverse();
 const stockPhoto=m=>{const t=m.title.toLowerCase();if(m.sku==="2004260"&&/singlerail/.test(t))return warehousePhotos[2];return null};
 const inventory=state.garage.filter(m=>view==="fuhrpark"?["van","car","trailer"].includes(m.art):!["van","car","trailer"].includes(m.art)).map(m=>{const photo=stockPhoto(m),fallback=['rail','clamp','module','vertical','van','car','trailer'].includes(m.art)?'art/'+m.art+'.webp':null;
  return '<article class="panel item stockitem" data-stock="'+esc((m.title+" "+(m.sku||"")+" "+(m.brand||"")).toLowerCase())+'"><div class="stockmedia">'+(photo?'<img loading="lazy" src="'+esc(photo.image)+'" alt="'+esc(photo.name)+'" onerror="this.onerror=null;this.src=\''+(fallback||'art/rail.webp')+'\'">':fallback?'<img loading="lazy" src="'+fallback+'" alt="Схематичная иллюстрация; точный артикул не подтверждён">':'<span class="stocknoimage">Нет фото</span>')+'</div><div class="stockdetails">'+(photo?'<small class="stockbrand">'+esc(photo.brand)+'</small>':'<small class="stockbrand">Артикул / фото не верифицированы</small>')+'<h2>'+esc(m.title)+'</h2>'+(m.sku?'<small>ART. '+esc(m.sku)+'</small>':'<small>Артикул не указан</small>')+'<p>Остаток <strong>'+esc(m.qty)+'</strong> '+esc(m.unit||'шт.')+'</p>'+(photo?'<a class="stocksource" href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer">Каталог производителя ↗</a>':'')+shopLinks(m.sku)+'</div>'+(warehouse()?button("Операции","move",m.id):"")+'</article>'}).join("");
 const catalogue=warehousePhotos.map(p=>'<article class="stockcataloguecard"><img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.name)+'"><div><small>'+esc(p.brand)+' · '+esc(p.kind)+'</small><strong>'+esc(p.name)+'</strong><a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">Официальный каталог ↗</a></div></article>').join("");
 const specs=systemReferences.map(r=>'<article class="taskrow"><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.article)+' · '+esc(r.detail)+'</small><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Инструкция / каталог производителя ↗</a></div></article>').join('');
 return '<div class="warehouse">'+heading("Lager //",warehouse()?button("＋ Добавить позицию","new-material"):"")+'<div class="lagertabs"><button data-route="lager" class="'+(view==="material"?"active":"")+'">Material · Склад</button><button data-route="fuhrpark" class="'+(view==="fuhrpark"?"active":"")+'">Fuhrpark · Автопарк</button></div>'+'</div><div class="stocksummary"><span>ПОЗИЦИЙ <b>'+state.garage.length+'</b></span><span>ЕДИНИЦ <b>'+state.garage.reduce((sum,m)=>sum+m.qty,0)+'</b></span><span>ДВИЖЕНИЙ <b>'+state.moves.length+'</b></span></div><div class="columns stock"><section class="panel stockinventory"><div class="panelhead"><h2>Материалы и оборудование</h2><small>'+state.garage.length+' позиций</small></div><label class="stocksearch">Поиск по складу<input id="stock-search" type="search" placeholder="Название, профиль, производитель"></label><div class="cards">'+inventory+'</div></section><section class="panel"><div class="panelhead"><h2>История движений</h2></div>'+moves.map(m=>'<div class="taskrow"><div>'+esc(state.garage.find(i=>i.id===m.itemId)?.title||"Удалённая позиция")+' · '+esc(m.qty)+'<small>'+({issue:"Выдача",return:"Возврат",receive:"Приход",writeoff:"Списание"})[m.type]+' · '+esc(state.shards.find(s=>s.id===m.shardId)?.title||"Склад")+'</small></div></div>').join("")+(!moves.length?"<p>Движений пока нет</p>":"")+'</section></div><section class="panel stockreferences"><div class="panelhead"><h2>Каталог производителей</h2><small>novotegra: фото производителя · K2: иллюстрация</small></div><p class="stockhint">Изображения novotegra требуют проверки соответствия конкретному артикулу; K2 SingleRail показан локальной иллюстрацией до проверки точного фото. Каталог не отражает остатки.</p><div class="stockcatalogue">'+catalogue+'</div><h2>Проверенные технические источники</h2><p class="stockhint">Не заменяет проектную статику, монтажную инструкцию и подбор крепежа под крышу. Не смешивать системы разных производителей без подтверждения совместимости.</p>'+specs+'</section>';
}

function tasks(){
 const pending=state.shards.filter(s=>s.status==="submitted");
 const active=state.shards.filter(s=>s.status==="draft");
 return heading("Задачи / Приёмка")+
 panel("Ожидают приёмки · "+pending.length,"projects",pending.map(shardRow).join("")||"<p>Нет заданий на проверке</p>")+
 panel("В работе · "+active.length,"projects",active.map(shardRow).join("")||"<p>Все задания обработаны</p>");
}
function team(){
 const members=state.crew.map(c=>{
  const assigned=state.shards.filter(s=>s.assignee===c.id);
  const accepted=assigned.filter(s=>s.status==="accepted").length;
  return '<article class="taskrow"><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.role)+' · '+assigned.length+' Shard · '+accepted+' принято</small></div><span class="memberstate">'+(c.id===state.actor?'Текущий профиль':'')+'</span></article>';
 }).join("");
 return heading("Команда",lead()?button("＋ Участник","new-crew"):"")+profile()+panel("Участники · "+state.crew.length,"settings",members);
}
function profile(){return '<label>Локальный профиль<select id="actor">'+options(teamOptions(),state.actor)+'</select></label>'}
function field(){
 const mine=state.shards.filter(s=>s.assignee===state.actor);
 const active=mine.filter(s=>s.status==="draft"),review=mine.filter(s=>s.status==="submitted"),done=mine.filter(s=>s.status==="accepted");
 const next=active[0]||review[0]||done[0],nextCase=next&&state.cases.find(c=>c.id===next.caseId);
 const hero='<section class="fieldhero"><div class="fieldheroimage" role="img" aria-label="PV-монтаж"></div><div class="fieldherocontent"><span class="fieldeyebrow">NVTSK / FIELD OPERATIONS</span><h1>Рабочее место монтажника</h1><p>Задания, материалы, инструкции и передача работ на приёмку.</p><div class="fieldherolinks"><button data-route="projects">Проекты / задачи</button><button data-route="lager">Lager</button></div></div></section>';
 const briefing=next?'<section class="panel fieldbrief"><div class="panelhead"><h2>Следующее задание</h2><span class="fieldstatus">'+esc(statusName[next.status])+'</span></div><div class="fieldbriefbody"><img src="art/roof.webp" alt="Иллюстрация PV-крыши"><div><strong>'+esc(next.title)+'</strong><small>'+esc(nextCase?.title||"Case")+' · '+esc(nextCase?.city||"")+'</small><p>'+esc(next.notes||"Откройте Case, чтобы посмотреть материалы и инструкции.")+'</p><button data-route="case/'+esc(next.caseId)+'">Открыть Case →</button></div></div></section>':'<section class="panel fieldbrief"><h2>Нет назначенных заданий</h2><p>Руководитель может назначить Shard в карточке Case.</p></section>';
 const cards=mine.map(s=>{const c=state.cases.find(c=>c.id===s.caseId);return '<article class="fieldtask fieldtaskvisual"><img src="art/roof.webp" alt="Иллюстрация PV-монтажа" loading="lazy"><div class="fieldtaskcontent"><div class="fieldtaskhead"><div><strong>'+esc(s.title)+'</strong><small>'+esc(c?.title||"Case")+' · '+esc(c?.city||"")+'</small></div><span class="fieldstatus">'+esc(statusName[s.status])+'</span></div><p class="fieldtasknotes">'+esc(s.notes||"Подробности доступны в Case")+'</p><div class="fieldtaskbuttons"><button data-route="case/'+esc(s.caseId)+'">Открыть Case →</button>'+(s.status==="draft"?'<button data-action="submit" data-id="'+esc(s.id)+'">Передать на приёмку</button>':'')+'</div></div></article>'}).join("")||'<p>Назначенных заданий пока нет.</p>';
 const steps='<section class="panel fieldworkflow"><h2>Порядок работы</h2><div class="fieldsteps"><div><span>01</span>'+icon("layers")+'<strong>Открыть Case</strong><small>Проект и инструкции</small></div><div><span>02</span>'+icon("box")+'<strong>Получить материалы</strong><small>Выдача на Shard</small></div><div><span>03</span>'+icon("settings")+'<strong>Монтаж</strong><small>По проекту и технике безопасности</small></div><div><span>04</span>'+icon("check")+'<strong>Приёмка</strong><small>Передать результат</small></div></div></section>';
 return hero+'<div class="fieldsummary">'+stat(icon("clock"),"В работе",active.length,"")+stat(icon("check"),"На проверке",review.length,"")+stat(icon("layers"),"Принято",done.length,"")+'</div>'+briefing+panel("Мои задания · "+mine.length,"projects",cards)+steps+'<p class="fieldwarning">Иллюстрации не заменяют монтажный проект. Для работ на крыше обязательна защита от падения. AC-подключение выполняет уполномоченная Elektrofachkraft.</p>';
}
function pulse(){
 const total=state.cases.reduce((n,c)=>n+c.price,0);
 const allocated=state.shards.reduce((n,s)=>n+s.price,0);
 const accepted=state.shards.filter(s=>s.status==="accepted").reduce((n,s)=>n+s.price,0);
 const pending=state.shards.filter(s=>s.status==="submitted").length;
 return heading("Project Pulse")+
 '<div class="pulsemetrics">'+stat(icon("coins"),"Бюджет Case",money(total)+" €","")+
 stat(icon("layers"),"Распределено Shard",money(allocated)+" €","")+
 stat(icon("check"),"Принято",money(accepted)+" €","")+
 stat(icon("clock"),"Ожидают приёмки",pending,"")+'</div>'+
 panel("Готовность проектов","projects",state.cases.map(row).join("")||"<p>Проектов пока нет</p>")+
 '<p class="pulsehint">Merit создаётся только при создании Case. Shard распределяет уже существующий Merit, не создавая новый.</p>';
}
function settings(){return heading("Настройки")+profile()+'<div class="panel tools"><button data-route="team">Команда и роли</button>'+button(lab?"Вернуться к рабочим данным":"Тестовая копия","sandbox")+button("Экспорт JSON","export")+(lead()?'<label>Импорт JSON<input id="import" type="file" accept=".json,application/json"></label>'+ (history.length?button("Time Machine · отменить последнюю операцию","undo"):""):"")+'</div><p>Профили действуют на этом устройстве. История хранит последние 10 операций.</p>'}

const SOCIAL_KEY=BASE+"_social";
function socialData(){try{const d=JSON.parse(localStorage.getItem(SOCIAL_KEY)||'{"posts":[]}');return Array.isArray(d.posts)?d:{posts:[]}}catch{return {posts:[]}}}
function social(){
 const d=socialData(),people=Object.fromEntries(state.crew.map(c=>[c.id,c.name]));
 const posts=d.posts.slice().reverse().map(p=>{
 const c=state.cases.find(c=>c.id===p.caseId),likes=p.likes||[],comments=p.comments||[];
 return '<article class="socialpost"><div class="socialauthor"><span class="socialavatar">'+esc((people[p.author]||"?").slice(0,1))+'</span><div><strong>'+esc(people[p.author]||"Участник")+'</strong><small>'+esc(new Date(p.created).toLocaleString("ru-RU"))+'</small></div></div><p>'+esc(p.text)+'</p>'+(c?'<button data-route="case/'+esc(c.id)+'">Case: '+esc(c.title)+' →</button>':'')+'<div class="socialactions"><button data-action="social-like" data-id="'+esc(p.id)+'">'+(likes.includes(state.actor)?"♥":"♡")+' '+likes.length+'</button><span>Комментарии '+comments.length+'</span></div><div class="socialcomments">'+comments.map(x=>'<p><strong>'+esc(people[x.author]||"Участник")+':</strong> '+esc(x.text)+'</p>').join("")+'</div><form class="socialcommentform" data-post="'+esc(p.id)+'"><input required maxlength="500" name="comment" placeholder="Комментарий"><button type="submit">Отправить</button></form></article>';
 }).join("")||'<div class="socialempty"><img src="art/roof.webp" alt=""><p>Публикаций пока нет. Расскажите команде о ходе работ.</p></div>';
 return heading("Сообщество")+'<section class="socialhero"><img src="art/roof.webp" alt=""><div><h2>Лента команды</h2><p>Новости объектов, вопросы и опыт монтажников</p></div></section><section class="panel socialcomposer"><h2>Новая публикация</h2><form id="social-compose"><textarea name="text" required maxlength="1200" rows="3" placeholder="Что нового на объекте?"></textarea><div class="socialcomposeactions"><select name="caseId"><option value="">Без Case</option>'+state.cases.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title)+'</option>').join("")+'</select><button type="submit">Опубликовать</button></div></form></section><div class="socialfeed">'+posts+'</div><p class="socialnotice">Публикации сохраняются только на этом устройстве. Это не общий онлайн-чат. Не публикуйте персональные данные клиентов.</p>';
}
const pages={dashboard,projects,garage,tasks,team,field,settings,pulse,social,lager:()=>garage("material"),fuhrpark:()=>garage("fuhrpark")};
function render(){
 const r=location.hash.slice(1)||"dashboard";
 $(".local").textContent=lab?"● ТЕСТОВАЯ КОПИЯ":"● LOCAL FIRST";
 $("#app").innerHTML=(lab?'<p class="labnotice">Тестовая копия · изменения изолированы</p>':"")+(damaged?'<p role="alert">Ошибка чтения. Для восстановления откройте настройки и импортируйте копию.</p>':'')+(r.startsWith("case/")?detail(r.slice(5)):Object.hasOwn(pages,r)?pages[r]():dashboard());
 document.querySelectorAll("#nav button,.mode button").forEach(b=>b.classList.toggle(b.closest("#nav")?"active":"selected",(b.dataset.route===r||(b.dataset.route==="projects"&&r==="tasks")||(b.dataset.route==="lager"&&["garage","fuhrpark"].includes(r)))||(b.closest(".mode")&&r!=="field"&&b.dataset.route==="dashboard")||(b.closest("#nav")&&r.startsWith("case/")&&b.dataset.route==="projects")));
 if(!lead())document.querySelectorAll('[data-action="new-case"],[data-action="new-electrical"]').forEach(b=>b.remove());
}
const input=(name,text,type="text")=>'<label>'+text+'<input required name="'+name+'" type="'+type+'" '+(type==="number"?'min="0" max="1000000000000" step=".01"':'maxlength="120"')+'></label>';
const select=(name,text,items,value)=>'<label>'+text+'<select required name="'+name+'">'+options(items,value)+'</select></label>';
const pairs=items=>items.map(x=>[x,x]);
let pending;
function fileLinks(files){return (files||[]).map(a=>'<a href="'+a.data+'" download="'+esc(a.name)+'" target="_blank" rel="noopener noreferrer">'+esc(a.name)+'</a>').join(" · ")}
function edit(kind,id){
 const s=state.shards.find(x=>x.id===id);
 const titles={electrical:"Электромонтаж · новый Case",case:"Новый Case",shard:"Новый Shard",material:"Новая позиция",crew:"Новый участник",assign:"Назначение",move:"Движение материала"};

 let fields=["case","electrical","shard","material","crew"].includes(kind)?input("title",kind==="crew"?"Имя":"Название"):"";
 if(kind==="case"||kind==="electrical")fields+=input("city","Город")+'<label>Адрес объекта<input name="address" maxlength="300" placeholder="Straße, Hausnummer, PLZ, Ort"></label>'+input("price","Бюджет, €","number");
 if(kind==="electrical")fields+='<p>Этапы: разметка и штробы; кабельные трассы; подрозетники, розетки и освещение; сборка щита; измерения и приёмка. Подключение и ввод в эксплуатацию — только уполномоченным электроспециалистом (Elektrofachkraft).</p>';
 if(kind==="shard")fields+=select("kind","Этап",pairs(["Projektierung","DC","AC","Anmeldung","Elektro · Rohbau","Elektro · Kabel","Elektro · Installation","Elektro · Verteiler","Elektro · Prüfung","Другое"]))+input("price","Стоимость Shard, €","number");
 if(kind==="shard"||kind==="assign")fields+=select("assignee","Исполнитель",teamOptions(),s?.assignee||state.crew.find(c=>c.role===roles[1])?.id);
 if(kind==="material")fields+=`<label>Артикул / Artikelnummer<input required name="sku" maxlength="80" placeholder="2004260"></label><label>Производитель<input name="brand" maxlength="100" placeholder="K2 Systems / novotegra"></label>`;
 if(kind==="crew")fields+=select("role","Роль",pairs(roles),roles[1]);
 if(kind==="move")fields+=select("type","Операция",state.shards.length?[["issue","Выдача"],["return","Возврат"],["receive","Приход"],["writeoff","Списание"]]:[["receive","Приход"],["writeoff","Списание"]])+select("shardId","Case / Shard",(state.shards.length?[]:[["stock","Склад"]]).concat(state.shards.map(s=>[s.id,state.cases.find(c=>c.id===s.caseId).title+" / "+s.title])));
 if(kind==="move")fields+=`<label>Причина списания<input name="reason" maxlength="300" placeholder="Брак, потеря, инвентаризация"></label>`;
 if(kind==="material"||kind==="move")fields+=input("qty","Количество, шт.","number").replace('step=".01"','step="1"').replace('min="0"','min="1"');
 if(["case","electrical","shard"].includes(kind))fields+='<label>Описание и инструкции<textarea name="notes" maxlength="4000" rows="3" placeholder="Объём работ, доступ, особенности объекта"></textarea></label><label>Фото / PDF (до 8 файлов, каждый до 650 КБ, всего до 2 МБ)<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple></label><p class="hint">Файлы сохраняются локально вместе с Case/Shard и входят в JSON-экспорт. Не загружайте конфиденциальные документы на чужом устройстве.</p>';
 pending={kind,id};$("#dialogTitle").textContent=titles[kind];$("#fields").innerHTML=fields;$("#dialog").showModal();
}
document.addEventListener("click",async e=>{
 if(e.target.closest('[data-action="social-like"]')){const id=e.target.closest("[data-action]").dataset.id,d=socialData(),p=d.posts.find(x=>x.id===id);if(p){p.likes=p.likes||[];p.likes=p.likes.includes(state.actor)?p.likes.filter(x=>x!==state.actor):[...p.likes,state.actor];try{localStorage.setItem(SOCIAL_KEY,JSON.stringify(d));render()}catch(err){alert(err.message)}}return}

 const b=e.target.closest("[data-route],[data-action]");if(!b)return;
 if(b.dataset.route){location.hash=b.dataset.route;return}
 const a=b.dataset.action,id=b.dataset.id;
 if(a==="sandbox"){
   try{
     if(!lab){localStorage.setItem(BASE+"_lab",JSON.stringify({format:1,data:state,history:[]}));sessionStorage.setItem(BASE+"_mode","lab")}
     else sessionStorage.removeItem(BASE+"_mode");
     location.reload();
   }catch(error){alert(error.message)}
   return;
 }
 if(a.startsWith("new-")||a==="assign"||a==="move"){edit(a.replace("new-",""),id);return}
 if(["accept","submit","revise"].includes(a))await change(()=>apply(state,a,{shardId:id}));
 if(a==="undo"&&lead()&&history.length&&confirm("Вернуть предыдущий снимок данных?"))await change(()=>history.at(-1),true);
 if(a==="export"){
 const url=URL.createObjectURL(new Blob([damaged?raw:JSON.stringify(state,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="nvtsk-05.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
});
document.addEventListener("submit",e=>{const form=e.target;if(form.id!=="social-compose"&&!form.matches(".socialcommentform"))return;e.preventDefault();const d=socialData(),isPost=form.id==="social-compose",value=String(new FormData(form).get(isPost?"text":"comment")||"").trim();if(!value||value.length>(isPost?1200:500))return;try{if(isPost){const caseId=new FormData(form).get("caseId");d.posts.push({id:crypto.randomUUID(),author:state.actor,created:new Date().toISOString(),text:value,caseId:state.cases.some(c=>c.id===caseId)?caseId:null,likes:[],comments:[]})}else{const p=d.posts.find(x=>x.id===form.dataset.post);if(!p)return;p.comments.push({id:crypto.randomUUID(),author:state.actor,text:value})}localStorage.setItem(SOCIAL_KEY,JSON.stringify(d));render()}catch(err){alert(err.message)}});
document.addEventListener("change",async e=>{
 if(e.target.id==="actor")await change(()=>apply(state,"actor",{id:e.target.value}));
 if(e.target.id==="import"&&lead()&&e.target.files.length){try{
 const file=e.target.files[0];if(file.size>5000000)throw Error("Файл больше 5 МБ");
 const data=validate(migrate(JSON.parse(await file.text())));
 if(confirm("Заменить локальные данные данными из файла?"))await change(()=>data,false,true);
 }catch(err){alert(err.message)}finally{e.target.value=""}}
});
document.addEventListener("input",e=>{if(e.target.id==="stock-search")document.querySelectorAll("[data-stock]").forEach(el=>el.hidden=!el.dataset.stock.includes(e.target.value.toLowerCase()))});
$("#cancel").onclick=()=>$("#dialog").close();
$("#editor").onsubmit=async e=>{
 e.preventDefault();const {kind,id}=pending,p=Object.fromEntries(new FormData(e.target));
 const selected=e.target.elements.media?.files;
 delete p.media;
 for(const k of ["title","city"])if(k in p)p[k]=p[k].trim();
 for(const k of ["price","qty"])if(k in p)p[k]=Number(p[k]);
 p.id=crypto.randomUUID();if(kind==="shard")p.caseId=id;if(kind==="assign")p.shardId=id;if(kind==="move")p.itemId=id;
 const submit=e.target.querySelector('[type="submit"]');submit.disabled=true;
 try{
   if(selected){
     if(selected.length>8)throw Error("Максимум 8 файлов");
     if(Array.from(selected).reduce((n,file)=>n+file.size,0)>2000000)throw Error("Суммарный размер вложений не должен превышать 2 МБ");
     p.files=await Promise.all(Array.from(selected,async file=>{
       if(file.size>650000)throw Error("Файл "+file.name+" превышает 650 КБ");
       if(!["image/png","image/jpeg","image/webp","image/gif","application/pdf"].includes(file.type))throw Error("Недопустимый тип файла");
       const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Ошибка чтения файла"));reader.readAsDataURL(file)});
       return {id:crypto.randomUUID(),name:file.name.slice(0,180),data};
     }));
   }
   const operation=()=>{
     if(kind!=="electrical")return apply(state,kind,p);
     const caseId=p.id;
     let next=apply(state,"case",{id:caseId,title:p.title,city:p.city,price:p.price,address:p.address,notes:p.notes,files:p.files});
     const steps=[
       ["Разметка, штробы и подготовка трасс","Elektro · Rohbau",20],
       ["Прокладка кабелей и крепление трасс","Elektro · Kabel",25],
       ["Подрозетники, розетки, выключатели и световые точки","Elektro · Installation",20],
       ["Монтаж и сборка распределительного щита","Elektro · Verteiler",25],
       ["Измерения, проверка и приёмка Elektrofachkraft","Elektro · Prüfung",10]
     ];
     let allocated=0;
     steps.forEach(([title,kindName,percent],i)=>{
       const price=i===steps.length-1?Math.round((p.price-allocated)*100)/100:Math.round(p.price*percent)/100;
       allocated+=price;
       next=apply(next,"shard",{id:crypto.randomUUID(),caseId,title,kind:kindName,price,assignee:null});
     });
     return next;
   };
   if(await change(operation)){$("#dialog").close();if(kind==="case"||kind==="electrical")location.hash="case/"+p.id}
 }catch(error){alert(error.message||"Ошибка вложения")}
 finally{submit.disabled=false}
};
const navigation=[["dashboard","home","Главная"],["projects","layers","Проекты / задачи"],["lager","box","Lager"],["social","team","Лента"],["settings","settings","Настройки"]];
$("#nav").innerHTML=navigation.map(([route,sym,name])=>'<button data-route="'+route+'">'+icon(sym)+'<span>'+name+'</span></button>').join("");
document.querySelector('.mode [data-route="dashboard"]').innerHTML=icon("screen")+" Command Mode";
document.querySelector('.mode [data-route="field"]').innerHTML=icon("field")+" Field Mode";
addEventListener("hashchange",()=>{render();scrollTo(0,0)});
addEventListener("storage",e=>{if(e.key===KEY||e.key===null){try{readStore()}catch{damaged=true}$("#dialog").close();render()}});
render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
