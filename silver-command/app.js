(() => {
"use strict";
const KEY = "nvtsk_silver_04_demo";
const $ = s => document.querySelector(s);
const encode = v => String(v ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const money = n => Number(n || 0).toLocaleString("ru-RU");
const uuid = () => "lot-" + Math.random().toString(36).slice(2,10);
const tabs = [["dashboard","⌂","Главная"],["projects","▤","Проекты"],["garage","▦","Склад"],["tasks","☑","Задачи"],["settings","⚙","Настройки"]];
const kinds = [["PLAN","Projektierung"],["DC","DC-Montage"],["AC","AC-Anschluss"],["REG","Anmeldung"]];
const initial = [
  {id:"stock",title:"20 кВт DC • Stockach",city:"Stockach",client:"Демо Solarbau Süd",price:2000,kind:"DC",creator:"demo-client",parent:null,members:[],bids:[]},
  {id:"singen",title:"14,8 кВт DC • Singen",city:"Singen",client:"Демо Hegau Energie",price:1480,kind:"DC",creator:"demo-client",parent:null,members:[],bids:[{amount:1380,team:"SüdMontage (демо)"}]},
  {id:"uber",title:"12 кВт AC • Überlingen",city:"Überlingen",client:"Демо Bodensee PV",price:1200,kind:"AC",creator:"demo-client",parent:null,members:[],bids:[]}
];
const fresh = () => ({schemaVersion:2,lots:JSON.parse(JSON.stringify(initial)),name:"Участник",merit:3000,crew:["Участник","Роман","Денис","Олена"],stages:[],posts:[],audit:[]});
const validLot = l => l && typeof l.id==="string" && !!l.id.trim() && l.id.length<=100 && typeof l.title==="string" && !!l.title.trim() && l.title.length<=300 && typeof l.creator==="string" && !!l.creator.trim() && l.creator.length<=100 && (l.parent===null || (typeof l.parent==="string" && !!l.parent.trim())) && (l.assignee==null || (typeof l.assignee==="string" && !!l.assignee.trim() && l.assignee!==l.creator)) && Array.isArray(l.members) && l.members.length<=100 && l.members.every(m=>typeof m==="string" && !!m.trim()) && new Set(l.members).size===l.members.length && Array.isArray(l.bids) && l.bids.length<=100 && l.bids.every(b=>b && typeof b.team==="string" && !!b.team.trim() && Number.isFinite(b.amount) && b.amount>0 && b.amount<=100000000 && (b.mine===undefined || typeof b.mine==="boolean")) && (l.description===undefined || (typeof l.description==="string" && l.description.length<=2000)) && (l.kind!=="CUSTOM" || (typeof l.title==="string" && !!l.title.trim())) && Number.isFinite(l.price) && l.price>=0 && l.price<=100000000;
function normalize(raw) {
 if(!raw || !Array.isArray(raw.lots) || raw.lots.length>2000 || !raw.lots.every(validLot)) throw Error("Invalid saved lot data");
 if(!Array.isArray(raw.stages)||!Array.isArray(raw.posts)||!Array.isArray(raw.crew)||!Array.isArray(raw.audit))throw Error("Invalid saved collections");
 if(raw.crew.length>100||raw.crew.some(x=>typeof x!=="string"||!x.trim()||x.length>100)||new Set(raw.crew).size!==raw.crew.length)throw Error("Invalid crew");
 if(raw.audit.length>3000||raw.audit.some(x=>!x||typeof x!=="object"||typeof x.action!=="string"||typeof x.at!=="string"))throw Error("Invalid audit");
 const ids=new Set(raw.lots.map(l=>l.id));
 if(ids.size!==raw.lots.length || raw.lots.some(l=>l.parent!==null && (!ids.has(l.parent)||l.parent===l.id)))throw Error("Invalid lot references");
 for(const l of raw.lots){const seen=new Set([l.id]);let p=l.parent;while(p!==null){if(seen.has(p))throw Error("Cyclic lot hierarchy");seen.add(p);p=raw.lots.find(x=>x.id===p).parent;}}
 const stageApi=window.NVTSK_STAGE;
 const seenStages=new Set();
 const stages=Array.isArray(raw.stages)&&stageApi?raw.stages.filter(s=>{
   if(!stageApi.validStage(s)||!ids.has(s.lotId)||!s.id.trim()||seenStages.has(s.id)||s.history.length>300||s.evidence.length>100)return false;
   const lot=raw.lots.find(l=>l.id===s.lotId);
   if(!s.ownerId||typeof s.ownerId!=="string"||!s.ownerId.trim()||s.ownerId===lot.creator)return false;
   if(s.evidence.some(e=>!e.id.trim())||new Set(s.evidence.map(e=>e.id)).size!==s.evidence.length)return false;
   if(["AC","REG"].includes(lot.kind))return false;
   if(s.ownerId!==lot.assignee)return false;
   if(s.status==="accepted"&&(s.reviewerId!==lot.creator||s.reviewerId===s.ownerId))return false;
   seenStages.add(s.id);return true;
 }).slice(0,500):[];
 const socialApi=window.NVTSK_SOCIAL;
 const seenPosts=new Set();
 const posts=Array.isArray(raw.posts)&&socialApi?raw.posts.filter(p=>{if(!socialApi.valid(p)||!ids.has(p.lotId)||seenPosts.has(p.id))return false;seenPosts.add(p.id);return true;}).slice(-500):[];
 const warnings=[];
 if(Array.isArray(raw.stages)&&raw.stages.length!==stages.length)warnings.push("Фотоэтапы: отклонено или ограничено записей "+(raw.stages.length-stages.length));
 if(Array.isArray(raw.posts)&&raw.posts.length!==posts.length)warnings.push("Лента: отклонено или ограничено записей "+(raw.posts.length-posts.length));
 return {...fresh(),...raw,stages,posts,recoveryWarnings:warnings,schemaVersion:2,audit:Array.isArray(raw.audit)?raw.audit.slice():[],name:String(raw.name||"Участник").slice(0,80),merit:Number.isFinite(raw.merit)&&raw.merit>=0?raw.merit:0,crew:Array.isArray(raw.crew)?raw.crew.slice(0,100):[]};
}
let state,storageError="";
let recoveryLock=false;
try {const saved=localStorage.getItem(KEY);state=saved?normalize(JSON.parse(saved)):fresh();}
catch (err) {
 state=fresh();recoveryLock=true;storageError="Сохранённые данные повреждены или недоступны. Исходная запись не перезаписана; экспортируйте её перед созданием новых данных.";
 console.warn("NVTSK storage recovery:",err);
}
if(state.recoveryWarnings?.length){recoveryLock=true;storageError="При загрузке отклонены некорректные записи: "+state.recoveryWarnings.join("; ")+". Запись заблокирована, чтобы не уничтожить исходные данные. Экспортируйте исходную копию; восстановление требует проверки.";}
const log=(action,lotId,details="")=>{state.audit.push({at:new Date().toISOString(),action,lotId,actor:"me",details});state.audit=state.audit.slice(-3000)};

let screen = "dashboard";
let selected = "singen";
let demoActor = "me"; // local stage simulation only, never authentication
let projectPage = 0;
const projectPages = ["Обзор","Этапы","Лента","Сублоты и исполнители"];
function projectNav(){return '<div class="row project-pages" role="navigation" aria-label="Страницы проекта">'+projectPages.map((name,i)=>'<button type="button" class="btn sm '+(i===projectPage?"primary":"")+'" data-act="project-page" data-page="'+i+'">'+encode(name)+'</button>').join("")+'</div>';}
const save = () => {try{
 if(recoveryLock){storageError="Запись заблокирована: сначала экспортируйте повреждённые данные или восстановите корректную копию.";return false;}
 if(storageError && !sessionStorage.getItem("nvtsk04_original_saved")){
   const original=localStorage.getItem(KEY);
   if(original!==null)sessionStorage.setItem("nvtsk04_original_saved",original);
 }
 localStorage.setItem(KEY,JSON.stringify(state));storageError="";return true;
 }catch(err){storageError="Не удалось сохранить данные на устройстве. Освободите место или экспортируйте демоданные.";console.error(err);return false;}};
const notify = msg => {window.alert(msg)};

const find = id => state.lots.find(l => l.id === id);
window.NVTSK_GARAGE?.setProjects(()=>state.lots.map(l=>({id:l.id,title:l.title,assignee:l.assignee,creator:l.creator,kind:l.kind})));
window.NVTSK_GARAGE?.setActor(()=>demoActor === "me" ? "demo-client" : demoActor);
const garageCost = id => (window.NVTSK_GARAGE?.usageForProject(id)||[]).reduce((sum,u)=>sum+u.cost,0);
const pulse = (lot, stages) => {
 const relevant=stages.filter(s=>s.lotId===lot.id);
 const accepted=relevant.filter(s=>s.status==="accepted").length;
 const pending=relevant.filter(s=>s.status==="submitted").length;
 const returned=relevant.filter(s=>s.status==="returned").length;
 return {total:relevant.length,accepted,pending,returned,percent:relevant.length?Math.round(accepted/relevant.length*100):0};
};
const pulseView = l => {
 const p=pulse(l,state.stages);
 const label=p.total ? p.accepted+" из "+p.total+" этапов приняты" : "Этапы ещё не созданы";
 const warning=p.returned ? " · "+p.returned+" на исправлении" : p.pending ? " · "+p.pending+" ожидают проверки" : "";
 return '<div class="pulse" role="group" aria-label="Project Pulse"><div class="between"><span class="small">Project Pulse · '+encode(label+warning)+'</span><b>'+p.percent+'%</b></div><div class="pulse-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p.percent+'" aria-label="Принятые этапы"><div class="pulse-fill" style="width:'+p.percent+'%"></div></div></div>';
};
const role = l => l.creator === "me" ? "Заказчик" : l.assignee === "me" || (l.members || []).includes("me") ? "Исполнитель" : (l.bids || []).some(b => b.mine) ? "Кандидат" : "Наблюдатель";
const button = (act, label, id) => '<button class="btn sm" data-act="' + act + '" data-id="' + (id || "") + '">' + label + '</button>';
const panel = content => '<section class="glass work">' + content + '</section>';
const badge = text => '<span class="pill blue">' + encode(text) + '</span>';
function item(l) {
  return panel(badge(l.kind) + '<h3 style="font-size:19px;margin-top:12px">' + encode(l.title) + '</h3><p>' + encode(l.client) + '</p><div class="stat" style="margin:10px 0">' + money(l.price) + ' €</div><div class="small muted">' + role(l) + '</div>'+pulseView(l)+'<div style="margin-top:12px">' + button("lot","Открыть лот",l.id) + '</div>');
}
function weatherPanel(l) {
 const parent = l.parent ? find(l.parent) : null;
 const address = l.address || l.city || parent?.address || parent?.city || "";
 return '<section class="weather-widget"><div class="weather-top"><div><div class="overline">ПОГОДА ОБЪЕКТА</div><strong>☁ '+encode(address||"Адрес не указан")+'</strong></div><span class="weather-tag">НЕТ ДАННЫХ</span></div><div class="weather-metrics"><div><b>— °C</b><small>Температура</small></div><div><b>— мм/ч</b><small>Осадки</small></div><div><b>— км/ч</b><small>Порывы ветра</small></div></div><p class="small">Прогноз пока не подключён. Для точной погоды потребуется адрес и погодный сервис.</p></section>';
}
function overview() {
 const roots=state.lots.filter(l=>!l.parent),children=state.lots.filter(l=>l.parent);
 const accepted=state.stages.filter(s=>s.status==="accepted").length;
 const waiting=state.stages.filter(s=>s.status==="submitted").length;
 const active=roots.slice(0,4);
 const stat=(icon,label,value,detail)=>'<div class="cockpit-stat"><span class="cockpit-stat-icon">'+icon+'</span><div><div class="cockpit-stat-label">'+label+'</div><strong>'+value+'</strong><div class="cockpit-stat-detail">'+detail+'</div></div></div>';
 const cases=active.map((l,i)=>'<div class="cockpit-case"><div class="cockpit-case-index">'+String(i+1).padStart(2,"0")+'</div><div class="cockpit-case-main"><strong>'+encode(l.title)+'</strong><small>⌖ '+encode(l.city||"Адрес не указан")+' · '+encode(l.kind)+'</small></div><span class="cockpit-case-cost">'+money(l.price)+' €</span>'+button("lot","Открыть",l.id)+'</div>').join("");
 const shards=children.slice(0,4).map(l=>'<div class="cockpit-shard"><span class="cockpit-shard-dot"></span><div><strong>'+encode(l.title)+'</strong><small>'+encode(l.city||find(l.parent)?.city||"")+'</small></div>'+button("lot","Открыть",l.id)+'</div>').join("");
 return '<div class="stack command-home cockpit">'+
 (storageError?panel('<strong>⚠ '+encode(storageError)+'</strong><p class="small">Сохраните исходные данные.</p>'+button("export-raw","↓ Сохранить запись")):"")+
 '<section class="cockpit-hero"><div class="cockpit-intro"><div class="overline">NVTSK SYSTEM // SILVER COMMAND 0.4</div><h2>Центр управления <em>//</em></h2><p>Проекты · Команда · Ресурсы · Выполнение</p><div class="cockpit-hero-actions">'+button("new","＋ Новый Case")+'<a href="#projects" data-screen="projects" class="btn sm">Все проекты ↗</a></div></div><div class="cockpit-weather"><div class="between"><span class="overline">◉ ОПЕРАТИВНАЯ ПОГОДА</span><span class="cockpit-live">ДЕМО</span></div><h3>Погода на объектах</h3><p>Для прогноза откройте Case или Shard</p><div class="forecast-locations">'+active.map(l=>'<span>⌖ '+encode(l.city||"Адрес не указан")+'</span>').join('')+'</div><div class="cockpit-weather-footer">☁ Температура — °C &nbsp; ◈ Осадки — мм/ч &nbsp; ≋ Порывы — км/ч</div><small>Живые данные ещё не подключены</small></div></section>'+
 '<div class="cockpit-stats">'+stat("▤","Активные Case",roots.length,"Локальные проекты")+stat("⬡","Shard в работе",children.length,"Рабочие задания")+stat("◉","Ожидают приёмки",waiting,"Требуют проверки")+stat("✓","Принято этапов",accepted,"Демо-приёмка")+stat("▦","Garage","●","Склад и ресурсы")+stat("◎","Команда",state.crew.length,"Участники")+'</div>'+
 '<div class="cockpit-columns"><section class="cockpit-panel cockpit-cases"><div class="cockpit-panel-heading"><h2>Активные Case <span>('+roots.length+')</span></h2><a href="#projects" data-screen="projects">Все Case →</a></div><div class="cockpit-case-list">'+(cases||'<p>Создайте первый Case.</p>')+'</div></section>'+
 '<div class="cockpit-middle"><section class="cockpit-panel"><div class="cockpit-panel-heading"><h2>Shard в работе</h2><a href="#projects" data-screen="projects">Все Shard →</a></div><div class="cockpit-shards">'+(shards||'<p>Shard пока не созданы. Добавьте задания внутри Case.</p>')+'</div></section><section class="cockpit-panel"><div class="cockpit-panel-heading"><h2>Garage / Автопарк</h2><a href="#garage" data-screen="garage">Управление →</a></div><div class="cockpit-fleet"><div>🚐<strong>Команда</strong><small>Транспорт</small></div><div>▣<strong>Материалы</strong><small>Склад</small></div><div>◈<strong>Резервы</strong><small>Shard</small></div></div></section></div>'+
 '<div class="cockpit-right"><section class="cockpit-panel"><div class="cockpit-panel-heading"><h2>Быстрые действия</h2></div><div class="cockpit-actions">'+button("new","＋ Новый Case")+'<a href="#projects" data-screen="projects">⬡ Shard</a><a href="#tasks" data-screen="tasks">✓ Приёмка</a><a href="#garage" data-screen="garage">▦ Выдача</a></div></section><section class="cockpit-panel"><div class="cockpit-panel-heading"><h2>Ближайшие задачи</h2><a href="#tasks" data-screen="tasks">Открыть →</a></div><div class="cockpit-task">◉ Ожидают проверки <b>'+waiting+'</b></div><div class="cockpit-task">✓ Принятые этапы <b>'+accepted+'</b></div><p class="small">Реальные сроки задач будут добавлены позже.</p></section></div></div>'+
 '<div class="cockpit-future"><span>Академия · скоро</span><a href="#settings" data-screen="settings">Документы</a><span>Merit · скоро</span><span>Синхронизация · скоро</span><span>Интеграции · скоро</span></div></div>';
}
function market() {
 return '<div class="stack">'+panel('<h2>Карта и биржа</h2><p>Пока схема региона и демо-объекты. Для реального поиска потребуется геокодирование и сервер.</p>') +
 '<div class="grid g3">'+state.lots.map(item).join("")+'</div></div>';
}
function projects() {
 return '<div class="stack">'+panel('<div class="between"><h2>Проекты и сублоты</h2>'+button("new","＋ Создать")+'</div><p>Projektierung, DC-Montage, AC-Anschluss, Anmeldung с отдельными бюджетами.</p>') +
 '<div class="grid g3">'+state.lots.filter(l=>!l.parent).map(item).join("")+'</div></div>';
}
function stagePanel(l){
 const d=window.NVTSK_STAGE;
 if(!d)return panel('<h2>Фотоэтапы</h2><p>Модуль недоступен. Обновите страницу.</p>');
 const stages=state.stages.filter(s=>s.lotId===l.id);
 let content='<h2>Фотоэтапы · демонстрация</h2><p class="small">Переключение персонажа только для теста, не авторизация. Файлы не загружаются.</p><label>Персонаж для проверки <select id="demoActor"><option value="me"'+(demoActor==="me"?" selected":"")+'>Автор / я</option><option value="roman"'+(demoActor==="roman"?" selected":"")+'>Роман</option><option value="denis"'+(demoActor==="denis"?" selected":"")+'>Денис</option><option value="olena"'+(demoActor==="olena"?" selected":"")+'>Олена</option></select></label>';
 if(l.assignee===demoActor && l.assignee!==l.creator && ["DC","PLAN"].includes(l.kind))content+=button("stage-new","＋ Новый этап",l.id);
 for(const s of stages){
  content+='<div class="tile"><b>'+encode(s.title)+'</b> · '+badge(s.status)+'<p class="small">План рев. '+s.revision+' · '+s.evidence.length+' записей</p>';
  for(const ev of s.evidence)content+='<div class="small">'+encode(ev.type)+': '+encode(ev.note)+(ev.pdfPage?' · PDF стр. '+ev.pdfPage:'')+'</div>';
  if(s.ownerId===demoActor&&s.status!=="accepted")content+='<div class="row">'+button("stage-evidence","＋ До/после",s.id)+button("stage-submit","На проверку",s.id)+'</div>';
  if(l.creator===demoActor&&s.ownerId!==demoActor&&s.status==="submitted")content+='<div class="row">'+button("stage-accept","Принять (демо)",s.id)+button("stage-return","Вернуть",s.id)+'</div>';
  content+='</div>';
 }
 return panel(content);
}
function stageAction(act,id){
 const d=window.NVTSK_STAGE;if(!d)return;
 const stage=state.stages.find(s=>s.id===id);
 if(act==="stage-new"){
  const l=find(id);if(!l||l.assignee!==demoActor||l.assignee===l.creator||!["DC","PLAN"].includes(l.kind))return notify("Создать этап может только назначенный независимый исполнитель DC/Projektierung. AC/Anmeldung заблокированы.");
  const ownerId=l.assignee;if(ownerId===l.creator)return notify("Сначала назначьте независимого исполнителя.");
  const title=prompt("Название этапа (демо):","Монтаж DC");if(!title?.trim())return;
  state.stages.push(d.createStage({id:uuid(),lotId:id,title,ownerId,planRevision:1}));
  log("stage_created",id,title);save();render();return;
 }
 if(!stage)return;const lot=find(stage.lotId);if(!lot)return;
 try{
  if(act==="stage-evidence"){
   const type=prompt("Тип доказательства: before или after","before");
   if(!["before","after"].includes(type))return;
   const note=prompt("Описание / ссылка на документ (не загружайте личные данные)","");
   if(!note?.trim())return;
   const pageText=prompt("Номер страницы PDF (пусто = нет)","");
   const pdfPage=pageText?.trim()?Number(pageText):null;
   d.addEvidence(stage,{id:uuid(),actor:demoActor,type,note,planRevision:stage.revision,pdfPage});
  }else if(act==="stage-submit")d.submit(stage,demoActor);
  else if(act==="stage-accept")d.review(stage,{actor:demoActor,decision:"accepted",lotCreator:lot.creator});
  else if(act==="stage-return"){
   const reason=prompt("Причина возврата:","");if(reason===null)return;
   d.review(stage,{actor:demoActor,decision:"returned",reason,lotCreator:lot.creator});
  }
  log(act,lot.id,stage.id);save();render();
 }catch(err){notify("Этап не изменён: "+err.message)}
}
function socialPanel(l){
 const api=window.NVTSK_SOCIAL;
 if(!api)return panel('<h2>Лента лота</h2><p>Модуль недоступен.</p>');
 const posts=state.posts.filter(p=>api.canRead(p,l,demoActor));
 let html='<h2>Лента лота · локальная демоверсия</h2><p class="small">Только участники лота. Переключатель персонажа в разделе фотоэтапов имитирует роль, но не защищает данные.</p>';
 if(api.member(l,demoActor))html+='<label>Новая запись<textarea id="postBody" maxlength="1000" rows="3" placeholder="Обновление по объекту"></textarea></label>'+button("post-add","Опубликовать (демо)",l.id);
 else html+='<p class="small">Для записи требуется участие в лоте.</p>';
 for(const p of posts){html+='<div class="tile"><b>'+encode(p.authorId)+'</b><p>'+encode(p.body)+'</p>';
 for(const c of p.comments)html+='<div class="small">↳ '+encode(c.authorId)+': '+encode(c.body)+'</div>';
 html+='<label>Комментарий<input id="comment-'+encode(p.id)+'" maxlength="500" placeholder="Ответить"></label>'+button("post-comment","Отправить",p.id)+'</div>';}
 return panel(html);
}
function socialAction(act,id){
 const api=window.NVTSK_SOCIAL;if(!api)return;
 try{
 if(act==="post-add"){
  const l=find(id);if(!l)return;
  if(state.posts.length>=500)throw Error("Лимит записей демоверсии");
  const body=$("#postBody")?.value;
  state.posts.push(api.create({lot:l,actor:demoActor,body}));log("post_created",id);
 }else if(act==="post-comment"){
  const p=state.posts.find(x=>x.id===id);if(!p)return;
  const l=find(p.lotId),body=document.getElementById("comment-"+id)?.value;
  api.comment(p,{lot:l,actor:demoActor,body});log("comment_created",p.lotId);
 }
 save();render();
 }catch(err){notify("Лента: "+err.message)}
}
function lotScreen() {
 const l = find(selected); if (!l) return projects();
 const subs = state.lots.filter(x=>x.parent===l.id);
 let sublist = subs.length ? subs.map(x=>'<div class="listrow"><div><b>'+encode(x.title)+'</b><div class="small muted">'+encode(x.description||"Без описания")+' · '+money(x.price)+' €</div></div>'+button("lot","Открыть",x.id)+'</div>').join("") : '<p>Шардов пока нет.</p>';
 let bidlist = (l.bids||[]).map(b=>'<div class="listrow"><span>'+encode(b.team)+'</span><b>'+money(b.amount)+' €</b></div>').join("");
 return '<div class="stack">'+projectNav()+(projectPage===0?panel('<div class="overline">LOT '+encode(l.id)+'</div><h2 style="font-size:26px;margin:9px 0">'+encode(l.title)+'</h2><p>'+encode(l.city)+' • '+encode(l.client)+'</p><div class="stat">'+money(l.price)+' €</div>'+pulseView(l)+weatherPanel(l)+'<p class="small">Материалы Garage (локальный деморасход): '+money(garageCost(l.id))+' €</p><div class="row" style="margin-top:14px">'+badge(role(l))+(l.parent?"":button("shard-new","＋ Добавить Shard",l.id))+button("projects","← Проекты")+'</div>') : "")+(projectPage===1?stagePanel(l):"")+(projectPage===2?socialPanel(l):"")+(projectPage===3?'<div class="grid maincols">'+panel('<div class="between"><h2>Шарды</h2>'+(l.parent?'':button('shard-new','＋ Добавить',l.id))+'</div>'+sublist+'<div class="line"></div><h2>Монтажный чек-лист</h2><p>Фотоэтапы с описанием до/после, номером страницы PDF и независимой демоприёмкой доступны выше. Файлы фотографий и PDF пока не загружаются. Stringplan, Erdung и реальные подписи требуют отдельной реализации.</p>') +
 panel('<h2>Аукцион</h2>'+bidlist+'<label>Моя ставка, €<input id="bid" type="number" min="1"></label><div style="margin-top:10px">'+button("bid","Подать ставку")+'</div><div class="line"></div><label>Назначенный исполнитель<select id="assignee"><option value="">Не назначен</option><option value="me">Я (исполнитель)</option><option value="roman">Роман</option><option value="denis">Денис</option><option value="olena">Олена</option></select></label><div style="margin-top:10px">'+button("assign","Назначить (демо)")+'</div><p class="small" style="margin-top:10px">Роль определяется отдельно для этого лота. Самому себе выдавать контракт собственного лота нельзя.</p>')+'</div>':"")+'</div>';
}
function chat() {
 return panel('<h2>Коммуникация</h2><p>Ленты объектов, сообщения и комментарии входят в архитектуру. Для настоящего межпользовательского чата нужны авторизация и сервер, поэтому здесь пока только концептуальный экран.</p><div class="tile">Личные сообщения • Чаты объектов • Социальная лента • Уведомления</div>');
}
function profile() {
 return '<div class="stack">'+panel('<div class="row"><div class="avatar big">'+encode(state.name[0])+'</div><div><h2>'+encode(state.name)+'</h2><p>Ваше имя, без выбора роли при регистрации</p></div></div><div style="margin-top:14px">'+button("edit-name","✎ Изменить имя")+'</div>')+
 '<p class="small">⚠ Общий экспорт включает проекты и Garage, но пока архивный: единое восстановление не поддерживается. Сохраните также отдельные резервные копии. Импорт ниже принимает только копию проектов и не меняет Garage.</p><div style="margin:12px 0" class="row">'+button("export","↓ Архив Case + Garage (без общего импорта)")+button("import","↑ Импорт только проектов")+'</div><div class="grid g3">'+panel('<div class="statlabel">Legacy</div><div class="stat">8500</div>')+panel('<div class="statlabel">Merit</div><div class="stat">'+money(state.merit)+'</div>')+panel('<div class="statlabel">Бригада</div><div class="stat">'+state.crew.length+'</div>')+'</div>'+
 panel('<h2>Команда и MentorGate</h2><p>Здесь будут навыки, Merit, финансовая история, капитан и администраторы бригад, наставничество и личные проекты.</p><div class="tile">'+state.crew.map(encode).join(" • ")+'</div>')+'</div>';
}
function tasks() {
 const stages=state.stages||[];
 const statuses={draft:"Черновик",submitted:"На проверке",accepted:"Принято",returned:"На исправлении"};
 return '<div class="stack">'+panel('<div class="between"><h2>Задачи · фотоэтапы</h2><span class="pill">DEMO</span></div><p>Откройте проект, чтобы создать этап, приложить свидетельства и провести независимую демоприёмку.</p>')+
 '<div class="grid g3">'+panel('<div class="statlabel">Всего этапов</div><div class="stat">'+stages.length+'</div>')+panel('<div class="statlabel">На проверке</div><div class="stat">'+stages.filter(s=>s.status==="submitted").length+'</div>')+panel('<div class="statlabel">Принято</div><div class="stat">'+stages.filter(s=>s.status==="accepted").length+'</div>')+'</div>'+
 panel('<h2>Список задач</h2>'+(stages.length?stages.map(t=>{const l=find(t.lotId);return '<div class="listrow"><div><b>'+encode(t.title)+'</b><div class="small muted">'+encode(l?.title||"Неизвестный проект")+' · '+encode(statuses[t.status]||t.status)+'</div></div>'+(l?button("lot","Открыть",l.id):"")+'</div>'}).join(""):'<p>Задач пока нет. Создайте этап внутри проекта.</p>'))+'</div>';
}
function settings() {
 return '<div class="stack">'+panel('<div class="between"><h2>Настройки системы</h2><span class="pill">LOCAL FIRST</span></div><p>Профиль и данные доступны сейчас. Остальные модули появятся после стабилизации MVP.</p>')+
 profile()+
 panel('<h2>Следующие модули</h2><div class="settings-modules">'+["Организация","Уведомления","Рабочие процессы","Автопарк","Интеграции","Синхронизация","Безопасность","Токеномика"].map(x=>'<div class="tile"><b>'+x+'</b><span class="pill">Скоро</span></div>').join("")+'</div>')+'</div>';
}
function render() {
 for (const sel of ["#desktopNav","#mobileNav"]) {
   $(sel).innerHTML = tabs.map(t=>'<a href="#'+t[0]+'" data-screen="'+t[0]+'" class="'+(screen===t[0]?"active":"")+'"><span class="ico">'+t[1]+'</span>'+t[2]+'</a>').join("");
 }
 $("#screenTitle").textContent = tabs.find(t=>t[0]===screen)?.[2] || "Лот";
 const view = screen==="dashboard"?overview():screen==="map"?market():screen==="projects"?projects():screen==="chats"?chat():screen==="profile"?profile():screen==="tasks"?tasks():screen==="settings"?settings():screen==="garage"?(window.NVTSK_GARAGE?.render()||"<p>Склад недоступен</p>"):lotScreen();
 $("#app").innerHTML=view;
}
window.NVTSK_GARAGE_REFRESH=()=>{if(screen==="garage")render()};
function routeHash(){return screen==="lot"?"#lot/"+encodeURIComponent(selected)+"/"+projectPage:"#"+screen}
function syncRoute(replace=false){const h=routeHash();if(location.hash!==h)history[replace?"replaceState":"pushState"]({nvtsk:true},"",h)}
function go(s){if(s==="lot" && screen!=="lot")projectPage=0;screen=s;render();window.scrollTo(0,0);syncRoute()}
function setProjectPage(n){if(screen!=="lot"||!Number.isInteger(n)||n<0||n>=projectPages.length)return;projectPage=n;render();window.scrollTo(0,0);syncRoute()}
function restoreRoute(){
 let h="";
 try { h=decodeURIComponent(location.hash.slice(1)); }
 catch (_) { h=""; } // malformed URL fragments must not blank the application
 const m=/^lot\/([^/]+)\/(\d+)$/.exec(h);
 if(m&&state.lots.some(l=>l.id===m[1])&&Number(m[2])<projectPages.length){selected=m[1];projectPage=Number(m[2]);screen="lot";}
 else if(tabs.some(t=>t[0]===h)){screen=h;}
 else {screen="dashboard";}
 render();window.scrollTo(0,0);
}
let touchStart=null;
document.addEventListener("touchstart",e=>{if(screen!=="lot"||e.touches.length!==1||e.target.closest("input,textarea,select,button,a,label,[contenteditable],.project-pages,.modal,.garage-scroll")){touchStart=null;return;}const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
document.addEventListener("touchcancel",()=>{touchStart=null;},{passive:true});
document.addEventListener("touchend",e=>{if(!touchStart||screen!=="lot"||e.changedTouches.length!==1)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)<90||Math.abs(dx)<Math.abs(dy)*1.7)return;setProjectPage(projectPage+(dx>0?1:-1));},{passive:true});
function modal(html){$("#dialog").innerHTML=html;$("#dialogBackdrop").hidden=false}
function close(){$("#dialogBackdrop").hidden=true}
function create() {
 modal('<h2>Новый лот</h2><p>Автор автоматически становится заказчиком в этом лоте.</p><form id="newForm" class="formstack"><label>Название<input name="title" required></label><label>Город<input name="city" required></label><label>Тип<select name="kind"><option>DC</option><option>AC</option><option>PLAN</option><option>REG</option></select></label><label>Цена, €<input name="price" type="number" min="0" value="0"></label><button class="btn primary" type="submit">Создать</button></form>');
}
function createShard(l) {
 if(!l||l.parent||l.creator!=="me"){notify("Добавить Shard может только создатель корневого Case (демо).");return;}
 if(state.lots.length>=2000){notify("Достигнут лимит проектов.");return;}
 modal('<h2>Новый Shard</h2><p class="small">Любой вид работ. Шард создаётся внутри Case, без автоматической разбивки на четыре этапа.</p>'+
 '<form id="shardForm" class="formstack"><input type="hidden" name="parent" value="'+encode(l.id)+'">'+
 '<label>Название работы<input name="title" maxlength="120" required placeholder="Например: Gerüstbau, DC, логистика"></label>'+
 '<label>Категория<select name="kind"><option value="CUSTOM">Другая работа</option><option value="PLAN">Projektierung</option><option value="DC">DC-Montage</option><option value="AC">AC-Anschluss</option><option value="REG">Anmeldung</option></select></label>'+
 '<label>Описание и объём работ<textarea name="description" maxlength="2000" rows="4" placeholder="Что именно нужно выполнить"></textarea></label>'+
 '<label>Бюджет Shard, €<input name="price" type="number" min="0" max="100000000" step="0.01" value="0" required></label>'+
 '<p class="small">Исполнителя назначают отдельно после создания. Для AC и Anmeldung в демоверсии назначение ограничено.</p>'+
 '<button type="submit" class="btn primary">Создать Shard</button></form>');
}
document.addEventListener("click",e=>{
 const n=e.target.closest("[data-screen]"); if(n){e.preventDefault();go(n.dataset.screen);return;}
 const b=e.target.closest("[data-act]");if(!b)return;e.preventDefault();
 if(b.dataset.act.startsWith("post-")){socialAction(b.dataset.act,b.dataset.id);return;}
 if(b.dataset.act.startsWith("stage-")){stageAction(b.dataset.act,b.dataset.id);return;}
 if(b.dataset.act==="lot"){selected=b.dataset.id;projectPage=0;go("lot");}
 if(b.dataset.act==="project-page"){setProjectPage(Number(b.dataset.page));return;}
 if(b.dataset.act==="projects")go("projects");
 if(b.dataset.act==="new")create();
 if(b.dataset.act==="shard-new"){createShard(find(b.dataset.id));return;}
 if(b.dataset.act==="import"){modal('<h2>Импорт локальной резервной копии</h2><p class="small">Только демоданные. Существующие данные будут заменены после проверки и подтверждения. Не вставляйте реальные адреса клиентов, документы или персональные данные.</p><form id="importForm" class="formstack"><label>JSON резервной копии<textarea name="backup" rows="8" maxlength="1500000" required placeholder=\'{"exportedAt":"...","data":{...}}\'></textarea></label><button class="btn primary" type="submit">Проверить и восстановить</button></form>');return;}
 if(b.dataset.act==="export-raw"){try{const raw=sessionStorage.getItem("nvtsk04_original_saved")??localStorage.getItem(KEY);if(raw===null)throw Error("Нет исходной записи");const blob=new Blob([raw],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nvtsk-original-recovery.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){notify("Не удалось экспортировать: "+err.message)}return;}
 if(b.dataset.act==="export"){let garage;try{const checked=normalize(state);if(checked.recoveryWarnings.length)throw Error("Проекты содержат записи, которые не переживут восстановление: "+checked.recoveryWarnings.join("; "));garage=window.NVTSK_GARAGE?.snapshot();if(!garage)throw Error("Модуль Garage недоступен");const ids=new Set(checked.lots.map(l=>l.id));const orphans=garage.usage.filter(u=>!ids.has(u.project));if(orphans.length)throw Error("Расходы Garage ссылаются на отсутствующие проекты: "+orphans.length);if(recoveryLock)throw Error("Хранилище проектов заблокировано для восстановления");}catch(err){notify("Общий экспорт остановлен: "+err.message+". Данные не изменены.");return;}const payload=JSON.stringify({kind:"nvtsk-silver-combined-export",version:1,exportedAt:new Date().toISOString(),data:state,garage},null,2);const blob=new Blob([payload],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nvtsk-silver-combined-export.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 if(b.dataset.act==="edit-name")modal('<h2>Ваше имя</h2><form id="nameForm"><label>Ваше имя<input name="name" value="'+encode(state.name)+'" required></label><button class="btn primary" type="submit">Сохранить</button></form>');
 if(b.dataset.act==="assign"){const l=find(selected),who=$("#assignee").value;
 if(l.creator!=="me"){notify("Назначать исполнителя может только автор лота. Демонстрация не предоставляет полномочий чужой компании.");return;}
 if(!who){notify("Выберите исполнителя.");return;}
 if(who===l.creator){notify("Самоназначение автора лота запрещено");return;}
 if(l.kind==="AC"||l.kind==="REG"){notify("Для AC/Anmeldung требуется подтверждённая квалификация и право выполнения работ. Назначение заблокировано в демо.");return;}
 l.assignee=who;log("assign",l.id,"Executor assigned: "+who);save();render();return;}
 if(b.dataset.act==="bid"){
  const l=find(selected),amount=Number($("#bid").value);
  if(role(l)==="Заказчик"){alert("Нельзя подавать ставку на свой лот");return;}
  if(!Number.isFinite(amount)||amount<=0||amount>100000000){alert("Введите корректную сумму");return;}
  if(l.assignee==="me"){notify("Назначенный исполнитель не может одновременно подавать новую ставку.");return;}
  l.bids=l.bids.filter(x=>!x.mine);l.bids.push({team:"Моя бригада",amount,mine:true});log("bid",l.id,"Bid amount: "+amount);save();render();
 }
});
document.addEventListener("change",e=>{if(e.target?.id==="demoActor"){const allowed=["me","roman","denis","olena"];if(!allowed.includes(e.target.value)){notify("Неизвестный демоперсонаж");render();return;}demoActor=e.target.value;render();}});
document.addEventListener("submit",e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement))return;e.preventDefault();
 const data=Object.fromEntries(new FormData(f));
 if(f.id==="importForm"){
  try{
   const input=String(data.backup||"");if(input.length>1500000)throw Error("Размер копии превышает 1,5 МБ");
   const parsed=JSON.parse(input);
   if(parsed&&typeof parsed==="object"&&(parsed.kind==="nvtsk-silver-combined-export"||Object.prototype.hasOwnProperty.call(parsed,"garage")))throw Error("Общий архив Case/Garage пока нельзя восстановить: импорт проектов не восстанавливает Garage. Никакие данные не изменены.");
   const raw=parsed&&typeof parsed==="object"&&"data" in parsed?parsed.data:parsed;
   if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.schemaVersion!==2)throw Error("Неподдерживаемая версия копии");
   if(!Array.isArray(raw.stages)||!Array.isArray(raw.posts)||!Array.isArray(raw.audit)||!Array.isArray(raw.crew))throw Error("В копии отсутствуют необходимые разделы");
   const restored=normalize(raw);
   if(restored.recoveryWarnings.length)throw Error("Обнаружены повреждённые записи: "+restored.recoveryWarnings.join("; "));
   // A project-only restore must not orphan material consumption already recorded in Garage.
   // Garage remains untouched; fail closed rather than creating an inconsistent two-store state.
   const garageSnapshot=window.NVTSK_GARAGE?.snapshot();
   if(!garageSnapshot)throw Error("Garage недоступен или повреждён: восстановление проектов остановлено.");
   const restoredIds=new Set(restored.lots.map(l=>l.id));
   const missingGarageProjects=garageSnapshot.usage.filter(u=>!restoredIds.has(u.project));
   if(missingGarageProjects.length)throw Error("Импорт удалит проекты, к которым привязаны расходы Garage ("+missingGarageProjects.length+"). Склад не изменён; восстановление остановлено.");
   const message="Проверка пройдена. Лотов: "+restored.lots.length+", фотоэтапов: "+restored.stages.length+", записей: "+restored.posts.length+". Заменить текущие локальные демоданные? Сначала экспортируйте старую копию.";
   if(!window.confirm(message))return;
   restored.audit.push({at:new Date().toISOString(),action:"import",lotId:null,actor:"me",details:"Local demo backup restored"});
   restored.audit=restored.audit.slice(-3000);
   const serialized=JSON.stringify(restored);
   localStorage.setItem(KEY,serialized); // one atomic localStorage replacement; no second save
   state=restored;recoveryLock=false;storageError="";demoActor="me";selected=state.lots[0]?.id||"";
   close();go("dashboard");
  }catch(err){notify("Импорт отклонён: "+err.message)}
  return;
 }
 if(f.id==="shardForm"){
 const parent=find(String(data.parent||""));
 if(!parent||parent.parent||parent.creator!=="me"){notify("Недостаточно прав для создания Shard.");return;}
 if(state.lots.length>=2000){notify("Достигнут лимит проектов.");return;}
 const title=String(data.title||"").trim(),description=String(data.description||"").trim(),price=Number(data.price);
 const kind=["CUSTOM","PLAN","DC","AC","REG"].includes(data.kind)?data.kind:"CUSTOM";
 if(!title||title.length>120||description.length>2000||!Number.isFinite(price)||price<0||price>100000000){notify("Проверьте название, описание и бюджет.");return;}
 const id=uuid();
 const auditBefore=state.audit.slice();
 state.lots.push({id,title,description,city:parent.city,client:parent.client,price,kind,creator:"me",parent:parent.id,assignee:null,members:[],bids:[]});
 log("shard_created",parent.id,"Shard: "+id+" / "+title);
 if(!save()){state.lots=state.lots.filter(x=>x.id!==id);state.audit=auditBefore;notify("Не удалось сохранить Shard. Данные не изменены.");return;}
 close();selected=parent.id;projectPage=3;go("lot");return;
}
if(f.id==="newForm"){
 const title=String(data.title||"").trim().slice(0,120),city=String(data.city||"").trim().slice(0,100),price=Number(data.price);
 if(!title||!city||!Number.isFinite(price)||price<0||price>100000000){notify("Проверьте название, город и сумму.");return;}
 const id=uuid();state.lots.push({id,title,city,client:"Создано пользователем",price,kind:["DC","AC","PLAN","REG"].includes(data.kind)?data.kind:"DC",creator:"me",parent:null,assignee:null,members:[],bids:[]});
 log("create",id,"Lot created");save();close();go("projects");
 }
 if(f.id==="nameForm"){const name=String(data.name||"").trim().slice(0,80);if(!name){notify("Введите имя.");return;}state.name=name;log("profile",null,"Name updated");save();close();go("profile");}
});
$("#newLot").onclick=create;
$("#dialogBackdrop").onclick=e=>{if(e.target.id==="dialogBackdrop")close()};
window.addEventListener("hashchange",restoreRoute);
window.addEventListener("popstate",restoreRoute);
restoreRoute();
})();