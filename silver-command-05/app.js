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
const row=c=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb"></span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><span class="casemeta"><b>'+pct(c.id)+'%</b><small>'+money(c.price)+' €</small></span></button>';
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
function dashboard(){
 const open=state.shards.filter(s=>s.status!=="accepted");
 const fleet=state.garage.filter(m=>["van","car","trailer"].includes(m.art));
 const people=new Set(open.map(s=>s.assignee).filter(Boolean));
 const completion=state.shards.length?Math.round(state.shards.filter(s=>s.status==="accepted").length/state.shards.length*100):0;
 const total=state.cases.reduce((n,c)=>n+c.price,0);
 const stats=[["layers","Активные кейсы",state.cases.filter(c=>pct(c.id)<100).length,"projects"],["box","Шарды (работы)",open.length,"tasks"],["settings","Проекты",state.cases.length,"projects"],["van","Гараж",fleet.filter(m=>m.qty>0).length+" / "+fleet.length,"garage"],["team","Команда",state.crew.length,"team"],["pulse","Загрузка",Math.round(100*people.size/Math.max(1,state.crew.length))+"%","pulse"],["coins","Merit",money(total),"pulse"]];
 const statsHtml=stats.map(([sym,label,value,route])=>'<button class="stat" data-route="'+route+'"><span class="symbol">'+icon(sym)+'</span><span class="stattext"><span class="statlabel">'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+(sym==="pulse"?'<span class="statbar"><i style="width:'+Math.round(100*people.size/Math.max(1,state.crew.length))+'%"></i></span>':"")+'</span></button>').join("");
 const caseRows=state.cases.slice(0,4).map((c,i)=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb"></span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'　 ·　 '+money(c.price)+' €</small></span><span class="casebadge">'+(i===0?"DC Монтаж":i===1?"AC Подключение":i===2?"Приёмка":"DC / AC")+'</span><span class="caseprogress"><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span><b>'+pct(c.id)+'%</b></span><span class="chevron">›</span></button>').join("")||'<p>Создайте первый Case</p>';
 const shardRows=open.slice(0,4).map(s=>'<button class="shard" data-route="case/'+esc(s.caseId)+'"><span class="shardicon">'+icon(s.kind==="DC"?"settings":s.kind==="AC"?"pulse":"box")+'</span><span class="shardtitle"><strong>'+esc(s.title)+'</strong><small>'+esc(state.cases.find(c=>c.id===s.caseId)?.city||"")+'</small></span><span class="ring" style="--p:'+(s.status==="submitted"?80:s.status==="accepted"?100:35)+'%"><b>'+(s.status==="submitted"?"80":s.status==="accepted"?"100":"35")+'%</b></span></button>').join("")||"<p>Нет активных Shard</p>";
 const cars=fleet.map(m=>'<button data-route="garage"><img alt="" src="art/'+esc(m.art)+'.webp"><strong>'+esc(m.title.replace(" · Demo",""))+'</strong><small>'+(m.qty>0?"● В работе":"Резерв")+'</small></button>').join("");
 const action=(sym,label,act,route)=>'<button '+(act?'data-action="'+act+'"':'data-route="'+route+'"')+'>'+icon(sym)+'<span>'+label+'</span></button>';
 const quick='<div class="actions">'+action("layers","Новый кейс","new-case")+action("box","Новый шард",state.cases.length?"new-shard":"new-case",null)+action("check","Приёмка",null,"tasks")+action("van","Выдача со склада",null,"garage")+action("settings","Сканер / QR",null,"garage")+action("screen","Фото объекта",null,"field")+'</div>';
 const tasks=open.slice(0,3).map((s,i)=>'<button class="tasklink" data-route="case/'+esc(s.caseId)+'"><span class="taskcheck">'+(i===0?"✓":"")+'</span><span>'+esc(s.title)+'</span><small>'+esc(statusName[s.status])+'</small></button>').join("")||"<p>Очередь пуста</p>";
 const footer='<div class="future"><span>'+icon("layers")+' Академия <small>Скоро</small></span><button data-route="settings">'+icon("team")+' Документы</button><button data-route="pulse">'+icon("coins")+' Токеномика (Merit)</button><span>'+icon("pulse")+' Синхронизация <small>Скоро</small></span><span>'+icon("settings")+' Интеграции <small>Скоро</small></span></div>';
 return '<section class="hero"><div><h1>Добро пожаловать в NVTSK <em>//</em></h1><p>Оперативное управление PV-проектами</p></div></section><div class="stats desktopmetrics">'+statsHtml+'</div><div class="columns">'+panel("Активные кейсы ("+state.cases.length+")","projects",caseRows)+'<div>'+panel("Шарды (в работе)","tasks",shardRows)+panel("Гараж / Автопарк","garage",'<div class="fleet">'+cars+'</div>')+'</div><div>'+panel("Быстрые действия","projects",quick)+panel("Ближайшие задачи","tasks",tasks)+'</div></div>'+footer;
}
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
function detail(id){
  const c=state.cases.find(x=>x.id===id);
  if(!c)return heading("Case не найден");
  const shards=state.shards.filter(s=>s.caseId===id);
  return '<button class="back" data-route="projects">← Проекты</button><section class="panel casehead"><img src="art/roof.webp" alt=""><div><h1>'+esc(c.title)+'</h1><p>'+esc(c.city)+'</p><span class="progress"><i style="width:'+pct(id)+'%"></i></span><small>Готовность '+pct(id)+'%</small></div></section><div class="details">'+stat("▤","Shard",shards.length,"Этапы")+stat("€","Бюджет",money(c.price),"EUR")+stat("◇","Merit",money(c.price),"Эмиссия Case")+'</div><section class="panel"><div class="panelhead"><h2>Shards</h2><button data-route="garage">Garage</button></div>'+shards.map(shardRow).join("")+(lead()?button("＋ Новый Shard","new-shard",id):"")+'</section><section class="panel"><h2>Материалы Case · история</h2>'+caseMaterialHistory(id)+'</section>';
}
function garage(){
  const moves=state.moves.slice().reverse();
  return '<div class="warehouse">'+heading("Склад //",warehouse()?button("＋ Добавить позицию","new-material"):"")+'</div><div class="columns stock"><section class="panel"><h2>Все позиции · '+state.garage.length+'</h2><label>Поиск по складу<input id="stock-search" type="search"></label><div class="cards">'+state.garage.map(m=>'<article class="panel item stockitem" data-stock="'+esc(m.title.toLowerCase())+'">'+(['rail','clamp','module','vertical','van','car','trailer'].includes(m.art)?'<img src="art/'+m.art+'.webp" alt="">':'')+'<h2>'+esc(m.title)+'</h2><p>Остаток · '+esc(m.qty)+'</p>'+(warehouse()?button("Движение","move",m.id):"")+'</article>').join("")+'</div></section><section class="panel"><h2>Движения</h2>'+moves.map(m=>'<div class="taskrow"><div>'+esc(state.garage.find(i=>i.id===m.itemId).title)+' · '+esc(m.qty)+'<small>'+({issue:"Выдача",return:"Возврат",receive:"Приход"})[m.type]+' · '+esc(state.shards.find(s=>s.id===m.shardId)?.title||"Склад")+'</small></div></div>').join("")+(!moves.length?"<p>Движений пока нет</p>":"")+'</section></div>';
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
 const active=mine.filter(s=>s.status==="draft");
 const review=mine.filter(s=>s.status==="submitted");
 const done=mine.filter(s=>s.status==="accepted");
 return heading("Field Mode")+profile()+
 '<div class="fieldsummary">'+stat(icon("clock"),"В работе",active.length,"")+stat(icon("check"),"На проверке",review.length,"")+stat(icon("layers"),"Принято",done.length,"")+'</div>'+
 panel("Мои задания · "+mine.length,"projects",mine.map(s=>{
 const c=state.cases.find(c=>c.id===s.caseId);
 return '<article class="fieldtask"><div class="fieldtaskhead"><div><strong>'+esc(s.title)+'</strong><small>'+esc(c?.title||"Case")+' · '+esc(c?.city||"")+'</small></div><span class="fieldstatus">'+esc(statusName[s.status])+'</span></div>'+shardRow(s)+'<button data-route="case/'+esc(s.caseId)+'">Открыть Case →</button></article>';
 }).join("")||'<p>Назначенных заданий пока нет. Руководитель может назначить Shard в карточке Case.</p>');
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
const pages={dashboard,projects,garage,tasks,team,field,settings,pulse};
function render(){
 const r=location.hash.slice(1)||"dashboard";
 $(".local").textContent=lab?"● ТЕСТОВАЯ КОПИЯ":"● LOCAL FIRST";
 $("#app").innerHTML=(lab?'<p class="labnotice">Тестовая копия · изменения изолированы</p>':"")+(damaged?'<p role="alert">Ошибка чтения. Для восстановления откройте настройки и импортируйте копию.</p>':'')+(r.startsWith("case/")?detail(r.slice(5)):Object.hasOwn(pages,r)?pages[r]():dashboard());
 document.querySelectorAll("#nav button,.mode button").forEach(b=>b.classList.toggle(b.closest("#nav")?"active":"selected",b.dataset.route===r||(b.closest(".mode")&&r!=="field"&&b.dataset.route==="dashboard")||(b.closest("#nav")&&r.startsWith("case/")&&b.dataset.route==="projects")));
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
const navigation=[["dashboard","home","Главная"],["projects","layers","Проекты"],["garage","box","Склад"],["tasks","check","Задачи"],["settings","settings","Настройки"]];
$("#nav").innerHTML=navigation.map(([route,sym,name])=>'<button data-route="'+route+'">'+icon(sym)+'<span>'+name+'</span></button>').join("");
document.querySelector('.mode [data-route="dashboard"]').innerHTML=icon("screen")+" Command Mode";
document.querySelector('.mode [data-route="field"]').innerHTML=icon("field")+" Field Mode";
addEventListener("hashchange",()=>{render();scrollTo(0,0)});
addEventListener("storage",e=>{if(e.key===KEY||e.key===null){try{readStore()}catch{damaged=true}$("#dialog").close();render()}});
render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
