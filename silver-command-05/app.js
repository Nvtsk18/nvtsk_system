(()=>{"use strict";
const BASE="nvtsk05_independent";
let lab=sessionStorage.getItem(BASE+"_mode")==="lab";
let KEY=lab?BASE+"_lab":BASE;
const  $=s=>document.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial=()=>({version:1,cases:[{id:"demo-1",title:"PV Dachmontage · Demo",city:"Stockach",price:12500},{id:"demo-2",title:"Solarprojekt · Demo",city:"Singen",price:8300}],shards:[{id:"sample-dc",title:"Монтаж DC · Demo",kind:"DC",caseId:"demo-1",price:800,assignee:"member-0",status:"draft"}],garage:[{id:"rail",title:"Einlegeschiene 5,90 м",qty:24,art:"rail"},{id:"clamp",title:"Mittelklemme 1,8 см",qty:48,art:"clamp"},{id:"module",title:"PV-модуль",qty:18,art:"module"},{id:"vertical",title:"CN37 · вертикаль",qty:36,art:"vertical"},{id:"van",title:"Sprinter 313 · Demo",qty:1,art:"van"}],crew:[{name:"Demo Monteur",role:"Monteur"}],tasks:[]});
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
const row=c=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb"></span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><span class="casemeta"><b>'+pct(c.id)+'%</b><small>'+money(c.price)+' €</small></span></button>';
const shard=s=>'<button class="shard" data-route="case/'+esc(s.caseId)+'"><span class="ring" style="--p:'+(s.status==="accepted"?100:0)+'%"><b>'+(s.status==="accepted"?"100%":"0%")+'</b></span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(s.status)+'</small></span><b>›</b></button>';
function dashboard(){const cases=state.cases.slice(0,4), accepted=state.shards.filter(s=>s.status==="accepted").length,waiting=state.shards.filter(s=>s.status==="submitted").length;
return '<section class="hero"><div><div class="eyebrow">NVTSK SYSTEM // SILVER COMMAND 0.5</div><h1>Добро пожаловать в NVTSK <em>//</em></h1><p>Оперативный центр управления проектами</p><div class="buttons">'+button("＋ Новый Case","new-case")+'<button data-route="projects">Все проекты ↗</button></div></div><div class="heroaside"><b>◉ LOCAL FIRST</b><small>Данные только в этом браузере. Синхронизация не подключена.</small></div></section><div class="stats">'+stat("▤","Активные Case",state.cases.length,"Проекты")+stat("◷","Shard",state.shards.length,"Задания")+stat("▦","Проекты",state.cases.length,"Всего")+stat("⬡","Garage",state.garage.length,"Позиции")+stat("♙","Команда",state.crew.length,"Участники")+stat("◉","Приёмка",state.shards.length?Math.round(100*accepted/state.shards.length)+"%":"—","Демо")+stat("◇","Merit",money(state.cases.reduce((n,c)=>n+c.price,0)),"Эмиссия Case")+'</div><div class="mobiletiles"><a href="#projects" class="mobiletile"><b>▱ Проекты</b><small>Case / Shard</small></a><a href="#garage" class="mobiletile"><b>⬡ Garage</b><small>Материалы</small></a><a href="#team" class="mobiletile"><b>♙ Команда</b><small>Исполнители</small></a><a href="#pulse" class="mobiletile"><b>▥ Аналитика</b><small>Project Pulse</small></a></div><section class="panel mobilework"><div class="panelhead"><h2>Текущие работы</h2><button data-route="projects">Все →</button></div>'+cases.map(row).join("")+'</section><div class="columns">'+panel("Активные Case ("+state.cases.length+")","projects",cases.map(row).join("")||"<p>Нет Case</p>")+'<div>'+panel("Shard в работе","projects",state.shards.slice(0,3).map(shard).join("")||'<p class="empty">Создайте Shard внутри Case</p>')+panel("Garage / Склад","garage",'<div class="fleet"><button data-route="garage"><b>⬡ Склад</b><small>Garage</small></button><button data-route="garage"><b>▤ Материалы</b><small>'+state.garage.length+' позиций</small></button></div>')+'</div><div>'+panel("Быстрые действия","projects",'<div class="actions">'+button("＋ Новый Case","new-case")+'<button data-route="projects">▱ Shard</button><button data-route="tasks">✓ Приёмка</button><button data-route="garage">▦ Выдача</button><button data-route="projects">▤ Проекты</button><button data-route="team">♙ Команда</button></div>')+panel("Ближайшие задачи","tasks",'<div class="taskrow">Ожидают проверки <b>'+waiting+'</b></div><div class="taskrow">Принятые этапы <b>'+accepted+'</b></div>')+'</div></div><div class="future"><span>Академия · скоро</span><span>Синхронизация · скоро</span><span>Интеграции · скоро</span></div>'}
const heading=(name,action="")=>'<div class="screenhead"><h1>'+name+'</h1>'+action+'</div>';
function projects(){return heading("Case / Проекты",button("＋ Новый Case","new-case"))+'<div class="cards">'+state.cases.map(c=>'<section class="panel item"><h2>'+esc(c.title)+'</h2><p>⌖ '+esc(c.city)+' · '+money(c.price)+' €</p><div class="progress"><i style="width:'+pct(c.id)+'%"></i></div><button class="action" data-route="case/'+esc(c.id)+'">Открыть Case →</button></section>').join("")+'</div>'}
const statusName={draft:"В работе",submitted:"На проверке",accepted:"Принято"};
const member=id=>state.crew.find(c=>c.id===id)?.name||"Без назначения";
const options=(items,value)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join("");
const teamOptions=()=>state.crew.map(c=>[c.id,c.name+" · "+c.role]);
function shardRow(s){
  let actions="";
  if(s.status==="draft" && lead())actions+=button("Назначить","assign",s.id);
  if(s.status==="draft" && state.actor===s.assignee)actions+=button("На проверку","submit",s.id);
  if(s.status==="submitted" && lead() && state.actor!==s.assignee)actions+=button("Принять","accept",s.id)+button("На доработку","revise",s.id);
  return '<article class="taskrow"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(member(s.assignee))+' · '+statusName[s.status]+'</small></div><div>'+actions+'</div></article>';
}
function detail(id){
  const c=state.cases.find(x=>x.id===id);
  if(!c)return heading("Case не найден");
  const shards=state.shards.filter(s=>s.caseId===id);
  return '<button class="back" data-route="projects">← Проекты</button><section class="panel casehead"><img src="art/roof.webp" alt=""><div><h1>'+esc(c.title)+'</h1><p>'+esc(c.city)+'</p><span class="progress"><i style="width:'+pct(id)+'%"></i></span><small>Готовность '+pct(id)+'%</small></div></section><div class="details">'+stat("▤","Shard",shards.length,"Этапы")+stat("€","Бюджет",money(c.price),"EUR")+stat("◇","Merit",money(c.price),"Эмиссия Case")+'</div><section class="panel"><div class="panelhead"><h2>Shards</h2><button data-route="garage">Garage</button></div>'+shards.map(shardRow).join("")+(lead()?button("＋ Новый Shard","new-shard",id):"")+'</section>';
}
function garage(){
  const moves=state.moves.slice().reverse();
  return '<div class="warehouse">'+heading("Склад //",warehouse()?button("＋ Добавить позицию","new-material"):"")+'</div><div class="columns stock"><section class="panel"><h2>Все позиции · '+state.garage.length+'</h2><label>Поиск по складу<input id="stock-search" type="search"></label><div class="cards">'+state.garage.map(m=>'<article class="panel item stockitem" data-stock="'+esc(m.title.toLowerCase())+'">'+(['rail','clamp','module','vertical','van'].includes(m.art)?'<img src="art/'+m.art+'.webp" alt="">':'')+'<h2>'+esc(m.title)+'</h2><p>Остаток · '+esc(m.qty)+'</p>'+(warehouse()?button("Движение","move",m.id):"")+'</article>').join("")+'</div></section><section class="panel"><h2>Движения</h2>'+moves.map(m=>'<div class="taskrow"><div>'+esc(state.garage.find(i=>i.id===m.itemId).title)+' · '+esc(m.qty)+'<small>'+({issue:"Выдача",return:"Возврат",receive:"Приход"})[m.type]+' · '+esc(state.shards.find(s=>s.id===m.shardId)?.title||"Склад")+'</small></div></div>').join("")+(!moves.length?"<p>Движений пока нет</p>":"")+'</section></div>';
}
function tasks(){return heading("Приёмка")+panel("На проверке","projects",state.shards.filter(s=>s.status==="submitted").map(shardRow).join("")||"<p>Очередь пуста</p>")}
function team(){return heading("Команда",lead()?button("＋ Участник","new-crew"):"")+panel("Участники","settings",state.crew.map(c=>'<div class="taskrow">'+esc(c.name)+' <small>'+esc(c.role)+'</small></div>').join(""))}
function profile(){return '<label>Локальный профиль<select id="actor">'+options(teamOptions(),state.actor)+'</select></label>'}
function field(){return heading("Field Mode")+profile()+panel("Мои Shard","projects",state.shards.filter(s=>s.assignee===state.actor).map(shardRow).join("")||"<p>Нет назначенных заданий</p>")}
function pulse(){return heading("Project Pulse")+panel("Готовность Case","projects",state.cases.map(row).join(""))}
function settings(){return heading("Настройки")+profile()+'<div class="panel tools"><button data-route="team">Команда и роли</button>'+button(lab?"Вернуться к рабочим данным":"Тестовая копия","sandbox")+button("Экспорт JSON","export")+(lead()?'<label>Импорт JSON<input id="import" type="file" accept=".json,application/json"></label>'+ (history.length?button("Time Machine · отменить последнюю операцию","undo"):""):"")+'</div><p>Профили действуют на этом устройстве. История хранит последние 10 операций.</p>'}
const pages={dashboard,projects,garage,tasks,team,field,settings,pulse};
function render(){
 const r=location.hash.slice(1)||"dashboard";
 $(".local").textContent=lab?"● ТЕСТОВАЯ КОПИЯ":"● LOCAL FIRST";
 $("#app").innerHTML=(lab?'<p class="labnotice">Тестовая копия · изменения изолированы</p>':"")+(damaged?'<p role="alert">Ошибка чтения. Для восстановления откройте настройки и импортируйте копию.</p>':'')+(r.startsWith("case/")?detail(r.slice(5)):Object.hasOwn(pages,r)?pages[r]():dashboard());
 document.querySelectorAll("#nav button,.mode button").forEach(b=>b.classList.toggle(b.closest("#nav")?"active":"selected",b.dataset.route===r||(b.closest(".mode")&&r!=="field"&&b.dataset.route==="dashboard")));
 if(!lead())document.querySelectorAll('[data-action="new-case"]').forEach(b=>b.remove());
}
const input=(name,text,type="text")=>'<label>'+text+'<input required name="'+name+'" type="'+type+'" '+(type==="number"?'min="0" max="1000000000000" step=".01"':'maxlength="120"')+'></label>';
const select=(name,text,items,value)=>'<label>'+text+'<select required name="'+name+'">'+options(items,value)+'</select></label>';
const pairs=items=>items.map(x=>[x,x]);
let pending;
function edit(kind,id){
 const s=state.shards.find(x=>x.id===id);
 const titles={case:"Новый Case",shard:"Новый Shard",material:"Новая позиция",crew:"Новый участник",assign:"Назначение",move:"Движение материала"};
 
 let fields=["case","shard","material","crew"].includes(kind)?input("title",kind==="crew"?"Имя":"Название"):"";
 if(kind==="case")fields+=input("city","Город")+input("price","Бюджет, €","number");
 if(kind==="shard")fields+=select("kind","Этап",pairs(["Projektierung","DC","AC","Anmeldung","Другое"]))+input("price","Стоимость Shard, €","number");
 if(kind==="shard"||kind==="assign")fields+=select("assignee","Исполнитель",teamOptions(),s?.assignee||state.crew.find(c=>c.role===roles[1])?.id);
 if(kind==="crew")fields+=select("role","Роль",pairs(roles),roles[1]);
 if(kind==="move")fields+=select("type","Операция",state.shards.length?[["issue","Выдача"],["return","Возврат"],["receive","Приход"]]:[["receive","Приход"]])+select("shardId","Case / Shard",(state.shards.length?[]:[["stock","Склад"]]).concat(state.shards.map(s=>[s.id,state.cases.find(c=>c.id===s.caseId).title+" / "+s.title])));
 if(kind==="material"||kind==="move")fields+=input("qty","Количество","number");
 pending={kind,id};$("#dialogTitle").textContent=titles[kind];$("#fields").innerHTML=fields;$("#dialog").showModal();
}
document.addEventListener("click",async e=>{
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
 for(const k of ["title","city"])if(k in p)p[k]=p[k].trim();
 for(const k of ["price","qty"])if(k in p)p[k]=Number(p[k]);
 p.id=crypto.randomUUID();if(kind==="shard")p.caseId=id;if(kind==="assign")p.shardId=id;if(kind==="move")p.itemId=id;
 const submit=e.target.querySelector('[type="submit"]');submit.disabled=true;
 try{if(await change(()=>apply(state,kind,p))){$("#dialog").close();if(kind==="case")location.hash="case/"+p.id}}finally{submit.disabled=false}
};
addEventListener("hashchange",()=>{render();scrollTo(0,0)});
addEventListener("storage",e=>{if(e.key===KEY||e.key===null){try{readStore()}catch{damaged=true}$("#dialog").close();render()}});
render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
