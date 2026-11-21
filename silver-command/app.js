(() => {
"use strict";
const KEY = "nvtsk_silver_04_demo";
const $ = s => document.querySelector(s);
const encode = v => String(v ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const money = n => Number(n || 0).toLocaleString("ru-RU");
const uuid = () => "lot-" + Math.random().toString(36).slice(2,10);
const tabs = [["dashboard","⌂","Главная"],["map","⌾","Карта"],["projects","▤","Проекты"],["chats","☷","Чаты"],["profile","◉","Профиль"]];
const kinds = [["PLAN","Projektierung"],["DC","DC-Montage"],["AC","AC-Anschluss"],["REG","Anmeldung"]];
const initial = [
  {id:"stock",title:"20 кВт DC • Stockach",city:"Stockach",client:"Демо Solarbau Süd",price:2000,kind:"DC",creator:"demo-client",parent:null,members:[],bids:[]},
  {id:"singen",title:"14,8 кВт DC • Singen",city:"Singen",client:"Демо Hegau Energie",price:1480,kind:"DC",creator:"demo-client",parent:null,members:[],bids:[{amount:1380,team:"SüdMontage (демо)"}]},
  {id:"uber",title:"12 кВт AC • Überlingen",city:"Überlingen",client:"Демо Bodensee PV",price:1200,kind:"AC",creator:"demo-client",parent:null,members:[],bids:[]}
];
const fresh = () => ({schemaVersion:2,lots:JSON.parse(JSON.stringify(initial)),name:"Участник",merit:3000,crew:["Участник","Роман","Денис","Олена"],stages:[],posts:[],audit:[]});
const validLot = l => l && typeof l.id==="string" && typeof l.title==="string" && typeof l.creator==="string" && (l.parent===null || typeof l.parent==="string") && Array.isArray(l.members) && Array.isArray(l.bids) && Number.isFinite(l.price) && l.price>=0;
function normalize(raw) {
 if(!raw || !Array.isArray(raw.lots) || raw.lots.length>2000 || !raw.lots.every(validLot)) throw Error("Invalid saved lot data");
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
   if(s.status==="accepted"&&(s.reviewerId!==lot.creator||s.reviewerId===s.ownerId))return false;
   seenStages.add(s.id);return true;
 }).slice(0,500):[];
 const socialApi=window.NVTSK_SOCIAL;
 const seenPosts=new Set();
 const posts=Array.isArray(raw.posts)&&socialApi?raw.posts.filter(p=>{if(!socialApi.valid(p)||!ids.has(p.lotId)||seenPosts.has(p.id))return false;seenPosts.add(p.id);return true;}).slice(-500):[];
 const warnings=[];
 if(Array.isArray(raw.stages)&&raw.stages.length!==stages.length)warnings.push("Фотоэтапы: отклонено или ограничено записей "+(raw.stages.length-stages.length));
 if(Array.isArray(raw.posts)&&raw.posts.length!==posts.length)warnings.push("Лента: отклонено или ограничено записей "+(raw.posts.length-posts.length));
 return {...fresh(),...raw,stages,posts,recoveryWarnings:warnings,schemaVersion:2,audit:Array.isArray(raw.audit)?raw.audit.slice(-300):[],name:String(raw.name||"Участник").slice(0,80),merit:Number.isFinite(raw.merit)&&raw.merit>=0?raw.merit:0,crew:Array.isArray(raw.crew)?raw.crew.slice(0,100):[]};
}
let state,storageError="";
let recoveryLock=false;
try {const saved=localStorage.getItem(KEY);state=saved?normalize(JSON.parse(saved)):fresh();}
catch (err) {
 state=fresh();recoveryLock=true;storageError="Сохранённые данные повреждены или недоступны. Исходная запись не перезаписана; экспортируйте её перед созданием новых данных.";
 console.warn("NVTSK storage recovery:",err);
}
if(state.recoveryWarnings?.length)storageError="При загрузке отклонены некорректные записи: "+state.recoveryWarnings.join("; ")+". Перед продолжением сохраните исходную копию.";
const log=(action,lotId,details="")=>{state.audit.push({at:new Date().toISOString(),action,lotId,actor:"me",details});state.audit=state.audit.slice(-300)};

let screen = "dashboard";
let selected = "singen";
let demoActor = "me"; // local stage simulation only, never authentication
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
function overview() {
  return '<div class="stack">' + (storageError?panel('<strong>⚠ '+encode(storageError)+'</strong><p class="small">Исходные данные доступны для экспорта, если браузер разрешает чтение.</p>'+button("export-raw","↓ Сохранить исходную запись")):"") + '<section class="glass hero"><div class="overline">NVTSK SILVER COMMAND / 0.4</div><h2 style="font-size:30px;margin:12px 0">Управление PV-проектами</h2><p>Единая система для заказчиков, монтажных бригад, документов, общения и профессионального развития.</p><div style="margin-top:17px">' + button("new","＋ Создать лот") + '</div></section><div class="grid g3">' +
  panel('<div class="statlabel">Проекты</div><div class="stat">'+state.lots.length+'</div>') +
  panel('<div class="statlabel">Бригада</div><div class="stat">'+state.crew.length+'</div>') +
  panel('<div class="statlabel">Merit</div><div class="stat">'+money(state.merit)+'</div>') +
  '</div>' + panel('<h2>Недавние объекты</h2>' + state.lots.filter(l=>!l.parent).map(l=>'<div class="listrow"><div><b>'+encode(l.title)+'</b><div class="small muted">'+role(l)+'</div></div>'+button("lot","Открыть",l.id)+'</div>').join("")) + '</div>';
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
 if(l.assignee===demoActor && l.assignee!==l.creator)content+=button("stage-new","＋ Новый этап",l.id);
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
  const l=find(id);if(!l||l.assignee!==demoActor||l.assignee===l.creator)return notify("Создать этап может только назначенный независимый исполнитель.");
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
 let sublist = subs.length ? subs.map(x=>'<div class="listrow"><span>'+encode(x.title)+'</span>'+button("lot","Открыть",x.id)+'</div>').join("") : '<p>Сублотов пока нет.</p>';
 let bidlist = (l.bids||[]).map(b=>'<div class="listrow"><span>'+encode(b.team)+'</span><b>'+money(b.amount)+' €</b></div>').join("");
 return '<div class="stack">'+panel('<div class="overline">LOT '+encode(l.id)+'</div><h2 style="font-size:26px;margin:9px 0">'+encode(l.title)+'</h2><p>'+encode(l.city)+' • '+encode(l.client)+'</p><div class="stat">'+money(l.price)+' €</div>'+pulseView(l)+'<div class="row" style="margin-top:14px">'+badge(role(l))+button("split","Разбить на 4",l.id)+button("projects","← Проекты")+'</div>') +
 stagePanel(l)+socialPanel(l)+'<div class="grid maincols">'+panel('<h2>Сублоты</h2>'+sublist+'<div class="line"></div><h2>Монтажный чек-лист</h2><p>Фотоэтапы с описанием до/после, номером страницы PDF и независимой демоприёмкой доступны выше. Файлы фотографий и PDF пока не загружаются. Stringplan, Erdung и реальные подписи требуют отдельной реализации.</p>') +
 panel('<h2>Аукцион</h2>'+bidlist+'<label>Моя ставка, €<input id="bid" type="number" min="1"></label><div style="margin-top:10px">'+button("bid","Подать ставку")+'</div><div class="line"></div><label>Назначенный исполнитель<select id="assignee"><option value="">Не назначен</option><option value="me">Я (исполнитель)</option><option value="roman">Роман</option><option value="denis">Денис</option><option value="olena">Олена</option></select></label><div style="margin-top:10px">'+button("assign","Назначить (демо)")+'</div><p class="small" style="margin-top:10px">Роль определяется отдельно для этого лота. Самому себе выдавать контракт собственного лота нельзя.</p>')+'</div></div>';
}
function chat() {
 return panel('<h2>Коммуникация</h2><p>Ленты объектов, сообщения и комментарии входят в архитектуру. Для настоящего межпользовательского чата нужны авторизация и сервер, поэтому здесь пока только концептуальный экран.</p><div class="tile">Личные сообщения • Чаты объектов • Социальная лента • Уведомления</div>');
}
function profile() {
 return '<div class="stack">'+panel('<div class="row"><div class="avatar big">'+encode(state.name[0])+'</div><div><h2>'+encode(state.name)+'</h2><p>Ваше имя, без выбора роли при регистрации</p></div></div><div style="margin-top:14px">'+button("edit-name","✎ Изменить имя")+'</div>')+
 '<div style="margin:12px 0" class="row">'+button("export","↓ Экспорт демоданных")+button("import","↑ Импорт копии")+'</div><div class="grid g3">'+panel('<div class="statlabel">Legacy</div><div class="stat">8500</div>')+panel('<div class="statlabel">Merit</div><div class="stat">'+money(state.merit)+'</div>')+panel('<div class="statlabel">Бригада</div><div class="stat">'+state.crew.length+'</div>')+'</div>'+
 panel('<h2>Команда и MentorGate</h2><p>Здесь будут навыки, Merit, финансовая история, капитан и администраторы бригад, наставничество и личные проекты.</p><div class="tile">'+state.crew.map(encode).join(" • ")+'</div>')+'</div>';
}
function render() {
 for (const sel of ["#desktopNav","#mobileNav"]) {
   $(sel).innerHTML = tabs.map(t=>'<a href="#'+t[0]+'" data-screen="'+t[0]+'" class="'+(screen===t[0]?"active":"")+'"><span class="ico">'+t[1]+'</span>'+t[2]+'</a>').join("");
 }
 $("#screenTitle").textContent = tabs.find(t=>t[0]===screen)?.[2] || "Лот";
 const view = screen==="dashboard"?overview():screen==="map"?market():screen==="projects"?projects():screen==="chats"?chat():screen==="profile"?profile():lotScreen();
 $("#app").innerHTML=view;
}
function go(s){screen=s;render();window.scrollTo({top:0,behavior:"smooth"})}
function modal(html){$("#dialog").innerHTML=html;$("#dialogBackdrop").hidden=false}
function close(){$("#dialogBackdrop").hidden=true}
function create() {
 modal('<h2>Новый лот</h2><p>Автор автоматически становится заказчиком в этом лоте.</p><form id="newForm" class="formstack"><label>Название<input name="title" required></label><label>Город<input name="city" required></label><label>Тип<select name="kind"><option>DC</option><option>AC</option><option>PLAN</option><option>REG</option></select></label><label>Цена, €<input name="price" type="number" min="0" value="0"></label><button class="btn primary" type="submit">Создать</button></form>');
}
function split(l) {
 if (!l || l.creator!=="me"){notify("Создавать сублоты может только автор этого лота (демо).");return;}
 if(l.parent){notify("Автоматическая разбивка доступна только для корневого лота.");return;}
 for(const [kind,title] of kinds) {
  if (state.lots.some(x=>x.parent===l.id&&x.kind===kind)) continue;
  state.lots.push({id:uuid(),title,city:l.city,client:l.client,price:0,kind,creator:"me",parent:l.id,assignee:null,members:[],bids:[]});
 }
 log("split",l.id,"Generated missing phase sublots");save();selected=l.id;go("lot");
}
document.addEventListener("click",e=>{
 const n=e.target.closest("[data-screen]"); if(n){e.preventDefault();go(n.dataset.screen);return;}
 const b=e.target.closest("[data-act]");if(!b)return;e.preventDefault();
 if(b.dataset.act.startsWith("post-")){socialAction(b.dataset.act,b.dataset.id);return;}
 if(b.dataset.act.startsWith("stage-")){stageAction(b.dataset.act,b.dataset.id);return;}
 if(b.dataset.act==="lot"){selected=b.dataset.id;go("lot");}
 if(b.dataset.act==="projects")go("projects");
 if(b.dataset.act==="new")create();
 if(b.dataset.act==="split")split(find(b.dataset.id));
 if(b.dataset.act==="import"){modal('<h2>Импорт локальной резервной копии</h2><p class="small">Только демоданные. Существующие данные будут заменены после проверки и подтверждения. Не вставляйте реальные адреса клиентов, документы или персональные данные.</p><form id="importForm" class="formstack"><label>JSON резервной копии<textarea name="backup" rows="8" maxlength="1500000" required placeholder=\'{"exportedAt":"...","data":{...}}\'></textarea></label><button class="btn primary" type="submit">Проверить и восстановить</button></form>');return;}
 if(b.dataset.act==="export-raw"){try{const raw=sessionStorage.getItem("nvtsk04_original_saved")??localStorage.getItem(KEY);if(raw===null)throw Error("Нет исходной записи");const blob=new Blob([raw],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nvtsk-original-recovery.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){notify("Не удалось экспортировать: "+err.message)}return;}
 if(b.dataset.act==="export"){const payload=JSON.stringify({exportedAt:new Date().toISOString(),data:state},null,2);const blob=new Blob([payload],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nvtsk-silver-demo-backup.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
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
document.addEventListener("change",e=>{if(e.target?.id==="demoActor"){demoActor=e.target.value;render();}});
document.addEventListener("submit",e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement))return;e.preventDefault();
 const data=Object.fromEntries(new FormData(f));
 if(f.id==="importForm"){
  try{
   const input=String(data.backup||"");if(input.length>1500000)throw Error("Размер копии превышает 1,5 МБ");
   const parsed=JSON.parse(input),raw=parsed&&typeof parsed==="object"&&"data" in parsed?parsed.data:parsed;
   if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.schemaVersion!==2)throw Error("Неподдерживаемая версия копии");
   if(!Array.isArray(raw.stages)||!Array.isArray(raw.posts)||!Array.isArray(raw.audit))throw Error("В копии отсутствуют необходимые разделы");
   const restored=normalize(raw);
   if(restored.recoveryWarnings.length)throw Error("Обнаружены повреждённые записи: "+restored.recoveryWarnings.join("; "));
   const message="Проверка пройдена. Лотов: "+restored.lots.length+", фотоэтапов: "+restored.stages.length+", записей: "+restored.posts.length+". Заменить текущие локальные демоданные? Сначала экспортируйте старую копию.";
   if(!window.confirm(message))return;
   const serialized=JSON.stringify(restored);localStorage.setItem(KEY,serialized);
   state=restored;recoveryLock=false;storageError="";demoActor="me";selected=state.lots[0]?.id||"";
   log("import",null,"Local demo backup restored");save();close();go("dashboard");
  }catch(err){notify("Импорт отклонён: "+err.message)}
  return;
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
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(tabs.some(t=>t[0]===h))go(h)});
render();
})();