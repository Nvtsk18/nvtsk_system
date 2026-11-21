/* NVTSK Garage local-only demo. No authenticated multi-user custody or financial posting. */
(function(){
"use strict";
const KEY="nvtsk_garage_04_demo";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const locations=[{id:"depot",name:"Гараж · полки",external:false},{id:"van1",name:"Sprinter · бус 1",external:false},{id:"van2",name:"Бус 2",external:false},{id:"van3",name:"Бус 3",external:false},{id:"ext",name:"Fremdlager · подрядчик",external:true}];
const sample=()=>({version:1,items:[{id:"hooks",name:"Dachhaken",unit:"шт.",unitCost:3.5},{id:"rail",name:"Einlegeschiene",unit:"шт.",unitCost:32},{id:"cable",name:"DC-Kabel",unit:"м",unitCost:1.2}],balances:{"hooks@depot":40,"rail@depot":12,"cable@van1":200},movements:[],usage:[]});
const key=(item,loc)=>item+"@"+loc;
const positive=n=>typeof n==="number"&&Number.isSafeInteger(n)&&n>=0&&n<=1000000;
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.items)||!Array.isArray(s.movements)||!Array.isArray(s.usage)||!s.balances||typeof s.balances!=="object"||Array.isArray(s.balances))throw Error("invalid garage record");
 if(s.items.length>100||s.movements.length>2000||s.usage.length>2000||new Set(s.items.map(x=>x.id)).size!==s.items.length)throw Error("invalid garage limits");
 for(const i of s.items)if(!i||typeof i.id!=="string"||!i.id.trim()||i.id.length>60||typeof i.name!=="string"||!i.name.trim()||i.name.length>120||typeof i.unit!=="string"||!i.unit.trim()||!Number.isFinite(i.unitCost)||i.unitCost<0)throw Error("invalid item");
 for(const [k,n] of Object.entries(s.balances)){const [item,loc,...extra]=k.split("@");if(extra.length||!s.items.some(i=>i.id===item)||!locations.some(l=>l.id===loc)||!positive(n))throw Error("invalid balance");}
 const ids=new Set();
 for(const m of s.movements){if(!m||typeof m.id!=="string"||ids.has(m.id)||!["receive","transfer","consume"].includes(m.type)||!s.items.some(i=>i.id===m.item)||!positive(m.qty)||m.qty===0||typeof m.time!=="string"||!Number.isFinite(Date.parse(m.time)))throw Error("invalid movement");ids.add(m.id);}
 for(const u of s.usage)if(!u||!ids.has(u.movementId)||typeof u.project!=="string"||!u.project.trim()||!positive(u.qty)||!Number.isFinite(u.cost)||u.cost<0)throw Error("invalid usage");
 return s;
}
let data,locked=false;
try{const raw=localStorage.getItem(KEY);data=raw?validate(JSON.parse(raw)):sample();}catch(e){data=sample();locked=true;}
function transact(type,item,from,to,qty,project){
 if(locked)throw Error("Склад заблокирован: повреждённые данные. Нельзя перезаписывать исходную запись.");
 if(!data.items.some(i=>i.id===item)||!positive(qty)||qty===0||!locations.some(l=>l.id===to)||!["receive","transfer","consume"].includes(type))throw Error("Неверная операция");
 if(type!=="receive"&&!locations.some(l=>l.id===from))throw Error("Неизвестное место выдачи");
 if(type==="transfer"&&from===to)throw Error("Места совпадают");
 if(type==="consume"&&(!project||!project.trim()))throw Error("Укажи объект");
 if(type==="consume"&&to!=="depot")throw Error("Неверное направление");
 const next=JSON.parse(JSON.stringify(data)),source=key(item,from),dest=key(item,to);
 if(type!=="receive"&&(next.balances[source]||0)<qty)throw Error("Недостаточно материала");
 if(type!=="receive")next.balances[source]-=qty;
 if(type!=="consume")next.balances[dest]=(next.balances[dest]||0)+qty;
 const id="mv-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);
 next.movements.push({id,type,item,from:type==="receive"?null:from,to:type==="consume"?null:to,qty,time:new Date().toISOString(),owner:"NVTSK demo",actor:"Локальный оператор (демо)"});
 if(type==="consume"){const unitCost=next.items.find(i=>i.id===item).unitCost;next.usage.push({movementId:id,project:project.trim().slice(0,120),qty,cost:Math.round(qty*unitCost*100)/100});}
 validate(next);
 localStorage.setItem(KEY,JSON.stringify(next));
 data=next;
}
function exportBackup(){
 const payload=JSON.stringify({kind:"nvtsk-garage-backup",exportedAt:new Date().toISOString(),data:validate(data)},null,2);
 const blob=new Blob([payload],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="nvtsk-garage-backup.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importBackup(raw,confirmed){
 if(typeof raw!=="string"||raw.length>1500000)throw Error("Файл слишком большой");
 const wrapper=JSON.parse(raw);
 if(!wrapper||wrapper.kind!=="nvtsk-garage-backup")throw Error("Это не резервная копия Garage");
 const next=validate(wrapper.data);
 if(!confirmed)return {items:next.items.length,movements:next.movements.length,usage:next.usage.length};
 if(locked)throw Error("Повреждённое исходное хранилище: автоматическое восстановление заблокировано");
 localStorage.setItem(KEY,JSON.stringify(next));
 data=next;
 return true;
}
function render(){
 const total=id=>locations.filter(l=>!l.external).reduce((a,l)=>a+(data.balances[key(id,l.id)]||0),0);
 const external=id=>data.balances[key(id,"ext")]||0;
 const options=locations.map(l=>'<option value="'+l.id+'">'+esc(l.name)+'</option>').join("");
 const itemOptions=data.items.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+' ('+esc(i.unit)+')</option>').join("");
 return '<div class="stack"><div class="glass hero"><div class="overline">LOCAL FIRST / GARAGE</div><h2>NVTSK Garage · единый склад команды</h2><p>Полки и три буса образуют один склад. Fremdlager показывает материалы у внешнего подрядчика. Все цифры демонстрационные, данные хранятся только в этом браузере.</p></div>'+
 (locked?'<div class="glass work"><h3>⚠️ Хранилище повреждено или недоступно</h3><p>Операции заблокированы, чтобы не перезаписать исходные данные. Обратитесь к разработчику для восстановления.</p></div>':'')+
 '<div class="glass work"><h2>Общий остаток и внешнее хранение</h2><div class="garage-scroll"><table class="garage-table"><thead><tr><th>Материал</th><th>Гараж + бусы</th><th>Fremdlager</th><th>Всего нашего</th></tr></thead><tbody>'+data.items.map(i=>'<tr><td>'+esc(i.name)+'</td><td>'+total(i.id)+' '+esc(i.unit)+'</td><td>'+external(i.id)+' '+esc(i.unit)+'</td><td>'+(total(i.id)+external(i.id))+' '+esc(i.unit)+'</td></tr>').join("")+'</tbody></table></div></div>'+
 '<div class="glass work"><h2>Расположение по бусам</h2><div class="garage-scroll"><table class="garage-table"><thead><tr><th>Место</th>'+data.items.map(i=>'<th>'+esc(i.name)+'</th>').join("")+'</tr></thead><tbody>'+locations.map(l=>'<tr><td>'+esc(l.name)+'</td>'+data.items.map(i=>'<td>'+(data.balances[key(i.id,l.id)]||0)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></div>'+
 '<div class="glass work"><h2>Операция с материалами</h2><form id="garageForm" class="formstack"><label>Действие<select name="type"><option value="transfer">Перемещение / передача</option><option value="consume">Фактически установлено на объекте</option><option value="receive">Поступление на склад</option></select></label><label>Материал<select name="item">'+itemOptions+'</select></label><label>Откуда<select name="from">'+options+'</select></label><label>Куда (для перемещения/поступления)<select name="to">'+options+'</select></label><label>Количество (целые единицы)<input name="qty" type="number" min="1" max="1000000" step="1" required></label><label>Объект (обязательно для расхода)<input name="project" maxlength="120" placeholder="Название демо-объекта"></label><button class="btn primary" type="submit" '+(locked?"disabled":"")+'>Подтвердить операцию</button></form><p class="small">Выдача в бус или подрядчику не считается расходом. Расход фиксируется отдельно по фактической установке.</p></div>'+
 '<div class="glass work"><h2>Резервная копия Garage</h2><p class="small">Склад хранится отдельно от проектов и НЕ включён в их экспорт. Сохраните оба файла. Импорт полностью заменяет складские демоданные.</p><button class="btn" type="button" id="garageExport">↓ Экспорт склада</button><form id="garageImport" class="formstack"><label>Вставьте JSON резервной копии Garage<textarea name="backup" maxlength="1500000" rows="4" required></textarea></label><button class="btn" type="submit">Проверить и восстановить</button></form></div>'+
 '<div class="glass work"><h2>Журнал операций</h2>'+(!data.movements.length?'<p>Пока нет операций.</p>':data.movements.slice(-15).reverse().map(m=>'<div class="garage-entry"><b>'+esc(m.type==="transfer"?"Перемещение":m.type==="receive"?"Поступление":"Монтаж")+'</b> · '+esc(data.items.find(i=>i.id===m.item)?.name||m.item)+' · '+m.qty+' · '+esc(m.from||"поставка")+' → '+esc(m.to||"объект")+'<div class="small muted">'+esc(m.time.slice(0,16).replace("T"," "))+(data.usage.find(u=>u.movementId===m.id)?' · '+esc(data.usage.find(u=>u.movementId===m.id).project):'')+'</div></div>').join(""))+'</div></div>';
}
document.addEventListener("click",e=>{if(e.target.closest("#garageExport")){try{exportBackup();}catch(err){alert("Garage: "+err.message);}}});
document.addEventListener("submit",e=>{
 if(e.target.id==="garageImport"){
  e.preventDefault();
  try{
   const raw=String(new FormData(e.target).get("backup")||"");
   const info=importBackup(raw,false);
   if(window.confirm("Заменить все данные склада? Позиций: "+info.items+", операций: "+info.movements+". Сначала сохраните текущую копию склада.")){importBackup(raw,true);window.NVTSK_GARAGE_REFRESH?.();}
  }catch(err){alert("Garage: "+err.message);}
  return;
 }

 if(e.target.id!=="garageForm")return;
 e.preventDefault();
 const f=new FormData(e.target);
 try{transact(String(f.get("type")),String(f.get("item")),String(f.get("from")),String(f.get("to")),Number(f.get("qty")),String(f.get("project")||""));window.NVTSK_GARAGE_REFRESH?.();}
 catch(err){alert("Garage: "+err.message);}
});
window.NVTSK_GARAGE={render,validate,transact,importBackup,exportBackup};
})();
