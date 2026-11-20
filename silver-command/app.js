(() => {
"use strict";
const KEY = "nvtsk_silver_04_demo";
const $ = s => document.querySelector(s);
const encode = v => String(v ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const money = n => Number(n || 0).toLocaleString("ru-RU");
const uuid = () => "lot-" + Math.random().toString(36).slice(2,10);
const tabs = [["dashboard","⌂","Главная"],["map","⌾","Карта"],["projects","▤","Проекты"],["chats","☷","Чаты"],["profile","◉","Профиль"]];
const initial = [
  {id:"stock",title:"20 кВт DC • Stockach",city:"Stockach",client:"Демо Solarbau Süd",price:2000,kind:"DC",creator:"demo-client",parent:null,bids:[]},
  {id:"singen",title:"14,8 кВт DC • Singen",city:"Singen",client:"Демо Hegau Energie",price:1480,kind:"DC",creator:"demo-client",parent:null,bids:[{amount:1380,team:"SüdMontage (демо)"}]},
  {id:"uber",title:"12 кВт AC • Überlingen",city:"Überlingen",client:"Демо Bodensee PV",price:1200,kind:"AC",creator:"demo-client",parent:null,bids:[]}
];
let state;
try { state = JSON.parse(localStorage.getItem(KEY) || "null"); if (!state || !Array.isArray(state.lots)) throw Error("Empty"); }
catch (_) { state = {lots:initial, name:"Серёжа", merit:3000, crew:["Серёжа","Роман","Денис","Олена"]}; }
let screen = "dashboard";
let selected = "singen";
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const find = id => state.lots.find(l => l.id === id);
const role = l => l.creator === "me" ? "Заказчик" : (l.bids || []).some(b => b.mine) ? "Кандидат" : "Наблюдатель";
const button = (act, label, id) => '<button class="btn sm" data-act="' + act + '" data-id="' + (id || "") + '">' + label + '</button>';
const panel = content => '<section class="glass work">' + content + '</section>';
const badge = text => '<span class="pill blue">' + encode(text) + '</span>';
function item(l) {
  return panel(badge(l.kind) + '<h3 style="font-size:19px;margin-top:12px">' + encode(l.title) + '</h3><p>' + encode(l.client) + '</p><div class="stat" style="margin:10px 0">' + money(l.price) + ' €</div><div class="small muted">' + role(l) + '</div><div style="margin-top:12px">' + button("lot","Открыть лот",l.id) + '</div>');
}
function overview() {
  return '<div class="stack"><section class="glass hero"><div class="overline">NVTSK SILVER COMMAND / 0.4</div><h2 style="font-size:30px;margin:12px 0">Управление PV-проектами</h2><p>Единая система для заказчиков, монтажных бригад, документов, общения и профессионального развития.</p><div style="margin-top:17px">' + button("new","＋ Создать лот") + '</div></section><div class="grid g3">' +
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
function lotScreen() {
 const l = find(selected); if (!l) return projects();
 const subs = state.lots.filter(x=>x.parent===l.id);
 let sublist = subs.length ? subs.map(x=>'<div class="listrow"><span>'+encode(x.title)+'</span>'+button("lot","Открыть",x.id)+'</div>').join("") : '<p>Сублотов пока нет.</p>';
 let bidlist = (l.bids||[]).map(b=>'<div class="listrow"><span>'+encode(b.team)+'</span><b>'+money(b.amount)+' €</b></div>').join("");
 return '<div class="stack">'+panel('<div class="overline">LOT '+encode(l.id)+'</div><h2 style="font-size:26px;margin:9px 0">'+encode(l.title)+'</h2><p>'+encode(l.city)+' • '+encode(l.client)+'</p><div class="stat">'+money(l.price)+' €</div><div class="row" style="margin-top:14px">'+badge(role(l))+button("split","Разбить на 4",l.id)+button("projects","← Проекты")+'</div>') +
 '<div class="grid maincols">'+panel('<h2>Сублоты</h2>'+sublist+'<div class="line"></div><h2>Монтажный чек-лист</h2><p>Фото до/после, PDF, Stringplan, Erdung и подтверждение заказчиком станут следующими подключаемыми модулями. Фото само по себе не означает принятия работ.</p>') +
 panel('<h2>Аукцион</h2>'+bidlist+'<label>Моя ставка, €<input id="bid" type="number" min="1"></label><div style="margin-top:10px">'+button("bid","Подать ставку")+'</div><p class="small" style="margin-top:10px">Демонстрационные данные остаются в браузере. На собственный лот подавать ставку нельзя.</p>')+'</div></div>';
}
function chat() {
 return panel('<h2>Коммуникация</h2><p>Ленты объектов, сообщения и комментарии входят в архитектуру. Для настоящего межпользовательского чата нужны авторизация и сервер, поэтому здесь пока только концептуальный экран.</p><div class="tile">Личные сообщения • Чаты объектов • Социальная лента • Уведомления</div>');
}
function profile() {
 return '<div class="stack">'+panel('<div class="row"><div class="avatar big">'+encode(state.name[0])+'</div><div><h2>'+encode(state.name)+'</h2><p>Ваше имя, без выбора роли при регистрации</p></div></div><div style="margin-top:14px">'+button("edit-name","✎ Изменить имя")+'</div>')+
 '<div class="grid g3">'+panel('<div class="statlabel">Legacy</div><div class="stat">8500</div>')+panel('<div class="statlabel">Merit</div><div class="stat">'+money(state.merit)+'</div>')+panel('<div class="statlabel">Бригада</div><div class="stat">'+state.crew.length+'</div>')+'</div>'+
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
 if (!l) return;
 for(const [kind,title] of kinds) {
  if (state.lots.some(x=>x.parent===l.id&&x.kind===kind)) continue;
  state.lots.push({id:uuid(),title,city:l.city,client:l.client,price:0,kind,creator:"me",parent:l.id,assignee:null,bids:[]});
 }
 save();selected=l.id;go("lot");
}
document.addEventListener("click",e=>{
 const n=e.target.closest("[data-screen]"); if(n){e.preventDefault();go(n.dataset.screen);return;}
 const b=e.target.closest("[data-act]");if(!b)return;e.preventDefault();
 if(b.dataset.act==="lot"){selected=b.dataset.id;go("lot");}
 if(b.dataset.act==="projects")go("projects");
 if(b.dataset.act==="new")create();
 if(b.dataset.act==="split")split(find(b.dataset.id));
 if(b.dataset.act==="edit-name")modal('<h2>Ваше имя</h2><form id="nameForm"><label>Ваше имя<input name="name" value="'+encode(state.name)+'" required></label><button class="btn primary" type="submit">Сохранить</button></form>');
 if(b.dataset.act==="bid"){
  const l=find(selected),amount=Number($("#bid").value);
  if(role(l)==="Заказчик"){alert("Нельзя подавать ставку на свой лот");return;}
  if(!(amount>0)){alert("Введите корректную сумму");return;}
  l.bids=l.bids.filter(x=>!x.mine);l.bids.push({team:"Моя бригада",amount,mine:true});save();render();
 }
});
document.addEventListener("submit",e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement))return;e.preventDefault();
 const data=Object.fromEntries(new FormData(f));
 if(f.id==="newForm"){
 state.lots.push({id:uuid(),title:data.title,city:data.city,client:"Создано пользователем",price:Number(data.price)||0,kind:data.kind,creator:"me",parent:null,assignee:null,bids:[]});
 save();close();go("projects");
 }
 if(f.id==="nameForm"){state.name=data.name;save();close();go("profile");}
});
$("#newLot").onclick=create;
$("#dialogBackdrop").onclick=e=>{if(e.target.id==="dialogBackdrop")close()};
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(tabs.some(t=>t[0]===h))go(h)});
render();
})();