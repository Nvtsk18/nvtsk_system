
(() => {
"use strict";
const KEY="nvtsk-system-v03-silver"; const MEDIA_DB="nvtsk03-media";
const Q=s=>document.querySelector(s), QA=s=>Array.from(document.querySelectorAll(s));
const enc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Number(n||0).toLocaleString("ru-RU",{maximumFractionDigits:2});
const date=()=>new Date().toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const uid=()=>("nv"+Math.random().toString(36).slice(2,11)+Date.now().toString(36));
const phases=[
 {id:"roof",name:"Dachschutz",desc:"Gerüst, RSS, зоны безопасности и защита кровли",type:"DC"},
 {id:"uk",name:"Unterkonstruktion",desc:"Dachhaken, Schienen, Klemmen, крепёж и монтаж конструкции",type:"DC"},
 {id:"modules",name:"PV-Module",desc:"Размещение и крепление модулей по плану",type:"DC"},
 {id:"strings",name:"DC / Stringplan",desc:"Стринги, трассы, укладка и маркировка DC-кабелей",type:"DC"},
 {id:"earth",name:"Erdung",desc:"Заземление, клеммы и уравнивание потенциалов",type:"DC"},
 {id:"cable",name:"Dachausgang / Kabelkanal",desc:"Выход кабеля с крыши и спуск в здание",type:"DC"},
 {id:"inverter",name:"Wechselrichter / AC",desc:"Инвертор, AC-кабели, шкаф и измерения",type:"AC"},
 {id:"docs",name:"Abnahme / Anmeldung",desc:"Документы, акты, Netzbetreiber и регистрация",type:"REG"},
 {id:"extra",name:"Zusatzarbeiten / Probleme",desc:"Дополнительные работы, отклонения и замечания",type:"ALL"}
];
const splits=[
 ["PLAN","Projektierung","Планы, спецификация, проектирование и согласование"],
 ["DC","DC-Montage","Крепления, модули, DC-стринги, заземление"],
 ["AC","AC-Anschluss","Инвертор и электротехнический монтаж"],
 ["REG","Anmeldung","Документация, Netzbetreiber, регистрация и сдача"]
];
const companyNames=["Sanpower (демо)","5-Sterne-Solar (демо)","Solan Plus GmbH (демо)","Kempter GmbH (демо)"];
const users=[
 {id:"me",name:"Серёжа",role:"DC • Captain",skills:["DC","Логистика"],city:"Bodensee",phone:"",legacy:{dc:8500,ac:0,plan:800,lead:2100},xp:24650,verified:false,stats:[85,80,75,82,91,78]},
 {id:"roman",name:"Роман",role:"DC • монтажник",skills:["DC"],city:"Singen",phone:"",legacy:{dc:4200,ac:0,plan:0,lead:1200},xp:12500,verified:false,stats:[88,83,74,81,75,84]},
 {id:"denis",name:"Денис",role:"DC • логистика",skills:["DC","Логистика"],city:"Stockach",phone:"",legacy:{dc:3100,ac:0,plan:0,lead:500},xp:9300,verified:false,stats:[80,78,91,70,76,83]},
 {id:"olena",name:"Олена",role:"AC • Elektrofachkraft (демо)",skills:["AC"],city:"Konstanz",phone:"",legacy:{dc:0,ac:7100,plan:1400,lead:400},xp:17800,verified:false,stats:[72,92,65,90,71,82]},
 {id:"artem",name:"Артём",role:"PV • монтажник",skills:["DC"],city:"Überlingen",phone:"",legacy:{dc:2100,ac:0,plan:0,lead:300},xp:6400,verified:false,stats:[75,76,70,75,78,68]}
];
function seedProject(id,title,client,city,kw,budget,kind,notes) {
 return {id,parentId:null,title,client,city,kw,budget,kind,notes,address:"",status:"published",assignee:"",tasks:{},docs:[],posts:[],messages:[],bids:[],created:date(),tip:0};
}
function initial(){
 const projects=[
  seedProject("p-stock","Скатная крыша • 20 кВт","Solarbau Süd (демо)","Stockach",20,2000,"DC","Монтаж крыши, DC-кабели, инструменты и транспорт"),
  seedProject("p-singen","Частный дом • 14,8 кВт","Hegau Energie (демо)","Singen",14.8,1480,"DC","Черепичная крыша, Gerüst и подъёмник от заказчика"),
  seedProject("p-uber","Инвертор и AC • 12 кВт","Bodensee PV Service (демо)","Überlingen",12,1200,"AC","AC-монтаж требует компетентной организации и надлежащих полномочий"),
  seedProject("p-hn17","HN17 • 14 модулей",companyNames[0],"Gottmadingen",0,0,"DC","Шаблон проекта. Исходный PDF не загружен в приложение; проверь схему и количество модулей"),
  seedProject("p-hn19","HN19 • 14 модулей",companyNames[1],"Gottmadingen",0,0,"DC","Шаблон проекта. Между титульным листом и Stringplan было расхождение в количестве; проверь оригинал"),
  seedProject("p-90","Кровля • 90 модулей (шаблон)",companyNames[2],"Bodensee",0,0,"DC","Демонстрационная карточка, без реального PDF"),
  seedProject("p-kempter","Монтаж PV • шаблон",companyNames[3],"Stockach",0,0,"FULL","Демонстрационная карточка для тестирования")
 ];
 projects[0].bids=[{id:"s1",team:"Solar Crew Süd (демо)",price:1700,legacy:4300,at:date()},{id:"s2",team:"DachSolar (демо)",price:1600,legacy:2000,at:date()}];
 projects[1].bids=[{id:"s3",team:"SüdMontage (демо)",price:1380,legacy:3100,at:date()}];
 projects[2].bids=[{id:"s4",team:"Elektro See (демо)",price:1120,legacy:7000,at:date()}];
 let old;try{old=JSON.parse(localStorage.getItem("nvtsk-mvp-2026-v2")||"{}");}catch(_){old={};}
 for(let i=0;i<3;i++){const v=Number((old.bids||{})[i+1]);if(v>0)projects[i].bids.push({id:uid(),team:old.teamName||"Моя бригада",price:v,legacy:0,at:date(),mine:true});}
 return {users,projects,crew:{name:old.teamName||"NVTSK Solar Crew",members:["me","roman","denis","olena"],captain:"me",admins:["me","roman"],tools:true,vehicle:true},me:"me",xp:old.xp||24650,merit:old.merit==null?3000:Number(old.merit),frozen:0,legacy:old.legacy||{dc:8500,ac:3200,engineering:1500,leadership:2000},mentor:[],ledger:[],direct:[],version:3};
}
let db;try{db=JSON.parse(localStorage.getItem(KEY)||"null");if(!db||!db.projects||!db.users)throw Error("empty");}catch(_){db=initial()}
const ui={screen:"dashboard",project:"p-singen",person:"me",company:companyNames[0],filter:"all",chat:"p-singen",chatKind:"lot",files:{},modal:null,role:"worker",photoPhase:"",userTab:"info",profileEdit:false};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(_){notify("Не удалось сохранить локальные данные: хранилище заполнено")}}
const project=id=>db.projects.find(p=>p.id===id);
const person=id=>db.users.find(p=>p.id===id);
const children=id=>db.projects.filter(p=>p.parentId===id);
const owner=p=>p&&p.assignee?person(p.assignee):null;
const totalLegacy=p=>Object.values(p.legacy||{}).reduce((a,b)=>a+Number(b||0),0);
const scope=["dashboard","projects","market","crew","messages","profile"];
const nav=[["dashboard","▦","Обзор"],["projects","▤","Проекты"],["market","◇","Биржа"],["crew","♙","Люди"],["messages","☷","Чаты"],["profile","◉","Профиль"]];
function notify(msg){let t=Q("#toast");t.textContent=msg;t.hidden=false;clearTimeout(window._nttoast);window._nttoast=setTimeout(()=>{t.hidden=true},3100)}
function go(screen){ui.screen=screen;render();window.scrollTo({top:0,behavior:"smooth"})}
function selectProject(id,screen="projects"){ui.project=id;go(screen)}
function openModal(content){Q("#modalbody").innerHTML=content;Q("#modalback").hidden=false}
function closeModal(){Q("#modalback").hidden=true;Q("#modalbody").innerHTML=""}
function card(body,extra=""){return '<div class="card '+extra+'">'+body+'</div>'}
function stat(label,value,desc){return card('<div class="metriclabel">'+label+'</div><div class="metric">'+value+'</div><div class="small muted">'+desc+'</div>')}
function pill(t,type=""){return '<span class="tag '+type+'">'+t+'</span>'}
function btn(act,label,cls="",attrs=""){return '<button type="button" class="btn '+cls+'" data-act="'+act+'" '+attrs+'>'+label+'</button>'}
function empty(t){return '<div class="empty">'+t+'</div>'}
function userAvatar(p,big=false){const f=p?.avatar;return '<div class="avatar '+(big?'big':'')+'">'+(f?'<img data-media="'+enc(f)+'" alt="Аватар">':enc((p?.name||"?").slice(0,1)))+'</div>'}
function userCard(p){return '<div class="listrow"><div class="person">'+userAvatar(p)+'<div><button class="itemlink" data-act="person" data-id="'+enc(p.id)+'">'+enc(p.name)+'</button><small>'+enc(p.role)+'</small><small>Legacy '+fmt(totalLegacy(p))+'</small></div></div>'+btn("person","Профиль ↗","mini",'data-id="'+enc(p.id)+'"')+'</div>'}
function idName(id){return enc(person(id)?.name||"Не назначено")}
function navRender(){
 Q("#snav").innerHTML=nav.map(x=>'<button class="'+(ui.screen===x[0]?"active":"")+'" data-act="nav" data-id="'+x[0]+'"><span class="ic">'+x[1]+'</span>'+x[2]+'</button>').join("");
 Q("#bottomnav").innerHTML=nav.map(x=>'<button class="'+(ui.screen===x[0]?"active":"")+'" data-act="nav" data-id="'+x[0]+'"><span class="ic">'+x[1]+'</span>'+x[2]+'</button>').join("");
 Q("#screenTitle").textContent=nav.find(x=>x[0]===ui.screen)?.[2]||"Обзор";
 Q("#roleDisplay").textContent=ui.role==="client"?"Режим: заказчик":"Режим: исполнитель";
}
function overview(){
 const open=db.projects.filter(p=>!p.parentId&&p.status!=="accepted").length;
 const mine=db.projects.filter(p=>p.assignee==="me"||p.bids.some(b=>b.mine));
 return '<div class="stack">'+
 '<div class="card hero"><div class="eyebrow">NVTSK • SOLAR OPERATIONS • SILVER EDITION</div><h2>От проекта до сдачи, в одной системе.</h2><p>Связанные лоты, бригады, документы, доказательства монтажа, расчёты и репутация. Тестовая среда для PV-команд.</p><div class="row">'+btn("new-project","＋ Создать проект","primary")+btn("nav","Открыть биржу","",'data-id="market"')+'</div></div>'+
 '<div class="grid cols4">'+stat("Активные объекты",fmt(open),"Демонстрационные проекты")+stat("Merit • доступно",fmt(db.merit),"Заморожено "+fmt(db.frozen))+stat("Моя бригада",fmt(db.crew.members.length)+" чел.","Администраторы: "+db.crew.admins.length)+stat("Legacy",fmt(Object.values(db.legacy).reduce((a,b)=>a+Number(b||0),0)),"Подтверждённый опыт в демо")+'</div>'+
 '<div class="grid colsMain">'+card('<div class="between"><h2>Последние проекты</h2>'+btn("nav","Все проекты ↗","mini",'data-id="projects"')+'</div>'+db.projects.filter(p=>!p.parentId).slice(0,5).map(p=>'<div class="listrow"><div><button class="itemlink" data-act="open-project" data-id="'+p.id+'">'+enc(p.title)+'</button><div class="small muted">'+enc(p.city)+' • '+enc(p.client)+'</div></div>'+pill(p.status==="accepted"?"Сдан":p.status==="progress"?"В работе":"Открыт",p.status==="accepted"?"ok":"blue")+'</div>').join(""))+
 card('<h2>Как устроена работа</h2><div class="stack">'+["① Заказчик создаёт проект и прикрепляет PDF","② Разбивает на проектирование, DC, AC и Anmeldung","③ Бригады подают ставки на нужные сублоты","④ Фотографии до/после закрывают этапы","⑤ Подтверждение создаёт историю работ и начисления"].map(x=>'<div class="listrow">'+x+'</div>').join("")+'</div><div class="divider"></div>'+btn("mentor","MentorGate • пригласить новичка","primary full")+'</div>')+
 '</div>';
}
function hierarchy(p,depth=0){
 if(depth>5)return "";
 return '<div class="nested"><button data-act="open-project" data-id="'+p.id+'">'+(p.parentId?"↳ ":"▤ ")+enc(p.title)+' <span class="muted">('+fmt(p.budget)+' €)</span></button>'+children(p.id).map(c=>hierarchy(c,depth+1)).join("")+'</div>';
}
function projectCards(){
 return db.projects.filter(p=>!p.parentId).filter(p=>ui.filter==="all"||p.kind===ui.filter).map(p=>{
 const count=children(p.id).length,done=Object.values(p.tasks||{}).filter(s=>s.status==="accepted").length;
 return '<div class="lot"><div class="between">'+pill(enc(p.kind==="FULL"?"DC + AC":p.kind),"blue")+pill(enc(p.status),"")+'</div><div><h3>'+enc(p.title)+'</h3><div class="small muted">'+enc(p.client)+' · '+enc(p.city)+'</div></div><div class="between"><div class="price">'+fmt(p.budget)+' €</div><span class="small muted">'+(count?count+" сублотов":done+" фотоэтапов")+'</span></div><div class="row">'+btn("open-project","Открыть проект ↗","primary mini",'data-id="'+p.id+'"')+btn("split","Разбить на 4","mini",'data-id="'+p.id+'"')+'</div></div>'
 }).join("");
}
function projectList(){
 return '<div class="stack">'+
 '<div class="between"><div><h2>Объекты и их структура</h2><p class="small">Родительский лот → проектирование / DC / AC / Anmeldung → отдельные работы. Сохраняются связи и история.</p></div>'+btn("new-project","＋ Новый проект","primary")+'</div>'+
 '<div class="segment">'+["all","DC","AC","FULL"].map(f=>'<button data-act="filter" data-id="'+f+'" class="'+(ui.filter===f?"active":"")+'">'+({all:"Все",DC:"DC",AC:"AC",FULL:"Комплексные"})[f]+'</button>').join("")+'</div>'+
 '<div class="grid cols3">'+projectCards()+'</div>'+
 card('<h2>Дерево проектов</h2>'+db.projects.filter(p=>!p.parentId).map(p=>hierarchy(p)).join(""))+
 '</div>';
}
function getPhases(p){
 if(p.kind==="PLAN")return [{id:"plans",name:"Projektierung",desc:"Dachplan, UK-Plan, Stringplan, расчёты"}];
 if(p.kind==="DC")return phases.filter(t=>["DC","ALL"].includes(t.type));
 if(p.kind==="AC")return phases.filter(t=>["AC","ALL"].includes(t.type));
 if(p.kind==="REG")return phases.filter(t=>["REG","ALL"].includes(t.type));
 return phases;
}
function taskView(p){
 const tasks=getPhases(p),accepted=tasks.filter(t=>p.tasks[t.id]?.status==="accepted").length;
 return card('<div class="between"><div><h2>Фото-чек-лист сдачи</h2><div class="small muted">'+accepted+' из '+tasks.length+' принятых этапов</div></div>'+pill(Math.round(accepted/tasks.length*100)+"%","blue")+'</div>'+
 '<div class="statbar" style="margin:12px 0 17px"><i style="width:'+Math.round(accepted/tasks.length*100)+'%"></i></div><div class="grid cols2">'+
 tasks.map(t=>{const s=p.tasks[t.id]||{};const sb=s.status||"new";const before=s.before,after=s.after;const state=sb==="accepted"?"✓ Принято":after?"⏳ На проверке":"Ожидает фото";
 return '<section class="step '+(sb==="accepted"?"good":"")+'"><div class="between"><h3>'+enc(t.name)+'</h3>'+pill(state,sb==="accepted"?"ok":after?"warn":"")+'</div><div class="small muted">'+enc(t.desc)+'</div>'+
 '<div class="photo-grid" style="margin:12px 0">'+["before","after"].map(side=>'<div><div class="small sub" style="margin-bottom:6px">'+(side==="before"?"Фото до":"Фото после")+'</div><div class="checkphoto">'+(s[side]?'<img data-media="'+enc(s[side])+'" alt="'+side+'">':'<span style="font-size:23px">▧</span><span>Нет файла</span>')+'</div><label class="btn mini full" style="margin:7px 0;cursor:pointer">＋ '+(side==="before"?"До":"После")+'<input style="display:none" type="file" accept="image/*,video/*" data-file="proof" data-id="'+p.id+'" data-phase="'+t.id+'" data-side="'+side+'"></label></div>').join("")+'</div>'+
 '<div class="between"><label style="margin:0;font-size:11px;flex:1">Стр. PDF <input type="number" min="1" max="999" value="'+(s.pdfPage||"")+'" placeholder="№" data-editpage="'+p.id+':'+t.id+'"></label>'+btn("show-stage-pdf","PDF ↗","mini",'data-id="'+p.id+'" data-phase="'+t.id+'"')+'</div>'+
 '<div style="margin-top:8px">'+btn("approve-task",sb==="accepted"?"↶ Отменить приёмку":"✓ Принять этап","mini "+(sb==="accepted"?"":"primary"),'data-id="'+p.id+'" data-phase="'+t.id+'" '+(!after?'disabled':''))+'</div></section>';
 }).join("")+'</div><p class="footnote">Фото и PDF сохраняются в IndexedDB этого браузера. Отметка приёмки в демо не подтверждает личность заказчика; для реальных работ нужна проверка прав.</p>');
}
function projectDetail(){
 const p=project(ui.project);if(!p){ui.project=db.projects[0]?.id;return projectList()}
 const par=p.parentId?project(p.parentId):null,sub=children(p.id),docids=docsInherited(p);
 const bids=[...(p.bids||[])].sort((a,b)=>a.price-b.price);
 const total=sub.reduce((a,b)=>a+Number(b.budget||0),0);
 const top=card('<div class="eyebrow">LOT '+enc(p.id.toUpperCase())+'</div><h2 style="font-size:28px;margin:11px 0 8px">'+enc(p.title)+'</h2><div class="small muted">'+enc(p.client)+' • '+enc(p.city)+' • '+enc(p.created||"")+'</div>'+
 (par?'<div class="breadcrumb">Родитель: <button class="itemlink" data-act="open-project" data-id="'+par.id+'">'+enc(par.title)+'</button></div>':"")+
 '<div class="grid cols3" style="margin:19px 0">'+stat("Бюджет",fmt(p.budget)+" €","")+stat("Сублоты",sub.length,"На этом уровне")+stat("Исполнитель",owner(p)?idName(p.assignee):"Не выбран","")+'</div>'+
 '<div class="row">'+btn("edit-project","✎ Редактировать")+btn("split","⊞ На четыре этапа","primary",'data-id="'+p.id+'"')+btn("clone","＋ Новый сублот",'data-id="'+p.id+'"')+(p.address?'<a class="btn" href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.address)+'" target="_blank" rel="noopener">♧ Навигация ↗</a>':"")+'</div>'+
 '<div class="divider"></div><p>'+enc(p.notes||"Описание ещё не заполнено")+'</p>'+
 (sub.length?'<div class="small sub">Сумма бюджетов сублотов: <b>'+fmt(total)+' €</b> '+(p.budget&&total>p.budget?pill("Превышен бюджет родителя","bad"):"")+'</div>':""));
 const subView=sub.length?card('<h2>Сублоты · '+sub.length+'</h2><div class="grid cols2">'+sub.map(c=>'<div class="step"><div class="between">'+pill(enc(c.kind),"blue")+pill(enc(c.status),"")+'</div><h3 style="margin:12px 0 4px">'+enc(c.title)+'</h3><div class="between"><strong>'+fmt(c.budget)+' €</strong><span class="small muted">'+(owner(c)?idName(c.assignee):"Исполнитель свободен")+'</span></div><div style="margin-top:10px">'+btn("open-project","Открыть ↗","mini primary",'data-id="'+c.id+'"')+'</div></div>').join("")+'</div>'):"";
 const auction=card('<h2>Аукцион · '+bids.length+' ставок</h2>'+
 (bids.length?bids.map(b=>'<div class="listrow"><div><b>'+enc(b.team)+'</b><div class="tiny muted">Legacy '+fmt(b.legacy||0)+' • '+enc(b.at||"")+'</div></div><strong>'+fmt(b.price)+' €</strong></div>').join(""):empty("Пока нет ставок"))+
 '<label>Моя ставка, €<input type="number" id="newBid" min="1" step=".01" placeholder="Введи свою цену"></label>'+btn("bid","Подать ставку","primary full")+'<p class="footnote">Цена не заполняется автоматически. Ставки сохраняются только в этом браузере.</p>');
 const staff=card('<h2>Участники и задачи</h2><label>Назначить исполнителя</label><select id="projectAssignee"><option value="">Не назначено</option>'+db.crew.members.map(id=>'<option value="'+id+'" '+(p.assignee===id?"selected":"")+'>'+idName(id)+'</option>').join("")+'</select>'+
 btn("assign","Сохранить исполнителя","mini",'style="margin-top:9px"')+
 '<div class="divider"></div><label>Статус лота</label><select id="projectStatus">'+[["draft","Черновик"],["published","Опубликован"],["progress","В работе"],["review","На приёмке"],["accepted","Принят"]].map(a=>'<option value="'+a[0]+'" '+(p.status===a[0]?"selected":"")+'>'+a[1]+'</option>').join("")+'</select>'+
 btn("set-status","Обновить статус","mini",'style="margin-top:8px"')+
 '<p class="footnote">В демо роли не проверяются. В рабочем приложении потребуются права доступа.</p>');
 const bonus=card('<h2>Чаевые и Merit</h2><p class="small">Демо-конверсия: 1 Merit = 0,01 €. Бонус заказчика не покупает Legacy. Юридический и налоговый статус требует отдельной проверки.</p><div class="metric">'+fmt(p.tip||0)+' Merit</div>'+
 '<label>Бонус, €<input id="tipAmount" type="number" min=".01" max="10000" step=".01" placeholder="Например, 200"></label>'+btn("tip","Начислить тестовые Merit","primary full"));
 return '<div class="stack"><div class="detailhead">'+btn("projects-back","← Объекты","mini")+pill(enc(p.kind==="FULL"?"COMPLEX":p.kind),"blue")+pill(enc(p.status),p.status==="accepted"?"ok":"")+'</div>'+top+subView+
 '<div class="grid colsMain"><div class="stack">'+taskView(p)+docsSection(p,docids)+feed(p)+'</div><div class="stack">'+auction+staff+bonus+'</div></div></div>';
}
function docsInherited(p){
 const files=[];let cur=p,seen=new Set();
 while(cur&&!seen.has(cur.id)){seen.add(cur.id);for(const f of (cur.docs||[]))if(!files.some(x=>x.mediaId===f.mediaId))files.push(f);cur=cur.parentId?project(cur.parentId):null}
 return files;
}
function docsSection(p,docs){
 return card('<div class="between"><h2>PDF, планы и файлы</h2>'+pill(docs.length+" файлов","blue")+'</div><p class="small">Доступны в текущем браузере. Документы родительского проекта наследуются сублотами.</p>'+
 (docs.length?docs.map(d=>'<div class="listrow"><div><b>'+enc(d.name)+'</b><div class="tiny muted">'+enc(d.when)+' • '+(d.from===p.id?"Свои":"От родителя")+'</div></div>'+btn("pdf","Открыть ↗","mini",'data-mediaid="'+enc(d.mediaId)+'"')+'</div>').join(""):empty("Нажми «Добавить PDF», чтобы прикрепить проект и Stringplan."))+
 '<label class="btn mini full" style="cursor:pointer;margin-top:12px">＋ Добавить PDF / проект<input type="file" data-file="pdf" data-id="'+p.id+'" accept="application/pdf,.pdf" style="display:none"></label>'+
 '<p class="footnote">Для каждого фотоэтапа можно указать номер страницы PDF. Страница откроется прямо здесь.</p>');
}
function feed(p){
 return card('<h2>Лента объекта</h2><p class="small">Публикации, вопросы, проблемы и комментарии по конкретному лоту.</p>'+
 '<form id="postForm"><label>Тип записи<select name="kind"><option>Ход работ</option><option>Вопрос</option><option>Проблема</option><option>Zusatzarbeiten / Допработы</option></select></label><textarea name="text" required placeholder="Что произошло на объекте?"></textarea><label class="btn mini" style="cursor:pointer">📷 Фото / видео<input type="file" data-file="post-photo" data-id="'+p.id+'" accept="image/*,video/*" style="display:none"></label> <span id="postFileLabel" class="tiny muted"></span><div style="margin-top:11px"><button class="btn primary" type="submit">Опубликовать</button></div></form>'+
 '<div class="divider"></div><div class="thread">'+((p.posts||[]).length?p.posts.slice().reverse().map(post=>'<div class="post"><div class="between"><strong>'+enc(post.kind)+'</strong><span class="tiny muted">'+enc(post.when)+'</span></div><div class="tiny muted">'+enc(person(post.author)?.name||"Участник")+'</div><p>'+enc(post.text)+'</p>'+(post.mediaId?'<div class="checkphoto" style="max-width:300px;max-height:220px"><img data-media="'+enc(post.mediaId)+'" alt="Фото публикации"></div>':"")+
 (post.comments||[]).map(c=>'<div class="comment"><b>'+enc(person(c.by)?.name||"Участник")+'</b> '+enc(c.text)+'</div>').join("")+
 '<form data-form="comment" data-postid="'+enc(post.id)+'" class="row" style="margin-top:10px"><input name="text" required placeholder="Комментарий" style="flex:1;min-width:120px"><button class="btn mini" type="submit">↵</button></form></div>').join(""):empty("Пока здесь тихо. Добавь первую запись."))+'</div>');
}
function market(){
 const lots=db.projects.filter(p=>p.status==="published"||p.status==="progress").filter(p=>ui.filter==="all"||p.kind===ui.filter);
 return '<div class="stack">'+card('<h2>Биржа подрядов</h2><p class="small">Ищем работу по компетенциям, срокам и репутации. Цена не единственный критерий. AC и Anmeldung требуют дополнительной проверки полномочий.</p><div class="segment">'+["all","DC","AC","PLAN","REG","FULL"].map(f=>'<button class="'+(ui.filter===f?"active":"")+'" data-act="filter" data-id="'+f+'">'+f.toUpperCase()+'</button>').join("")+'</div>')+
 '<div class="grid cols3">'+lots.map(p=>'<div class="lot"><div class="between">'+pill(enc(p.kind),"blue")+pill(enc(p.city),"")+'</div><h3>'+enc(p.title)+'</h3><div class="tiny muted">'+enc(p.client)+'</div><div class="price">'+fmt(p.budget)+' €</div><div class="small muted">'+(p.bids||[]).length+' предложений • '+(p.parentId?"Сублот":"Основной лот")+'</div>'+btn("open-project","Детали и ставка ↗","primary full",'data-id="'+p.id+'"')+'</div>').join("")+'</div></div>';
}
function radar(p){
 const skills=p.stats||[55,55,55,55,55,55]; const pts=(v,scale=1)=>skills.map((x,i)=>{let a=(-Math.PI/2)+Math.PI*2*i/6,rad=95*(scale?x/100:1);return (130+Math.cos(a)*rad).toFixed(1)+","+(130+Math.sin(a)*rad).toFixed(1)}).join(" ");
 const labels=["Монтаж","Точность","Логистика","Электрика","Команда","Опыт"];
 return '<svg class="radar" viewBox="0 0 260 260" role="img" aria-label="Навыки участника">'+[.25,.5,.75,1].map(s=>'<polygon points="'+skills.map((_,i)=>{let a=(-Math.PI/2)+Math.PI*2*i/6,r=95*s;return (130+Math.cos(a)*r)+","+(130+Math.sin(a)*r)}).join(" ")+'" stroke="#6d8896" stroke-width=".7" fill="none" opacity=".7"/>').join("")+'<polygon points="'+pts(skills)+'" stroke="#d9e8ed" stroke-width="2.5" fill="#b5d3dd" fill-opacity=".27"/>'+labels.map((x,i)=>{let a=-Math.PI/2+Math.PI*2*i/6;return '<text x="'+(130+Math.cos(a)*115)+'" y="'+(130+Math.sin(a)*115)+'" font-size="9" fill="#c5d5dd" text-anchor="middle">'+x+'</text>'}).join("")+'</svg>';
}
function personDetails(p){
 const mine=p.id==="me";
 const active=db.projects.filter(pr=>pr.assignee===p.id||(pr.bids||[]).some(b=>b.userId===p.id));
 const journal=mine?db.ledger.filter(x=>x.userId==="me"):[];
 const header=card('<div class="row">'+userAvatar(p,true)+'<div><h2 style="font-size:27px;margin:0">'+enc(p.name)+'</h2><div class="sub">'+enc(p.role)+'</div><div class="small muted">'+enc(p.city)+'</div></div></div>'+
 '<div style="margin-top:13px" class="row">'+pill(p.verified?"Подтверждён":"Навыки не проверены",p.verified?"ok":"warn")+pill("Legacy "+fmt(totalLegacy(p)),"blue")+pill("XP "+fmt(p.xp))+'</div>'+
 '<div class="divider"></div><div class="grid cols2"><div><h3>Специализация</h3><div class="row">'+(p.skills||[]).map(s=>pill(enc(s))).join("")+'</div><p class="small">Телефон: '+(p.phone?enc(p.phone):"не указан")+'</p>'+contactButtons(p)+'</div><div><h3>Характеристики • demo</h3>'+radar(p)+'</div></div>'+
 (mine?'<div class="divider"></div>'+btn("edit-profile","✎ Редактировать мой профиль","primary")+' <label class="btn mini" style="cursor:pointer;margin:0">＋ Загрузить аватар<input type="file" data-file="avatar" accept="image/*" style="display:none"></label>':""));
 const projects=card('<h2>История проектов</h2>'+(active.length?active.map(pr=>'<div class="listrow"><button class="itemlink" data-act="open-project" data-id="'+pr.id+'">'+enc(pr.title)+'</button><span class="small muted">'+fmt(pr.budget)+' €</span></div>').join(""):empty("Проектов ещё нет")));
 const finance=card('<h2>Финансовая история</h2>'+(journal.length?journal.slice().reverse().map(x=>'<div class="listrow finance"><div><b>'+enc(x.label)+'</b><div class="tiny muted">'+enc(x.when)+'</div></div><span class="'+(x.delta>=0?"plus":"minus")+'">'+(x.delta>=0?"+":"")+fmt(x.delta)+' Merit</span></div>').join(""):empty(mine?"Тестовых операций ещё нет":"Доступно только владельцу профиля")));
 const reputation=card('<h2>Legacy • профессиональный опыт</h2><div class="grid cols4">'+Object.entries(p.legacy||{}).map(([k,v])=>stat(enc(k.toUpperCase()),fmt(v),"Показатели демо")).join("")+'</div>');
 return '<div class="stack">'+header+'<div class="grid cols2">'+projects+finance+'</div>'+reputation+'</div>';
}
function contactButtons(p){
 const phone=String(p.phone||"").replace(/[^\d+]/g,""),digits=phone.replace(/\D/g,"");
 return p.phone?'<div class="row"><a class="btn mini" href="tel:'+enc(phone)+'">☎ Позвонить</a><a class="btn mini" target="_blank" rel="noopener noreferrer" href="https://wa.me/'+digits+'">WhatsApp ↗</a></div>':'<span class="tiny muted">Кнопки звонков появятся после добавления номера</span>';
}
function crew(){
 const selected=person(ui.person)||person("me");
 const header=card('<div class="between"><div><div class="eyebrow">МОЯ БРИГАДА</div><h2 style="font-size:26px;margin:7px 0">'+enc(db.crew.name)+'</h2><p class="small">Капитан: '+idName(db.crew.captain)+' • Администраторы: '+db.crew.admins.map(idName).join(", ")+'</p></div>'+btn("team-settings","⚙ Команда","mini")+'</div>'+
 '<div class="row">'+pill(db.crew.members.length+" участников","blue")+pill(db.crew.tools?"🛠 Инструменты":"Без инструментов")+pill(db.crew.vehicle?"▣ Транспорт":"Без транспорта")+'</div>');
 const members=card('<div class="between"><h2>Состав и профили</h2>'+btn("invite","＋ Пригласить","primary mini")+'</div>'+db.users.map(p=>userCard(p)).join(""));
 const mentor=card('<div class="between"><h2>MentorGate</h2>'+pill("Invite only","blue")+'</div><p class="small">Ввести новичка в систему может участник с достаточным Merit. На обучение резервируется депозит, который возвращается после проверки этапов.</p>'+
 '<div class="grid cols2">'+stat("Зарезервировано",fmt(db.frozen),"Merit")+stat("Наставничеств",db.mentor.length,"Всего в демо")+'</div><div style="margin-top:13px">'+btn("mentor","Открыть MentorGate","primary full")+'</div><div class="divider"></div>'+
 db.mentor.map(m=>'<div class="listrow"><div><b>'+enc(person(m.trainee)?.name||"Новичок")+'</b><div class="small muted">'+fmt(m.progress)+' / '+fmt(m.stake)+' учебных Merit</div></div>'+pill(m.finished?"Завершено":"Обучение",m.finished?"ok":"warn")+'</div>').join(""));
 const stats=card('<h2>Статистика участника</h2>'+personDetails(selected));
 return '<div class="stack">'+header+'<div class="grid colsMain"><div class="stack">'+members+stats+'</div>'+mentor+'</div></div>';
}
function messages(){
 const channels=db.projects.filter(p=>!p.parentId).map(p=>({id:p.id,title:p.title}));
 const p=project(ui.chat)||db.projects[0];if(!p)return empty("Нет каналов");
 return '<div class="stack">'+card('<h2>Коммуникация внутри NVTSK</h2><p>Проектные каналы и личные сообщения. В этом прототипе сообщения доступны только в твоём браузере. Для общения между телефонами необходим сервер.</p>')+
 '<div class="chatwrap"><div class="card"><h3>Каналы объектов</h3>'+channels.map(c=>'<div class="listrow"><button class="itemlink" data-act="chat" data-id="'+c.id+'">'+enc(c.title)+'</button>'+(ui.chat===c.id?pill("●","ok"):"")+'</div>').join("")+'</div>'+
 '<div class="card"><div class="between"><h2>'+enc(p.title)+'</h2>'+pill("DEMO • Local","warn")+'</div><div class="chatlog" id="chatLog">'+(p.messages||[]).map(m=>'<div class="bubble '+(m.from==="me"?"me":"")+'"><small>'+enc(person(m.from)?.name||m.from)+' • '+enc(m.when)+'</small>'+enc(m.text)+'</div>').join("")+'</div><form id="chatForm" class="row" style="margin-top:12px"><input name="text" required placeholder="Сообщение в проект…" style="flex:1;min-width:120px"><button class="btn primary" type="submit">➤</button></form><p class="footnote">Никаких сообщений другим людям это демо не отправляет.</p></div></div></div>';
}
function profile(){
 const p=person("me");
 const ledger=db.ledger.slice().reverse();
 const active=db.projects.filter(x=>x.assignee==="me"||(x.bids||[]).some(b=>b.mine));
 const header=card('<div class="between"><div class="person">'+userAvatar(p,true)+'<div><h2 style="font-size:27px;margin:0">'+enc(p.name)+'</h2><div class="small muted">'+enc(p.role)+' • '+enc(p.city)+'</div><div class="row" style="margin-top:7px">'+pill("Merit "+fmt(db.merit),"blue")+pill("Заморожено "+fmt(db.frozen))+'</div></div></div>'+
 btn("edit-profile","✎ Изменить","mini")+'</div><div class="divider"></div><div class="row"><label class="btn mini" style="cursor:pointer;margin:0">＋ Фото профиля<input type="file" data-file="avatar" accept="image/*" style="display:none"></label>'+contactButtons(p)+'</div>');
 const metrics=card('<h2>Персональные показатели</h2>'+radar(p)+'<div class="grid cols2">'+stat("XP",fmt(db.xp),"Опыт в системе")+stat("Legacy",fmt(totalLegacy(p)),"Профессиональный след")+'</div>');
 const projects=card('<h2>Связанные проекты</h2>'+(active.length?active.map(pr=>'<div class="listrow"><button class="itemlink" data-act="open-project" data-id="'+pr.id+'">'+enc(pr.title)+'</button><span>'+fmt(pr.budget)+' €</span></div>').join(""):empty("Пока без назначений")));
 const history=card('<div class="between"><h2>История Merit и операций</h2>'+pill("Локальный учёт","warn")+'</div>'+(ledger.length?ledger.map(l=>'<div class="listrow finance"><div><b>'+enc(l.label)+'</b><div class="tiny muted">'+enc(l.when)+' • '+(project(l.projectId)?enc(project(l.projectId).title):"MentorGate")+'</div></div><strong class="'+(l.delta>=0?"plus":"minus")+'">'+(l.delta>=0?"+":"")+fmt(l.delta)+' Merit</strong></div>').join(""):empty("История пока пустая")));
 const safety=card('<h2>Безопасность данных</h2><p class="small">Всё хранится на устройстве. Очистка данных сайта может удалить проекты, фото и PDF. Для реальной работы требуются аккаунты, разграничение доступа, резервные копии и серверная база.</p>'+
 btn("export","Экспортировать данные JSON","mini")+' '+btn("reset-demo","Сбросить демо","danger mini"));
 return '<div class="stack">'+header+'<div class="grid cols2">'+metrics+projects+'</div>'+history+safety+'</div>';
}
function currentPage(){
 if(ui.screen==="dashboard")return overview();
 if(ui.screen==="projects")return ui.projectDetail?projectDetail():projectList();
 if(ui.screen==="market")return market();
 if(ui.screen==="crew")return crew();
 if(ui.screen==="messages")return messages();
 if(ui.screen==="profile")return profile();
 return overview();
}
function render(){
 navRender();
 Q("#view").innerHTML='<section class="screen">'+currentPage()+'</section>';
 hydrateMedia();
 const chat=Q("#chatLog");if(chat)chat.scrollTop=chat.scrollHeight;
}
function listRoot(){ui.projectDetail=false;go("projects")}
function detail(id){ui.project=id;ui.projectDetail=true;go("projects")}
function createProjectModal(parentId=null){
 const p=project(parentId);
 openModal('<h2>'+(p?"Новый сублот на основе проекта":"Новый проект")+'</h2><p class="small">Адрес, заказчик и документы наследуются от родительского лота, но цену, исполнителя и статус можно менять отдельно.</p>'+
 '<form id="projectForm">'+(p?'<input type="hidden" name="parentId" value="'+p.id+'">':"")+
 '<label>Название<input name="title" required value="'+(p?enc(p.title+" • новая работа"):"")+'" placeholder="Например, Монтаж 48 панелей"></label>'+
 '<label>Заказчик<input name="client" required value="'+(p?enc(p.client):"")+'" list="clients-list"></label><datalist id="clients-list">'+companyNames.map(s=>'<option value="'+enc(s)+'">').join("")+'</datalist>'+
 '<div class="grid cols2"><div><label>Город<input name="city" value="'+(p?enc(p.city):"")+'" required></label></div><div><label>Тип лота<select name="kind">'+["FULL","DC","AC","PLAN","REG"].map(k=>'<option value="'+k+'" '+(p?.kind===k?"selected":"")+'>'+k+'</option>').join("")+'</select></label></div></div>'+
 '<label>Адрес<input name="address" value="'+(p?enc(p.address):"")+'" placeholder="Точный адрес объекта"></label>'+
 '<label>Бюджет, €<input name="budget" type="number" step=".01" min="0" value="'+(p?"":0)+'"></label><label>Описание<textarea name="notes">'+(p?enc(p.notes):"")+'</textarea></label>'+
 '<div class="row" style="margin-top:15px"><button type="submit" class="btn primary">Сохранить</button>'+btn("close","Отмена","ghost")+'</div></form>');
}
function editProjectModal(){
 const p=project(ui.project);if(!p)return;
 openModal('<h2>Редактировать объект</h2><form id="editProjectForm"><label>Название<input name="title" value="'+enc(p.title)+'" required></label><label>Город<input name="city" value="'+enc(p.city)+'" required></label><label>Адрес<input name="address" value="'+enc(p.address)+'"></label><label>Заказчик<input name="client" value="'+enc(p.client)+'" required></label><label>Цена, €<input type="number" min="0" step=".01" name="budget" value="'+enc(p.budget)+'"></label><label>Описание<textarea name="notes">'+enc(p.notes)+'</textarea></label><button class="btn primary" type="submit">Сохранить</button></form>');
}
function splitProject(id){
 const p=project(id);if(!p)return;
 let added=0;
 for(const [kind,name,description] of splits){if(children(id).some(x=>x.kind===kind))continue;
 const n={...p,id:uid(),parentId:p.id,title:name,kind,notes:description,budget:0,status:"draft",assignee:"",tasks:{},docs:[],posts:[],messages:[],bids:[],tip:0,created:date()};
 db.projects.push(n);added++;}
 persist();detail(id);notify(added?"Добавлено "+added+" связанных сублота(ов)":"Четыре типовых сублота уже есть");
}
function addLedger(label,delta,projectId=""){db.ledger.push({id:uid(),userId:"me",label,delta,projectId,when:date()})}
function mentorModal(){
 openModal('<h2>MentorGate • пригласить новичка</h2><p>Наставник резервирует Merit на период обучения. Для начала необходимо минимум 1 000 активных Merit. Ставка 2 500 даёт возможность выбрать повышенный бонус x2 только после подтверждённого обучения. В демо подтверждение имитируется.</p>'+
 '<div class="grid cols2">'+stat("Баланс",fmt(db.merit),"Merit")+stat("Заморожено",fmt(db.frozen),"Merit")+'</div>'+
 '<form id="mentorForm"><label>Имя новичка<input name="name" required placeholder="Имя, фамилия"></label><label>Специальность<select name="skill"><option value="DC">DC / Montage</option><option value="AC">AC • до проверки не допускается к электромонтажу</option><option value="LOG">Логистика</option></select></label><label>Резерв Merit<select name="stake"><option value="1000">1 000 Merit • обычная программа</option><option value="2500">2 500 Merit • повышенная x2</option></select></label><button type="submit" class="btn primary" style="margin-top:13px">Зарезервировать и пригласить</button></form>'+
 '<div class="divider"></div><h3>Текущие программы</h3>'+db.mentor.map(m=>'<div class="listrow"><div><b>'+enc(person(m.trainee)?.name||"Новичок")+'</b><div class="small muted">'+fmt(m.progress)+' / '+fmt(m.stake)+' учебных Merit</div></div>'+(m.finished?pill("Завершено","ok"):btn("mentor-progress","Зачесть +250","mini",'data-id="'+m.id+'"'))+'</div>').join("")+'<p class="footnote">Legacy невозможно купить или удвоить депозитом: репутация растёт только за подтверждённые результаты работы. Реальный MentorGate потребует проверку личности и защиту от фиктивных приглашений.</p>');
}
function inviteModal(){
 openModal('<h2>Пригласить участника</h2><p>Существующие тестовые специалисты присоединяются к твоему отряду. Для нового человека используй MentorGate.</p>'+
 db.users.filter(x=>!db.crew.members.includes(x.id)).map(p=>'<div class="listrow"><div class="person">'+userAvatar(p)+'<div><b>'+enc(p.name)+'</b><div class="small muted">'+enc(p.role)+'</div></div></div>'+btn("add-member","В отряд","mini",'data-id="'+p.id+'"')+'</div>').join("")+
 '<div class="divider"></div>'+btn("mentor","＋ Новый через MentorGate","primary full"));
}
function teamSettings(){
 openModal('<h2>Настройки отряда</h2><form id="teamForm"><label>Название<input name="name" value="'+enc(db.crew.name)+'" required></label><label><input type="checkbox" name="tools" '+(db.crew.tools?"checked":"")+'> Есть инструменты</label><label><input type="checkbox" name="vehicle" '+(db.crew.vehicle?"checked":"")+'> Есть транспорт</label><div class="divider"></div><h3>Администраторы</h3>'+db.crew.members.map(id=>'<label><input type="checkbox" name="admin" value="'+id+'" '+(db.crew.admins.includes(id)?"checked":"")+' '+(id==="me"?"disabled":"")+'>'+idName(id)+'</label>').join("")+'<button type="submit" class="btn primary" style="margin-top:13px">Сохранить</button></form>');
}
function editProfile(){
 const p=person("me");
 openModal('<h2>Мой профиль</h2><form id="profileForm"><label>Имя<input name="name" required value="'+enc(p.name)+'"></label><label>Специализация<input name="role" value="'+enc(p.role)+'"></label><label>Город<input name="city" value="'+enc(p.city)+'"></label><label>Телефон (+49…) <input name="phone" type="tel" value="'+enc(p.phone||"")+'" placeholder="+49 123 456789"></label><button class="btn primary" type="submit">Сохранить профиль</button></form>');
}
function receiveProof(p,phase,side,id){
 p.tasks||={};p.tasks[phase]||={status:"new"};
 p.tasks[phase][side]=id;p.tasks[phase].status=side==="after"?"review":(p.tasks[phase].status||"new");
 persist();render();notify("Файл прикреплён к этапу "+phase);
}
function approve(p,phase){
 p.tasks||={};const t=p.tasks[phase];if(!t?.after){notify("Сначала прикрепи фото после");return}
 if(t.status==="accepted"){t.status="review";persist();render();return}
 t.status="accepted";
 // Reputation is earned for completed, reviewed work, never for purchased Merit.
 const who=person(p.assignee||"me"); if(who){const prop=p.kind==="AC"?"ac":"dc";who.legacy[prop]=(who.legacy[prop]||0)+25;who.xp+=60;}
 if(p.assignee==="me"||!p.assignee){db.xp+=60;}
 addLedger("Подтверждение фотоэтапа: "+phase,0,p.id);persist();render();notify("Этап принят (демо). Legacy: +25 исполнителю");
}
function tip(p,eur){
 if(!(eur>0&&eur<=10000)){notify("Укажи сумму от 0,01 до 10 000 €");return}
 const pts=Math.round(eur*100);p.tip=(p.tip||0)+pts;db.merit+=pts;
 addLedger("Демо-бонус заказчика • "+fmt(eur)+" €",pts,p.id);
 persist();render();notify("Тестовое начисление +"+fmt(pts)+" Merit");
}
function bid(p,amount){
 if(!(amount>0)){notify("Введи действительную цену");return}
 const memberIds=db.crew.members;
 const appropriate=p.kind==="AC"?memberIds.some(id=>person(id)?.skills.includes("AC")):true;
 if(!appropriate){notify("Для AC отсутствует участник с заявленной компетенцией");return}
 p.bids||=[];p.bids=p.bids.filter(b=>!b.mine);
 p.bids.push({id:uid(),team:db.crew.name,userId:"me",price:amount,legacy:totalLegacy(person("me")),at:date(),mine:true});persist();render();notify("Ставка "+fmt(amount)+" € сохранена локально");
}
function cancelMentor(){} // Reserved for authenticated workflows.
function progressMentor(id){
 const m=db.mentor.find(x=>x.id===id);if(!m||m.finished)return;
 m.progress=Math.min(m.stake,m.progress+250);
 if(m.progress>=m.stake){
  m.finished=true;db.frozen-=m.stake;db.merit+=m.stake;addLedger("MentorGate • возврат резерва",m.stake);
  // Reward only in demo; production version must use verified training events.
  const extra=m.stake>=2500?m.stake:Math.round(m.stake*.1);
  db.merit+=extra;addLedger("MentorGate • учебный бонус (демо)",extra);
 }
 persist();mentorModal();notify(m.finished?"Обучение завершено, резерв возвращён":"Этап обучения зачтён (+250 demo)");
}
function saveMedia(file){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(MEDIA_DB,1);
  req.onupgradeneeded=()=>req.result.createObjectStore("files",{keyPath:"id"});
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const d=req.result,tx=d.transaction("files","readwrite");
   const id=uid();tx.objectStore("files").put({id,name:file.name,type:file.type,file,when:date()});
   tx.oncomplete=()=>{d.close();resolve(id)};
   tx.onerror=()=>{d.close();reject(tx.error)};
  };
 });
}
function getMedia(id){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(MEDIA_DB,1);
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const d=req.result,tx=d.transaction("files","readonly");
   const req2=tx.objectStore("files").get(id);
   req2.onsuccess=()=>{resolve(req2.result||null);d.close()};
   req2.onerror=()=>{reject(req2.error);d.close()};
  };
 });
}
const objectCache=new Map();
async function mediaUrl(id){
 if(objectCache.has(id))return objectCache.get(id);
 const rec=await getMedia(id);if(!rec)return null;
 const url=URL.createObjectURL(rec.file);objectCache.set(id,url);return url;
}
async function hydrateMedia(){
 for(const el of QA("[data-media]")){
  const id=el.dataset.media;
  try{const url=await mediaUrl(id);if(url&&el.isConnected){el.src=url}}catch(e){console.warn("media unavailable",e)}
 }
}
async function openPdf(id,page=1){
 try{
  const url=await mediaUrl(id);if(!url)return notify("PDF не найден в этом браузере");
  const f=await getMedia(id);
  openModal('<div class="between"><h2>'+enc(f?.name||"PDF")+'</h2>'+btn("close","×","mini")+'</div><iframe class="docs-frame" title="Просмотр PDF" src="'+url+'#page='+Number(page||1)+'"></iframe><p class="footnote">Для просмотра используется встроенная функция браузера; на некоторых iPhone PDF может открыться в системном просмотрщике.</p>');
 }catch(e){notify("Не удалось открыть PDF")}
}
function modalConfirmReset(){
 openModal('<h2>Сбросить демо?</h2><p>Это удалит локальные проекты, ставки и баллы. Медиафайлы в IndexedDB останутся до очистки данных сайта. Действие нельзя отменить.</p><div class="row">'+btn("confirm-reset","Сбросить всё","danger")+btn("close","Отмена")+'</div>');
}
function exportJson(){
 const b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(b);const a=document.createElement("a");a.href=url;a.download="nvtsk-system-v0.3-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);notify("Экспорт сохранён без фото и PDF");
}
const appActions={
 nav:b=>{ui.projectDetail=false;go(b.dataset.id)},
 "open-project":b=>detail(b.dataset.id),
 "projects-back":()=>listRoot(),
 filter:b=>{ui.filter=b.dataset.id;render()},
 split:b=>splitProject(b.dataset.id),
 clone:()=>createProjectModal(ui.project),
 "new-project":()=>createProjectModal(),
 "edit-project":()=>editProjectModal(),
 close:()=>closeModal(),
 person:b=>{ui.person=b.dataset.id;go("crew")},
 "edit-profile":()=>editProfile(),
 mentor:()=>mentorModal(),
 "mentor-progress":b=>progressMentor(b.dataset.id),
 invite:()=>inviteModal(),
 "add-member":b=>{if(!db.crew.members.includes(b.dataset.id))db.crew.members.push(b.dataset.id);persist();closeModal();render();notify("Участник добавлен в демо-отряд")},
 "team-settings":()=>teamSettings(),
 "show-stage-pdf":b=>{const p=project(b.dataset.id),docs=docsInherited(p);if(!docs.length)return notify("Прикрепи PDF к этому проекту");const page=p.tasks[b.dataset.phase]?.pdfPage||1;openPdf(docs[0].mediaId,page)},
 pdf:b=>openPdf(b.dataset.mediaid),
 "approve-task":b=>approve(project(b.dataset.id),b.dataset.phase),
 "assign":()=>{const p=project(ui.project);p.assignee=Q("#projectAssignee").value;persist();render();notify("Исполнитель назначен (демо)")},
 "set-status":()=>{const p=project(ui.project);p.status=Q("#projectStatus").value;persist();render();notify("Статус обновлён")},
 bid:()=>bid(project(ui.project),Number(Q("#newBid").value)),
 tip:()=>tip(project(ui.project),Number(Q("#tipAmount").value)),
 chat:b=>{ui.chat=b.dataset.id;go("messages")},
 export:()=>exportJson(),
 "reset-demo":()=>modalConfirmReset(),
 "confirm-reset":()=>{db=initial();persist();closeModal();ui.projectDetail=false;go("dashboard");notify("Демо сброшено")}
};
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-act]");if(!b)return;const fn=appActions[b.dataset.act];
 if(fn){ev.preventDefault();fn(b)}
});
document.addEventListener("submit",ev=>{
 const f=ev.target;
 if(!(f instanceof HTMLFormElement))return;
 ev.preventDefault();const d=Object.fromEntries(new FormData(f));
 if(f.id==="projectForm"){
  const par=d.parentId?project(d.parentId):null;
  const p=par?{...par,id:uid(),parentId:par.id,title:d.title,kind:d.kind,client:d.client,city:d.city,address:d.address,notes:d.notes,budget:Number(d.budget||0),status:"draft",assignee:"",docs:[],posts:[],messages:[],bids:[],tasks:{},tip:0,created:date()}:
  seedProject(uid(),d.title,d.client,d.city,0,Number(d.budget||0),d.kind,d.notes);
  if(!par){p.address=d.address;p.status="draft";}
  db.projects.push(p);persist();closeModal();detail(p.id);notify("Проект создан");
 }else if(f.id==="editProjectForm"){
  const p=project(ui.project);for(const k of ["title","client","city","address","notes"])p[k]=d[k]||"";
  p.budget=Number(d.budget)||0;persist();closeModal();render();notify("Объект сохранён");
 }else if(f.id==="mentorForm"){
  const stake=Number(d.stake);if(db.merit<stake)return notify("Недостаточно активных Merit");
  const trainee={id:uid(),name:d.name,role:d.skill+" • Trainee",skills:[],city:"",phone:"",legacy:{dc:0,ac:0,plan:0,lead:0},xp:0,stats:[20,20,20,20,35,10],verified:false};
  db.users.push(trainee);db.crew.members.push(trainee.id);db.merit-=stake;db.frozen+=stake;
  db.mentor.push({id:uid(),trainee:trainee.id,mentor:"me",stake,progress:0,finished:false,created:date()});
  addLedger("MentorGate • заморозка резерва",-stake);
  persist();closeModal();go("crew");notify("Новичок добавлен, "+fmt(stake)+" Merit зарезервировано");
 }else if(f.id==="teamForm"){
  db.crew.name=d.name;db.crew.tools=!!d.tools;db.crew.vehicle=!!d.vehicle;db.crew.admins=["me",...new FormData(f).getAll("admin").filter(id=>id!=="me")];
  persist();closeModal();render();notify("Состав администраторов обновлён");
 }else if(f.id==="profileForm"){
  const p=person("me");for(const k of ["name","role","city","phone"])p[k]=d[k]||"";
  persist();closeModal();render();notify("Профиль сохранён");
 }else if(f.id==="chatForm"){
  const p=project(ui.chat);p.messages||=[];p.messages.push({id:uid(),from:"me",text:d.text,when:date()});
  persist();render();notify("Сообщение сохранено локально");
 }else if(f.id==="postForm"){
  const p=project(ui.project);p.posts||=[];p.posts.push({id:uid(),kind:d.kind,text:d.text,mediaId:ui.postMedia||"",author:"me",comments:[],when:date()});
  ui.postMedia="";persist();render();notify("Пост добавлен");
 }else if(f.dataset.form==="comment"){
  const p=project(ui.project),post=p.posts.find(x=>x.id===f.dataset.postid);
  if(post){post.comments||=[];post.comments.push({by:"me",text:d.text});persist();render();}
 }
});
document.addEventListener("change",async ev=>{
 const el=ev.target;
 if(el.matches("[data-editpage]")){
  const [pid,ph]=el.dataset.editpage.split(":");const p=project(pid);
  p.tasks[ph]||={status:"new"};p.tasks[ph].pdfPage=Number(el.value)||0;
  persist();notify("Страница плана привязана");return;
 }
 if(!el.matches("input[type=file][data-file]"))return;
 const file=el.files&&el.files[0];if(!file)return;
 const type=el.dataset.file;
 if(type==="pdf" && !(/\.pdf$/i.test(file.name)||file.type==="application/pdf"))return notify("Нужен PDF");
 if(file.size>60*1024*1024)return notify("Файл больше 60 МБ. Для демо выбери меньший.");
 try{
  notify("Сохраняю файл…");
  const id=await saveMedia(file);
  if(type==="avatar"){person("me").avatar=id;persist();render();notify("Аватар обновлён");return;}
  if(type==="pdf"){const p=project(el.dataset.id);p.docs.push({mediaId:id,name:file.name,from:p.id,when:date()});persist();render();notify("PDF сохранён в этом браузере");return;}
  if(type==="proof"){receiveProof(project(el.dataset.id),el.dataset.phase,el.dataset.side,id);return;}
  if(type==="post-photo"){ui.postMedia=id;const l=Q("#postFileLabel");if(l)l.textContent="Готово: "+file.name;notify("Фото подготовлено для публикации");return;}
 }catch(e){console.error(e);notify("Ошибка сохранения медиа. Проверь доступность IndexedDB.")}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
Q("#modalback").addEventListener("click",e=>{if(e.target===Q("#modalback"))closeModal()});
Q("#modeSwitch").onclick=()=>{ui.role=ui.role==="worker"?"client":"worker";render();notify("Демо-режим переключён. Роли пока не ограничивают действия.")};
Q("#appReset").onclick=modalConfirmReset;
document.addEventListener("DOMContentLoaded",()=>{});
render();
})();
