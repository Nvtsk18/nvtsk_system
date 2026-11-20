
/* NVTSK SYSTEM Silver: gamified operations demo. No authentication, external messaging or payments. */
(() => {
"use strict";
const api=window.NVTSK_API;
if(!api){console.error("NVTSK base UI unavailable");return}
const {db,ui,persist,render,go,project,person,children,notify,openModal,closeModal,detail,enc,fmt,date,uid,card,stat,pill,btn,saveMedia,mediaUrl,totalLegacy}=api;
const Q=s=>document.querySelector(s);
const game=db.game||=( {registration:{complete:false,guest:false,handle:"",email:""},claims:[],starts:[],district:{},inventory:{rss:false,lift:false,laser:false,evcharger:false},worldTab:"garage",wardrobe:["graphite"],outfit:"graphite",following:[],activity:[],raids:{},season:1,awardBook:[],wantedReplies:[],guildName:"",training:[],missionView:"all"});
if(game.registration&&Object.prototype.hasOwnProperty.call(game.registration,"kind"))delete game.registration.kind;
db.social||={posts:[],notifications:[]};
db.social.posts||=[];db.social.notifications||=[];
if(!db.social.posts.length){
 db.social.posts=[
 {id:"post-welcome",author:"roman",text:"Новая миссия: DC-монтаж. Проверяем Schienen, Dachhaken и фото после! 🛠️",tag:"На объекте",likes:[],comments:[],when:date(),demo:true},
 {id:"post-safety",author:"olena",text:"Перед AC-Anschluss проверьте квалификацию, технические условия Netzbetreiber и протокол измерений. ⚡",tag:"Советы",likes:[],comments:[],when:date(),demo:true}
 ];
}
const fskills=[
 {id:"roof",title:"Dach Montage",icon:"▥",about:"Dachhaken, Schienen, Klemmen и PV-модули",levels:[12,13,15,17]},
 {id:"safety",title:"Safety & RSS",icon:"⬡",about:"Безопасность, Gerüst, защита кровли",levels:[12,14,16,18]},
 {id:"logistics",title:"Logistics",icon:"▣",about:"Материал, доставка, маршрут, подъёмники",levels:[12,13,15,18]},
 {id:"leader",title:"Crew Leadership",icon:"♜",about:"Капитан, сублоты, командное планирование",levels:[12,14,16,19]},
 {id:"ac",title:"AC Knowledge",icon:"ϟ",about:"Обучение не равно допуску Elektrofachkraft",levels:[13,15,17,20]}
];
const gear=[
 {id:"tools",name:"Профессиональный инструмент",subtitle:"Шуруповёрты, биты, крепёж",icon:"⚒",required:"DC миссии",type:"linked"},
 {id:"vehicle",name:"Рабочий бус",subtitle:"Доставка материалов и бригады",icon:"▣",required:"Крупные рейды",type:"linked"},
 {id:"rss",name:"RSS / Dachschutz",subtitle:"Защита от падений на скатной крыше",icon:"▥",required:"Roof-рейды"},
 {id:"lift",name:"Монтажный подъёмник",subtitle:"Материалы и подъём панелей",icon:"⇧",required:"Mega-рейды"},
 {id:"laser",name:"Measuring Kit",subtitle:"Лазер, разметка, проверка",icon:"⌁",required:"Точность работы"},
 {id:"evcharger",name:"AC Prüfgerät",subtitle:"Визуальный инвентарь, не лицензия",icon:"ϟ",required:"Проекты AC"}
];
const outfits=[
 {id:"graphite",name:"Graphite Default",price:0,desc:"Фирменная графитовая форма"},
 {id:"silver",name:"Silver Captain",price:300,desc:"Серебряный косметический бейдж"},
 {id:"urban",name:"Urban Installer",price:500,desc:"Тёмная тактическая форма"},
 {id:"carbon",name:"Carbon Legend",price:900,desc:"Карбоновый стиль ветерана"}
];
const missionRank=x=>x>=20?"Master Contractor":x>=17?"Crew Legend":x>=15?"Site Leader":x>=13?"Installer Pro":"Rookie Captain";
const level=()=>Math.max(12,12+Math.floor(Math.max(0,db.xp-24650)/1800));
const xpProgress=()=>Math.min(100,Math.floor((Math.max(0,db.xp-24650)%1800)/1800*100));
const cityPoints=city=>Number(game.district[city]||0);
const cityTitle=city=>cityPoints(city)>=350?"Район под контролем":cityPoints(city)>=140?"Постоянная команда":cityPoints(city)>0?"Местные контакты":"Не освоен";
const isRaid=p=>(Number(p.kw||0)>=30||(/\b90\b/.test(p.title)||p.kind==="FULL"));
const missionLevel=p=>isRaid(p)?14:p.kind==="AC"||p.kind==="REG"?15:p.kind==="PLAN"?13:Number(p.kw||0)>=20?13:12;
const xpReward=p=>isRaid(p)?1200:p.kind==="AC"?750:p.kind==="REG"?550:500;
const meritReward=p=>isRaid(p)?350:Math.max(120,Math.min(300,Math.round(Number(p.budget||0)/10)||140));
const proofSteps=p=>{
 const kind=p.kind;
 const ids=kind==="AC"?["inverter"]:kind==="REG"?["docs"]:kind==="PLAN"?["plans"]:kind==="DC"?["roof","uk","modules","strings","earth","cable"]:["roof","uk","modules","strings","earth","cable","inverter","docs"];
 return ids.map(id=>({id,done:p.tasks?.[id]?.status==="accepted"}));
};
const requirements=p=>{
 const reasons=[],r=missionLevel(p),members=db.crew.members.map(person).filter(Boolean);
 if(level()<r)reasons.push("Нужен уровень "+r);
 if(p.kind==="AC"||p.kind==="REG"||p.kind==="FULL"){
   if(!members.some(x=>x.skills?.includes("AC")&&(x.verified||game.demoAcReady)))reasons.push("Требуется Elektrofachkraft (для демо можно включить тестовый флаг в гараже)");
 }
 if(p.kind==="DC"||p.kind==="FULL"){
  if(!members.some(x=>x.skills?.includes("DC")))reasons.push("Нужен DC-монтажник");
  if(!db.crew.tools)reasons.push("Нет инструментов");
 }
 if(isRaid(p)){
  if(members.length<4)reasons.push("Рейд требует 4 участников");
  if(!db.crew.vehicle)reasons.push("Нет транспорта");
  if(!game.inventory.rss)reasons.push("Нет RSS/Dachschutz");
  if(!game.inventory.lift)reasons.push("Нет подъёмника");
 }
 return {ok:!reasons.length,reasons};
};
const compactProgress=p=>{const a=proofSteps(p),n=a.filter(x=>x.done).length;return {n,total:a.length,percent:Math.round(n/Math.max(1,a.length)*100)}};
const stkey=key=>String(key).replace(/[^a-zA-Z0-9_-]/g,"");
const ch=name=>enc(name||"");
const empty=t=>'<div class="empty">'+ch(t)+'</div>';
const userName=id=>ch(person(id)?.name||id||"Пользователь");
const msgPost=p=>p.author==="me"?person("me")?.name:person(p.author)?.name||"Пользователь";
const styleIcon=(id)=>({DC:"▥",AC:"ϟ",REG:"⌁",PLAN:"▤",FULL:"♜"})[id]||"▣";
const activity=(text)=>{game.activity.unshift({id:uid(),text,when:date()});game.activity=game.activity.slice(0,80)};
const ledger=(label,delta,projectId)=>{db.ledger.push({id:uid(),userId:"me",label,delta,projectId:projectId||"",when:date()})};
const socialNotify=(msg)=>{db.social.notifications.unshift({id:uid(),text:msg,when:date()});db.social.notifications=db.social.notifications.slice(0,35)};
const save=()=>persist();
function avatar(id,big=false){
 const p=person(id);
 return '<div class="avatar '+(big?'big':'')+'">'+(p?.avatar?'<img data-media="'+enc(p.avatar)+'" alt="Аватар">':enc((p?.name||"?").charAt(0)))+'</div>';
}
function topCard(){
 const p=person("me");
 return '<div class="card game-hero"><div class="eyebrow">NVTSK • CAREER MODE / SILVER EDITION</div><div class="char-top"><div class="char-portrait">'+avatar("me",true)+'</div><div><h2>'+ch(p.name)+'</h2><div class="small">'+ch(api.skillText(p))+'</div><div class="row" style="margin:10px 0">'+pill("LVL "+level(),"blue")+pill(missionRank(level()))+pill(game.outfit.toUpperCase())+'</div></div></div><div class="between small"><span>XP до следующего уровня</span><strong>'+xpProgress()+'%</strong></div><div class="statbar"><i style="width:'+xpProgress()+'%"></i></div><div class="row" style="margin-top:18px">'+btn("game-nav","✦ Доска миссий","primary",'data-screen="missions"')+btn("game-nav","◈ Кошелёк","",'data-screen="wallet"')+'</div></div>';
}
function missionCard(p){
 const step=compactProgress(p),done=game.claims.includes(p.id),started=game.starts.includes(p.id),access=requirements(p);
 const role=api.roleInLot(p);const status=done?"✓ COMPLETED":started?"● ACTIVE":role.code==="client"?"МОЙ ЛОТ":access.ok?"READY":"LOCKED";
 return '<div class="lot gta-mission '+(done?"gta-completed":"")+'"><div class="mission-banner"><span>'+styleIcon(p.kind)+' '+ch(p.kind)+'</span><b>LVL '+missionLevel(p)+'</b></div><div class="between">'+pill(ch(p.city),"blue")+pill(status,done?"ok":access.ok?"blue":"warn")+'</div><div><h3>'+ch(p.title)+'</h3><div class="small muted">'+ch(p.client)+' · '+role.label+'</div></div><div class="mission-prizes"><span>⚡ '+fmt(xpReward(p))+' XP</span><span>◈ '+fmt(meritReward(p))+' Merit</span><span>★ +Legacy</span></div><div class="between small sub"><span>Фотодоказательства</span><strong>'+step.n+'/'+step.total+'</strong></div><div class="statbar"><i style="width:'+step.percent+'%"></i></div>'+
 (!access.ok?'<div class="small caveat">'+access.reasons.map(ch).join(" • ")+'</div>':'')+
 '<div class="row">'+btn("game-open","Досье ↗","mini primary",'data-id="'+enc(p.id)+'"')+
 (!started&&!done&&role.code!=="client"?btn("game-start","Взять контракт","mini",'data-id="'+enc(p.id)+'" '+(!access.ok?'disabled':'')):"")+
 (started&&!done?btn("game-claim","Сдать миссию","mini",'data-id="'+enc(p.id)+'" '+(!access.ok||step.n!==step.total?'disabled':'')):"")+
 '</div></div>';
}
function missions(){
 const active=db.projects.filter(p=>p.status==="published"||p.status==="progress");
 const available=active.filter(p=>game.missionView==="all"||game.missionView==="raid"&&isRaid(p)||game.missionView==="ready"&&requirements(p).ok);
 const district=[...new Set(db.projects.map(p=>p.city).filter(Boolean))];
 return '<div class="stack">'+topCard()+'<div class="grid cols3">'+
 stat("Миссии завершены",game.claims.length,"Сданные объекты в локальном демо")+
 stat("Активных контрактов",game.starts.filter(id=>!game.claims.includes(id)).length,"Отряд на заданиях")+
 stat("Territory REP",Object.values(game.district).reduce((a,b)=>a+Number(b||0),0),"Репутация по городам")+'</div>'+
 '<div class="between"><h2>Mission Board</h2><div class="segment">'+[["all","Все"],["ready","Доступные"],["raid","Рейды"]].map(([id,title])=>'<button data-game="mission-filter" data-id="'+id+'" class="'+(game.missionView===id?"active":"")+'">'+title+'</button>').join("")+'</div></div>'+
 '<div class="grid cols3">'+(available.length?available.map(missionCard).join(""):empty("В этой категории пока нет миссий"))+'</div>'+
 card('<h2>Territory Control · города</h2><p class="small">После сдачи миссии растёт влияние бригады в её городе. Это игровая репутация, не гарантированный доступ к заказам.</p><div class="grid cols3">'+district.map(city=>'<div class="district"><div class="between"><strong>'+ch(city)+'</strong>'+pill(cityPoints(city)+" REP","blue")+'</div><div class="small muted">'+cityTitle(city)+'</div><div class="statbar"><i style="width:'+Math.min(100,cityPoints(city)/350*100)+'%"></i></div></div>').join("")+'</div>')+
 card('<h2>Побочные задания</h2><div class="grid cols3">'+sideQuests().map(q=>'<div class="step"><h3>'+q.title+'</h3><p class="small">'+q.desc+'</p>'+pill("+"+q.reward+" Merit","blue")+'<div style="margin-top:9px">'+btn("game-sidequest",q.claimed?"Получено":q.complete?"Забрать награду":"Ещё не готово","mini primary",'data-id="'+q.id+'" '+(!q.complete||q.claimed?"disabled":""))+'</div></div>').join("")+'</div>')+
 '</div>';
}
function sideQuests(){
 return [
 {id:"social-first",title:"📡 Первая публикация",desc:"Опубликуй пост в социальной ленте.",reward:70,complete:db.social.posts.some(x=>x.author==="me"),claimed:game.awardBook.includes("social-first")},
 {id:"garage-ready",title:"🧰 Готовность бригады",desc:"Отметь RSS и подъёмник в гараже.",reward:90,complete:game.inventory.rss&&game.inventory.lift,claimed:game.awardBook.includes("garage-ready")},
 {id:"mission-first",title:"🏁 Первый контракт",desc:"Заверши любую миссию по фотоэтапам.",reward:150,complete:game.claims.length>0,claimed:game.awardBook.includes("mission-first")}
 ];
}
function finishMission(p){
 const step=compactProgress(p),checks=requirements(p);
 if(game.claims.includes(p.id))return notify("Награда за этот лот уже получена");
 if(!game.starts.includes(p.id))return notify("Сначала начни миссию");
 if(!checks.ok)return notify("Не соблюдены условия допуска: "+checks.reasons.join("; "));
 if(step.n!==step.total)return notify("Нужно закрыть все фотоэтапы: "+step.n+"/"+step.total);
 const merit=meritReward(p),xp=xpReward(p);
 db.merit+=merit;db.xp+=xp;
 person("me").xp=(person("me").xp||0)+xp;
 game.district[p.city]=(game.district[p.city]||0)+(isRaid(p)?90:35);
 game.claims.push(p.id);p.status="accepted";
 ledger("Награда за миссию • "+p.title,merit,p.id);
 game.activity.unshift({id:uid(),when:date(),text:"Миссия выполнена: "+p.title+" • +"+xp+" XP, +"+merit+" Merit"});
 db.social.posts.unshift({id:uid(),author:"me",tag:"Миссия завершена",text:"🏁 Закрыта миссия "+p.title+" в "+p.city+". Все этапы подтверждены в демонстрационном чек-листе.",likes:[],comments:[],when:date(),projectId:p.id,demo:true});
 socialNotify("Получена награда за миссию «"+p.title+"»");
 save();render();notify("MISSION COMPLETE • +"+xp+" XP • +"+merit+" Merit");
}
function garage(){
 const owned=id=>id==="tools"?db.crew.tools:id==="vehicle"?db.crew.vehicle:!!game.inventory[id];
 return '<div class="stack">'+card('<div class="between"><h2>Crew Garage · оснащение</h2>'+pill("READY CHECK","blue")+'</div><p class="small">Гараж показывает оборудование, заявленное бригадой. Нажми на карточку, чтобы отметить наличие на объекте. Это не приобретение реального оборудования и не подтверждение его исправности.</p><div class="grid cols3">'+gear.map(g=>'<div class="garage-card '+(owned(g.id)?"garage-owned":"")+'"><div class="garage-icon">'+g.icon+'</div><h3>'+g.name+'</h3><p class="small">'+g.subtitle+'</p><div class="small muted">'+g.required+'</div><div style="margin-top:10px">'+btn("game-gear",owned(g.id)?"✓ В наличии":"Отметить наличие","mini "+(owned(g.id)?"primary":""),'data-id="'+g.id+'"')+'</div></div>').join("")+'</div><div class="divider"></div><h3>Проверка готовности к рейдам</h3><div class="row">'+pill(db.crew.tools?"✓ Инструменты":"○ Инструменты",db.crew.tools?"ok":"warn")+pill(db.crew.vehicle?"✓ Бус":"○ Бус",db.crew.vehicle?"ok":"warn")+pill(game.inventory.rss?"✓ RSS":"○ RSS",game.inventory.rss?"ok":"warn")+pill(game.inventory.lift?"✓ Lift":"○ Lift",game.inventory.lift?"ok":"warn")+'</div>'+
 '<div class="divider"></div><h3>Тестовый AC-допуск</h3><p class="small">Этот переключатель нужен только для проверки игровых сценариев AC и Anmeldung. Он не удостоверяет квалификацию и не разрешает реальные подключения.</p>'+
 btn("demo-ac-toggle",game.demoAcReady?"✓ Игровой флаг включён":"Включить игровой AC-флаг","mini "+(game.demoAcReady?"primary":""))+'</div>')+'</div>';
}
function skills(){
 const n=level(),stats=person("me")?.stats||[80,70,70,70,70,70];
 return '<div class="stack">'+card('<div class="between"><h2>Skill Tree · развитие персонажа</h2>'+pill("LEVEL "+n,"blue")+'</div><p class="small">Навыки и уровни развиваются за XP. Дерево не заменяет реальное обучение или подтверждение квалификации по немецким нормам.</p><div class="grid cols2"><div><h3>'+missionRank(n)+'</h3><div class="metric">'+fmt(db.xp)+' XP</div><div class="statbar" style="margin:12px 0"><i style="width:'+Math.floor((Math.max(0,db.xp-24650)%1800)/1800*100)+'%"></i></div><span class="small muted">Следующий уровень через '+fmt(1800-((Math.max(0,db.xp-24650))%1800))+' XP</span></div><div class="persona-figure">N <span>CHARACTER DEVELOPMENT</span></div></div></div>')+
 '<div class="grid cols3">'+fskills.map(x=>'<div class="skill-card"><div class="skill-icon">'+x.icon+'</div><h3>'+x.title+'</h3><p class="small">'+x.about+'</p><div class="skill-rungs">'+x.levels.map((at,i)=>'<div class="skill-rung '+(n>=at?"unlocked":"")+'"><span>'+(n>=at?"✓":"🔒")+' TIER '+(i+1)+'</span><b>LVL '+at+'</b></div>').join("")+'</div>'+(x.id==="ac"?'<p class="tiny caveat">Допуск AC проверяется отдельно.</p>':"")+'</div>').join("")+'</div>'+
 card('<h2>Косметические стили персонажа</h2><p class="small">Косметика покупается за Merit, но не увеличивает техническую квалификацию.</p><div class="grid cols4">'+outfits.map(o=>'<div class="skin-card '+(game.outfit===o.id?"skin-active":"")+'"><div class="skin-preview '+o.id+'">N</div><h3>'+o.name+'</h3><p class="tiny">'+o.desc+'</p>'+btn("game-skin",game.outfit===o.id?"Надето":game.wardrobe.includes(o.id)?"Надеть":"Купить • "+o.price+" Merit","mini "+(game.outfit===o.id?"primary":""),'data-id="'+o.id+'" '+(game.outfit===o.id||!game.wardrobe.includes(o.id)&&db.merit<o.price?"disabled":""))+'</div>').join("")+'</div>')+
 '</div>';
}
function alliances(){
 const raids=db.projects.filter(isRaid);
 return '<div class="stack">'+card('<div class="between"><h2>Crews & Alliances</h2>'+pill("MULTI-CREW MODE","blue")+'</div><p class="small">Собери несколько бригад на большой объект и раздели работу: проектирование, DC, AC и Anmeldung. Пока это локальная симуляция, без приглашений на другие устройства.</p>'+
 '<div class="row">'+pill("Капитан "+ch(db.crew.name),"blue")+pill(db.crew.members.length+" участников")+'</div>'+
 '<label>Название альянса<input id="allianceName" value="'+enc(game.guildName||"")+'" placeholder="Например, Bodensee Alliance"></label><div style="margin-top:10px">'+btn("game-alliance","Создать / переименовать альянс","primary")+'</div></div>')+
 card('<h2>Mega Contracts • командные рейды</h2><div class="grid cols2">'+(raids.length?raids.map(p=>'<div class="step"><div class="between">'+pill(p.kind,"blue")+pill("LVL "+missionLevel(p))+'</div><h3>'+ch(p.title)+'</h3><p class="small">'+ch(p.city)+' • '+ch(p.client)+'</p><div class="small muted">Миссия высокого уровня: DC, AC, техника и отдельные сублоты</div><div class="row" style="margin-top:12px">'+btn("game-raid","План рейда","primary mini",'data-id="'+p.id+'"')+btn("game-open","Открыть проект","mini",'data-id="'+p.id+'"')+'</div></div>').join(""):empty("Крупных проектов ещё нет"))+'</div>')+
 card('<h2>Фракции и партнёрства</h2><div class="grid cols3">'+[["DC Unit","Монтаж конструкций и модулей"],["AC Division","Электротехника и измерения"],["Logistics","Склад, транспорт, подъёмники"]].map(([t,d])=>'<div class="step"><h3>'+t+'</h3><p class="small">'+d+'</p>'+pill("Демо-фракция")+'</div>').join("")+'</div>')+'</div>';
}
function wanted(){
 const projects=db.projects.filter(p=>p.status!=="accepted");
 const rows=projects.slice(0,10).map(p=>({p,role:p.kind==="AC"?"Elektrofachkraft":p.kind==="PLAN"?"Planer / Techniker":p.kind==="REG"?"Anmeldung / Netzbetreiber":"PV DC Installer",icon:styleIcon(p.kind)}));
 return '<div class="stack">'+card('<h2>Wanted Board · нужны специалисты</h2><p class="small">Потребность в специалистах рассчитывается по типу открытых лотов. Это демонстрация механики мэтчинга, не реальные вакансии компаний.</p>'+
 '<div class="stack">'+rows.map(r=>'<div class="wanted-list"><div class="wanted-icon">'+r.icon+'</div><div style="flex:1"><strong>'+r.role+'</strong><div class="small muted">'+ch(r.p.title)+' • '+ch(r.p.city)+'</div></div>'+btn("game-wanted",game.wantedReplies.includes(r.p.id)?"Интерес отправлен":"Откликнуться","mini "+(game.wantedReplies.includes(r.p.id)?"primary":""),'data-id="'+r.p.id+'" '+(game.wantedReplies.includes(r.p.id)?"disabled":""))+'</div>').join("")+'</div>'+
 '<div class="divider"></div><p class="footnote">В демо отклик сохраняется локально и не отправляется работодателю.</p>')+'</div>';
}
function seasons(){
 const userScore=game.claims.reduce((sum,id)=>sum+(isRaid(project(id)||{})?150:80),0)+Math.floor(Object.values(game.district).reduce((a,b)=>a+b,0)/2);
 const demo=[{name:"DachSolar Team [демо]",value:730},{name:"Elektro See [демо]",value:645},{name:"Solar Crew Süd [демо]",value:520},{name:db.crew.name+" (вы)",value:userScore,mine:true}].sort((a,b)=>b.value-a.value);
 return '<div class="stack">'+card('<div class="between"><h2>Season 01 · Silver Circuit</h2>'+pill("PRESEASON · DEMO","blue")+'</div><p class="small">Рейтинг рассчитывается из условных очков миссий и влияния региона. Другие команды здесь вымышленные, реальные статистики пользователей пока нет.</p>'+
 '<div class="podium-grid">'+demo.map((x,i)=>'<div class="leader-row '+(x.mine?"mine":"")+'"><span class="leader-rank">'+(i+1)+'</span><div style="flex:1"><b>'+ch(x.name)+'</b><div class="tiny muted">'+(x.mine?"Локальный игровой счёт":"Вымышленный соперник")+'</div></div><strong>'+fmt(x.value)+' SP</strong></div>').join("")+'</div>')+
 card('<h2>Сезонные награды</h2><div class="grid cols3">'+[["🏆 Quality Master","Качество фотоотчётов"],["🛡 Safety Crew","Безопасность на объектах"],["🌍 Regional Legend","Подтверждённая репутация региона"]].map(x=>'<div class="step"><h3>'+x[0]+'</h3><p class="small">'+x[1]+'</p>'+pill("Скоро")+'</div>').join("")+'</div>')+'</div>';
}
function world(){
 const tabs=[["garage","Гараж"],["skills","Skill Tree"],["alliances","Альянсы"],["wanted","Wanted Board"],["seasons","Сезоны"]];
 const content={garage,skills,alliances,wanted,seasons};
 return '<div class="stack"><div class="card world-header"><div class="eyebrow">NVTSK UNIVERSE • GAME SYSTEMS</div><h2>Собери свою команду мечты</h2><p>Всё, что улучшает работу на реальных объектах, становится частью твоего игрового мира.</p></div>'+
 '<div class="segment game-tabs">'+tabs.map(([key,name])=>'<button data-game="world-tab" data-id="'+key+'" class="'+(game.worldTab===key?"active":"")+'">'+name+'</button>').join("")+'</div>'+
 content[game.worldTab]()+'</div>';
}

function dashboard(){
 const active=db.projects.filter(p=>game.starts.includes(p.id)&&!game.claims.includes(p.id)).slice(0,3);
 const nearby=db.projects.filter(p=>p.status==="published"||p.status==="progress").slice(0,3);
 const score=Object.values(game.district).reduce((a,b)=>a+Number(b||0),0);
 const missionRows=active.length?active.map(p=>'<div class="listrow"><div><b>'+ch(p.title)+'</b><div class="small muted">'+ch(p.city)+' • '+compactProgress(p).percent+'% выполнено</div></div>'+btn("game-open","Продолжить ↗","mini",'data-id="'+p.id+'"')+'</div>').join(""):empty("Активных миссий пока нет");
 const cards=nearby.map(missionCard).join("");
 return '<div class="stack">'+topCard()+
 '<div class="grid cols4">'+stat("Уровень",level(),missionRank(level()))+stat("Merit",fmt(db.merit),"Игровой баланс")+stat("Crew",db.crew.members.length,"Моя бригада")+stat("Territory REP",fmt(score),"Региональное влияние")+'</div>'+
 card('<div class="between"><h2>Активные миссии</h2>'+btn("game-nav","Mission Board ↗","mini",'data-screen="missions"')+'</div>'+missionRows)+
 card('<div class="between"><h2>Контракты для тебя</h2>'+btn("game-nav","Все миссии ↗","mini",'data-screen="missions"')+'</div><div class="grid cols3">'+cards+'</div>')+
 card('<h2>Карьера персонажа</h2><p>Репутация растёт от подтверждённых задач, а Merit остаётся отдельным игровым балансом.</p>'+
 '<div class="career-road">'+["Rookie","Installer","Leader","Legend","Master"].map((name,i)=>'<div class="career-node '+(level()>=[12,13,15,17,20][i]?"done":"")+'"><div class="career-dot">'+(level()>=[12,13,15,17,20][i]?"✓":"◇")+'</div><strong>'+name+'</strong><span>LVL '+[12,13,15,17,20][i]+'</span></div>').join("")+'</div>')+
 '</div>';
}
function cabinet(){
 const p=person("me"),completed=db.projects.filter(x=>game.claims.includes(x.id));
 const badges=[["FIRST MISSION",game.claims.length>0],["CREW PLAYER",db.crew.members.length>=4],["SOCIAL SPARK",db.social.posts.some(x=>x.author==="me")],["REGIONAL",Object.values(game.district).some(n=>n>=140)]];
 const achievements=badges.map(([name,unlocked])=>'<div class="achievement '+(unlocked?"achieved":"")+'"><div class="achievement-icon">'+(unlocked?"★":"◇")+'</div><b>'+name+'</b><small>'+(!unlocked?"Заблокировано":"Получено")+'</small></div>').join("");
 const history=completed.length?completed.map(x=>'<div class="listrow"><button class="itemlink" data-act="open-project" data-id="'+x.id+'">'+ch(x.title)+'</button>'+pill("✓ Готово","ok")+'</div>').join(""):empty("Завершённых миссий пока нет");
 const activity=game.activity.length?game.activity.slice(0,8).map(x=>'<div class="listrow"><span>'+ch(x.text)+'</span><span class="tiny muted">'+ch(x.when)+'</span></div>').join(""):empty("Действий пока нет");
 return '<div class="stack">'+topCard()+
 card('<div class="between"><h2>Личный кабинет</h2>'+btn("edit-profile","✎ Изменить","mini")+'</div>'+
 '<div class="grid cols3">'+stat("XP",fmt(db.xp),"Прогресс")+stat("Legacy",fmt(totalLegacy(p)),"Репутация")+stat("Merit",fmt(db.merit),"Баланс")+'</div>'+
 '<div class="row" style="margin-top:15px">'+pill(game.registration.complete?"Демо-персонаж":"Гостевой режим",game.registration.complete?"ok":"warn")+pill(ch(p.city||"Регион не указан"))+'</div>'+
 '<div class="row" style="margin-top:12px">'+btn("game-nav","◈ Кошелёк","primary",'data-screen="wallet"')+btn("game-nav","✦ Миссии","",'data-screen="missions"')+btn("game-nav","♙ Бригада","",'data-screen="crew"')+
 (game.registration.complete?"":btn("game-register","Регистрация"))+'</div>'+
 '<p class="footnote">Это локальный кабинет без авторизации на сервере. Для работы на нескольких устройствах нужна общая база данных.</p>')+
 '<div class="grid cols2">'+card('<h2>Награды</h2><div class="grid cols2">'+achievements+'</div>')+card('<h2>Завершённые проекты</h2>'+history)+'</div>'+
 card('<h2>Последние действия</h2>'+activity)+
 '<div class="row">'+btn("game-export","Экспортировать JSON","mini")+btn("game-nav","Skill Tree ↗","mini",'data-screen="world" data-tab="skills"')+'</div></div>';
}
function wallet(){
 const active=db.merit||0,locked=db.frozen||0,all=[...(db.ledger||[])].slice().reverse();
 game.walletFilter||="all";
 const visible=all.filter(l=>game.walletFilter==="all"||(game.walletFilter==="income"&&l.delta>0)||(game.walletFilter==="expense"&&l.delta<0)||(game.walletFilter==="neutral"&&l.delta===0));
 const income=all.filter(l=>l.delta>0).reduce((sum,l)=>sum+l.delta,0);
 const expenses=-all.filter(l=>l.delta<0).reduce((sum,l)=>sum+l.delta,0);
 const rows=visible.length?visible.map(l=>'<div class="wallet-entry"><div class="wallet-icon '+(l.delta>0?"in":l.delta<0?"out":"neutral")+'">'+(l.delta>0?"↓":l.delta<0?"↑":"✓")+'</div><div class="wallet-description"><b>'+ch(l.label)+'</b><div class="tiny muted">'+ch(l.when)+(l.projectId?" • "+ch(project(l.projectId)?.title||"Проект"):"")+'</div></div><strong class="'+(l.delta>0?"wallet-in":l.delta<0?"wallet-out":"")+'">'+(l.delta>0?"+":"")+fmt(l.delta)+' M</strong></div>').join(""):empty("Операций в этой категории пока нет.");
 return '<div class="stack">'+
 '<div class="card wallet-hero"><div class="eyebrow">MERIT ACCOUNT • NVTSK SYSTEM</div><div class="between"><h2>Мой кошелёк</h2>'+pill("DEMO • LOCAL","warn")+'</div><div class="wallet-balance"><span class="small">Доступные Merit</span><div>'+fmt(active)+' <small>Ⓜ</small></div></div><div class="wallet-short"><span>Персонаж: '+ch(game.registration.handle||person("me")?.name||"Guest")+'</span><span>NVTSK-CREW-03</span></div></div>'+
 '<div class="grid cols3">'+stat("Заблокировано",fmt(locked)+" M","Резерв MentorGate")+stat("Всего начислено",fmt(income)+" M","Локальная история")+stat("Всего списано",fmt(expenses)+" M","Локальная история")+'</div>'+
 card('<div class="between"><h2>Операции кошелька</h2>'+btn("game-export","Экспорт JSON","mini")+'</div><div class="segment" style="margin:11px 0 13px">'+[["all","Все"],["income","Поступления"],["expense","Расходы"],["neutral","Действия"]].map(([id,label])=>'<button data-game="wallet-filter" data-id="'+id+'" class="'+(game.walletFilter===id?"active":"")+'">'+label+'</button>').join("")+'</div>'+
 '<div class="wallet-ledger">'+rows+'</div>')+
 card('<h2>Что можно делать с Merit</h2><div class="grid cols3">'+[
 ["◈","Косметика","Форма и оформление персонажа","world","skills"],
 ["♙","MentorGate","Резерв на обучение новичка","crew",""],
 ["✦","Миссии","Заработать новые очки за работу","missions",""]
 ].map(([icon,name,sub,screen,tab])=>'<div class="wallet-feature"><div class="wallet-feature-icon">'+icon+'</div><strong>'+name+'</strong><div class="small muted">'+sub+'</div>'+btn("game-nav","Открыть ↗","mini",'data-screen="'+screen+'" '+(tab?'data-tab="'+tab+'"':""))+'</div>').join("")+'</div>')+
 card('<h2>Важно о балансе</h2><p class="small">1 Merit = 0,01 € используется здесь только для демонстрации расчётов, а не как обещание обмена. Тестовые Merit не являются деньгами или платёжным счётом. Реальные выплаты и чаевые требуют правового и налогового анализа; Legacy нельзя купить.</p><div class="row">'+pill("Демо-эквивалент: "+fmt(active/100)+" €","warn")+pill("Вывод средств недоступен")+'</div>')+'</div>';
}
function social(){
 const posts=db.social.posts;
 return '<div class="stack">'+card('<div class="between"><h2>NVTSK Social · лента</h2>'+pill(posts.length+" публикаций","blue")+'</div><p class="small">Рабочая социальная сеть: новости объектов, фото, лайки, комментарии, репутация и новые контакты. Все действия пока видны только в этом браузере.</p>'+
 '<form id="gamePostForm"><label>Тема записи<select name="tag"><option>На объекте</option><option>Вопрос</option><option>Совет</option><option>Ищу бригаду</option><option>Миссия завершена</option></select></label><textarea name="text" placeholder="Что нового на стройке?" required maxlength="1800"></textarea><div class="row"><label class="btn mini" style="cursor:pointer;margin:0">📷 Фото / видео<input id="gameSocialMedia" type="file" accept="image/*,video/*" style="display:none"></label><span id="gameMediaLabel" class="tiny muted"></span></div><button class="btn primary" style="margin-top:9px" type="submit">Опубликовать</button></form></div>')+
 '<div class="grid colsMain"><div class="stack">'+posts.map(post=>{
 const p=person(post.author),liked=(post.likes||[]).includes("me");
 return '<article class="social-post"><div class="between"><div class="person">'+avatar(post.author)+'<div><b>'+ch(p?.name||"Пользователь")+'</b><div class="tiny muted">'+ch(post.when)+' · '+ch(post.tag)+(post.demo?" · DEMO":"")+'</div></div></div>'+pill(ch(post.tag),"blue")+'</div><p class="post-text">'+ch(post.text)+'</p>'+(post.mediaId?'<div class="social-media"><img data-media="'+enc(post.mediaId)+'" alt="Изображение публикации"></div>':"")+
 '<div class="row"><button class="btn mini '+(liked?"primary":"")+'" data-game="like" data-id="'+post.id+'">♥ '+(post.likes||[]).length+'</button>'+pill("☏ "+(post.comments||[]).length+" комментариев")+ (post.projectId?btn("game-open","Открыть миссию","mini",'data-id="'+post.projectId+'"'):"")+'</div>'+
 '<div class="social-comments">'+(post.comments||[]).map(c=>'<div class="comment"><b>'+userName(c.by)+':</b> '+ch(c.text)+'</div>').join("")+'</div><form data-gameform="social-comment" data-post="'+post.id+'" class="row"><input name="text" maxlength="320" required placeholder="Написать комментарий…" style="flex:1;min-width:125px"><button type="submit" class="btn mini">Отправить</button></form></article>';
 }).join("")+'</div>'+
 '<div class="stack">'+card('<h2>Подписки и связи</h2>'+db.users.filter(p=>p.id!=="me").map(p=>'<div class="listrow"><div class="person">'+avatar(p.id)+'<div><b>'+ch(p.name)+'</b><div class="tiny muted">'+ch(api.skillText(p))+'</div></div></div>'+btn("follow",game.following.includes(p.id)?"✓ Вы подписаны":"＋ Следить","mini",'data-id="'+p.id+'"')+'</div>').join(""))+
 card('<h2>Уведомления</h2>'+(db.social.notifications.length?db.social.notifications.slice(0,8).map(n=>'<div class="listrow small">'+ch(n.text)+'<span class="tiny muted">'+ch(n.when)+'</span></div>').join(""):empty("Новых уведомлений нет")))+'</div></div></div>';
}
function registrationModal(){
 if(game.registration.complete||game.registration.guest)return;
 openModal('<div class="eyebrow">NVTSK SYSTEM • REGISTRATION</div><h2 style="font-size:27px;margin:8px 0">Создай своего персонажа</h2><p>Укажи имя персонажа. Роль определяется действием в каждом лоте: создатель становится заказчиком, приглашённый участник исполнителем. Настоящая регистрация и вход с другого телефона появятся после подключения сервера.</p>'+
 '<form id="gameRegisterForm"><label>Имя персонажа<input name="handle" minlength="2" maxlength="45" placeholder="Например, Serhii PV" required></label><label>Город / регион<input name="city" placeholder="Например, Stockach"></label><button type="submit" class="btn primary full" style="margin-top:12px">Начать карьеру →</button></form><div class="divider"></div>'+btn("game-guest","Продолжить без регистрации","mini ghost full")+
 '<p class="footnote">Не вводи пароли. Данные сохраняются только на этом устройстве. Это не система аутентификации.</p>');
}
function raidModal(p){
 const steps=[
 ["PLAN","Projektierung","План и расчёт конструкции"],
 ["DC","DC Montage","Монтаж, модули, DC-кабели"],
 ["AC","AC-Anschluss","Только квалифицированный Elektrofachbetrieb"],
 ["REG","Anmeldung","Netzbetreiber, MaStR и акты"]
 ];
 const info=game.raids[p.id]||{};
 openModal('<div class="eyebrow">CO-OP MEGA MISSION</div><h2>Рейд • '+ch(p.title)+'</h2><p>Раздели большой объект на четыре независимых сублота и назначь исполнителей. Это планирование, не реальные приглашения внешних бригад.</p>'+
 '<div class="grid cols2">'+stat("Участники",db.crew.members.length,"В локальном отряде")+stat("Уровень",level(),"Требуется "+missionLevel(p))+'</div>'+
 '<form id="gameRaidForm" data-id="'+p.id+'"><div class="grid cols2">'+steps.map(([code,name,desc])=>'<div class="step"><h3>'+name+'</h3><p class="small">'+desc+'</p><label>Ответственный<select name="'+code+'"><option value="">Не назначено</option>'+db.crew.members.map(id=>'<option value="'+id+'" '+(info[code]===id?"selected":"")+'>'+userName(id)+'</option>').join("")+'</select></label></div>').join("")+'</div><button class="btn primary" type="submit" style="margin-top:12px">Сохранить план и 4 сублота</button></form>'+
 '<p class="footnote">Назначение AC здесь не подтверждает допуск. Для Германии необходимы полномочия и проверка квалификации.</p>');
}
function onboardingAvatar(){
 // The existing profile avatar upload works on the cabinet page; no unverified identity claims.
}
const screens={dashboard,missions,world,social,wallet,profile:cabinet};
window.NVTSK_EXT={screens};
const gameActions={
 "game-nav":b=>{if(b.dataset.tab)game.worldTab=b.dataset.tab;go(b.dataset.screen)},
 "game-open":b=>detail(b.dataset.id),
 "mission-filter":b=>{game.missionView=b.dataset.id;render()},
 "game-start":b=>{
  const p=project(b.dataset.id);if(!p)return;
  const r=requirements(p);if(!r.ok)return notify("Доступ закрыт: "+r.reasons.join("; "));
  if(p.createdBy==="me")return notify("Это твой лот: ты здесь заказчик, а не исполнитель");
  if(!game.starts.includes(p.id))game.starts.push(p.id);
  p.members||=[];if(!p.members.includes("me"))p.members.push("me");
  if(!p.assignee)p.assignee="me";
  p.status="progress";activity("Взята миссия как исполнитель: "+p.title);save();render();notify("MISSION STARTED • "+p.title);
 },
 "game-claim":b=>{const p=project(b.dataset.id);if(p)finishMission(p)},
 "demo-ac-toggle":()=>{game.demoAcReady=!game.demoAcReady;save();render();notify(game.demoAcReady?"Тестовый игровой флаг AC включён":"Тестовый игровой флаг AC выключен")},
 "game-gear":b=>{
  const id=b.dataset.id;const existing=id==="tools"?db.crew.tools:id==="vehicle"?db.crew.vehicle:!!game.inventory[id];
  if(id==="tools")db.crew.tools=!existing;else if(id==="vehicle")db.crew.vehicle=!existing;else game.inventory[id]=!existing;
  activity("Оснащение: "+id+" "+(!existing?"готово":"не отмечено"));save();render();
 },
 "world-tab":b=>{game.worldTab=b.dataset.id;save();render()},
 "wallet-filter":b=>{game.walletFilter=b.dataset.id;save();render()},
 "game-skin":b=>{
  const o=outfits.find(o=>o.id===b.dataset.id);if(!o)return;
  if(game.wardrobe.includes(o.id)){game.outfit=o.id;save();render();return}
  if(db.merit<o.price)return notify("Недостаточно Merit");
  db.merit-=o.price;game.wardrobe.push(o.id);game.outfit=o.id;
  ledger("Косметика: "+o.name,-o.price);activity("Куплен стиль: "+o.name);save();render();notify("Стиль получен • "+o.name);
 },
 "game-raid":b=>{const p=project(b.dataset.id);if(p)raidModal(p)},
 "game-wanted":b=>{
  const p=project(b.dataset.id);if(!p||game.wantedReplies.includes(p.id))return;
  game.wantedReplies.push(p.id);activity("Отклик на Wanted Board: "+p.title);save();render();notify("Интерес отмечен локально, работодателю не отправлен");
 },
 "game-sidequest":b=>{
  const q=sideQuests().find(q=>q.id===b.dataset.id);if(!q||!q.complete||q.claimed)return;
  game.awardBook.push(q.id);db.merit+=q.reward;ledger("Side quest • "+q.title,q.reward);save();render();notify("SIDE QUEST COMPLETE • +"+q.reward+" Merit");
 },
 "like":b=>{
  const p=db.social.posts.find(p=>p.id===b.dataset.id);if(!p)return;
  p.likes||=[];const i=p.likes.indexOf("me");if(i>=0)p.likes.splice(i,1);else p.likes.push("me");
  save();render();
 },
 "follow":b=>{
  const id=b.dataset.id;const i=game.following.indexOf(id);
  if(i>=0)game.following.splice(i,1);else {game.following.push(id);socialNotify("Вы подписались на "+(person(id)?.name||"участника"))}
  save();render();
 },
 "game-alliance":()=>{
  const name=Q("#allianceName")?.value.trim();if(!name)return notify("Введи название альянса");
  game.guildName=name.slice(0,70);activity("Создан альянс: "+game.guildName);save();render();notify("Альянс сохранён локально");
 },
 "game-guest":()=>{game.registration.guest=true;save();closeModal();notify("Гостевой режим. Можно зарегистрировать персонажа позже в кабинете.")},
 "game-register":()=>registrationModal(),
 "game-export":()=>{const a=Q('[data-act="export"]');if(a)a.click();else{const b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const link=document.createElement("a");link.href=u;link.download="nvtsk-save.json";link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);notify("Экспорт JSON (без медиафайлов)")}}
};
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-game]");if(!b)return;
 const fn=gameActions[b.dataset.game];if(fn){e.preventDefault();fn(b)}
});
document.addEventListener("submit",e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement))return;
 if(!["gamePostForm","gameRegisterForm","gameRaidForm"].includes(f.id)&&f.dataset.gameform!=="social-comment")return;
 e.preventDefault();const d=Object.fromEntries(new FormData(f));
 if(f.id==="gamePostForm"){
  const text=String(d.text||"").trim();if(!text)return;
  db.social.posts.unshift({id:uid(),author:"me",text:text.slice(0,1800),tag:d.tag,likes:[],comments:[],when:date(),mediaId:game.socialMedia||""});game.socialMedia="";
  activity("Опубликован пост");save();render();notify("Пост опубликован в локальной ленте");
 }else if(f.dataset.gameform==="social-comment"){
  const p=db.social.posts.find(p=>p.id===f.dataset.post),text=String(d.text||"").trim();if(!p||!text)return;
  p.comments||=[];p.comments.push({by:"me",text:text.slice(0,320),when:date()});save();render();notify("Комментарий добавлен");
 }else if(f.id==="gameRegisterForm"){
  const handle=String(d.handle||"").trim().slice(0,45);
  if(handle.length<2)return notify("Имя должно содержать минимум 2 символа");
  game.registration={complete:true,guest:false,handle,city:String(d.city||"").trim().slice(0,80)};
  const me=person("me");me.name=handle;if(d.city)me.city=game.registration.city;
  // The system never assigns a platform-wide role at registration.
  activity("Создан персонаж: "+handle);save();closeModal();render();notify("Добро пожаловать, "+handle+"!");
 }else if(f.id==="gameRaidForm"){
  const p=project(f.dataset.id);if(!p)return;
  const info=Object.fromEntries(["PLAN","DC","AC","REG"].map(k=>[k,d[k]||""]));
  game.raids[p.id]=info;
  api.splitProject(p.id);
  for(const [kind,id] of Object.entries(info)){const sub=children(p.id).find(s=>s.kind===kind);if(sub&&id)sub.assignee=id;}
  activity("Спланирован рейд: "+p.title);save();closeModal();render();notify("План рейда и четыре связанных сублота сохранены");
 }
});
document.addEventListener("change",async e=>{
 const el=e.target;if(el.id!=="gameSocialMedia")return;
 const f=el.files?.[0];if(!f)return;
 if(f.size>40*1024*1024)return notify("Размер медиафайла больше 40 МБ");
 if(!f.type.startsWith("image/")&&!f.type.startsWith("video/"))return notify("Нужно фото или видео");
 try{const id=await saveMedia(f);game.socialMedia=id;const label=Q("#gameMediaLabel");if(label)label.textContent=f.name;notify("Медиа прикреплено")}catch(err){console.warn(err);notify("Не удалось прикрепить медиа")}
});
render();
if(!game.registration.complete&&!game.registration.guest)registrationModal();
})();
