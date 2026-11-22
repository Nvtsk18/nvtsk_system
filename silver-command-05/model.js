"use strict";
globalThis.NVModel = (() => {
  const roles = ["Руководитель", "Монтажник", "Кладовщик"];
  const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
  const label = value => typeof value === "string" && value.trim().length > 0 && value.length <= 240;
  const amount = value => Number.isFinite(value) && value >= 0 && value <= 1e12;
  const optional = (value, max=2000) => value===undefined || (typeof value==="string" && value.length<=max);
  const attachments = list => list===undefined || (Array.isArray(list)&&list.length<=8&&list.every(a=>a&&ident(a.id)&&optional(a.name,180)&&a.name&&typeof a.data==="string"&&/^data:(image\/(png|jpeg|webp|gif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(a.data)&&a.data.length<=900000));
  const ident = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  function migrate(old) {
    if (old.version !== 1) return old;
    const data = JSON.parse(JSON.stringify(old));
    requireValue(["cases","garage","tasks","crew","shards"].every(k => Array.isArray(data[k])), "Неверная схема v1");
    data.crew = [{id:"lead",name:"Координатор",role:roles[0]}, ...data.crew.map((c,i) => ({id:"member-"+i,name:c.name,role:roles[1]}))];
    data.actor = "lead";
    data.moves = [];
    data.version = 2;
    return data;
  }
  function validate(d) {
    requireValue(d && d.version === 2 && ["cases","shards","crew","garage","moves","tasks"].every(k => Array.isArray(d[k])), "Неверная версия или структура");
    for (const list of [d.cases,d.shards,d.tasks,d.crew,d.garage,d.moves]) {
      requireValue(list.every(x => x && ident(x.id)) && new Set(list.map(x=>x.id)).size === list.length,"Ошибка идентификаторов");
    }
    const has = (list,id) => list.some(x=>x.id===id);
    requireValue(d.crew.every(c=>label(c.name)&&roles.includes(c.role)) && has(d.crew,d.actor) && d.crew.some(c=>c.role===roles[0]),"Ошибка участников");
    requireValue(d.cases.every(c=>label(c.title)&&label(c.city)&&amount(c.price)&&optional(c.address,300)&&optional(c.notes,4000)&&attachments(c.files)),"Ошибка Project");
    requireValue(d.shards.every(s=>label(s.title)&&label(s.kind)&&amount(s.price)&&has(d.cases,s.caseId)&&optional(s.notes,4000)&&attachments(s.files)&&["draft","submitted","accepted"].includes(s.status)&&(s.assignee===null||has(d.crew,s.assignee))),"Ошибка Shard");
    requireValue(d.tasks.every(t=>label(t.title)&&has(d.shards,t.shardId)&&["todo","doing","done"].includes(t.status)&&optional(t.notes,2000)&&(t.assignee===null||has(d.crew,t.assignee))),"Ошибка задачи");
    requireValue(d.garage.every(m=>label(m.title)&&Number.isSafeInteger(m.qty)&&m.qty>=0&&optional(m.sku,80)&&optional(m.brand,100)&&optional(m.unit,20)),"Ошибка артикула или количества");
    const skuKey=m=>m.sku?.trim().toUpperCase();
    const codes=d.garage.map(skuKey).filter(Boolean);
    requireValue(new Set(codes).size===codes.length,"Артикул уже существует на складе");
    const held = new Map();
    const skuMovements=new Map();
    for (const m of d.moves) {
      requireValue((["receive","writeoff"].includes(m.type) ? m.shardId===null : has(d.shards,m.shardId))&&has(d.garage,m.itemId)&&has(d.crew,m.actor)&&Number.isSafeInteger(m.qty)&&m.qty>0&&["issue","return","receive","writeoff"].includes(m.type),"Ошибка движения");
      const key = m.shardId+"/"+m.itemId;
      const balance = (held.get(key)||0) + (m.type==="issue"?m.qty:m.type==="return"?-m.qty:0);
      requireValue(balance>=-0.000001,"Возврат превышает выдачу");
      held.set(key,balance);
      skuMovements.set(m.itemId,(skuMovements.get(m.itemId)||0)+(m.type==="receive"||m.type==="return"?m.qty:-m.qty));
    }
    return d;
  }
  function apply(source, action, p) {
    const d = JSON.parse(JSON.stringify(source)), actor = d.crew.find(c=>c.id===d.actor);
    const lead = actor.role===roles[0], stock = lead || actor.role===roles[2];
    const s = d.shards.find(s=>s.id===p.shardId);
    const t = d.tasks.find(t=>t.id===p.taskId);
    const allowed = ok => requireValue(ok,"Действие недоступно для этой роли или статуса");
    switch(action) {
      case "actor": d.actor=p.id; break;
      case "crew": allowed(lead); d.crew.push({id:p.id,name:p.title,role:p.role}); break;
      case "case": allowed(lead); d.cases.push({id:p.id,title:p.title,city:p.city,price:p.price,address:p.address||"",notes:p.notes||"",files:p.files||[]}); break;
      case "shard": allowed(lead);
        requireValue(Math.round(100*p.price)+d.shards.filter(s=>s.caseId===p.caseId).reduce((n,s)=>n+Math.round(100*s.price),0)<=Math.round(100*(d.cases.find(c=>c.id===p.caseId)?.price||0)),"Shard превышает доступный бюджет Project"); d.shards.push({id:p.id,title:p.title,kind:p.kind,price:p.price,caseId:p.caseId,assignee:p.assignee||null,status:"draft",notes:p.notes||"",files:p.files||[]}); break;
      case "assign": allowed(lead && s && s.status==="draft"); s.assignee=p.assignee; break;
      case "task": {
        allowed(s && s.status==="draft" && (lead || s.assignee===actor.id));
        requireValue(label(p.title)&&optional(p.notes,2000),"Укажите название и описание задачи");
        d.tasks.push({id:p.id,shardId:s.id,title:p.title.trim(),notes:p.notes||"",status:"todo",assignee:p.assignee||null});
        break;
      }
      case "task-status": {
        const parent=t&&d.shards.find(sh=>sh.id===t.shardId);
        allowed(t && parent && parent.status==="draft" && (lead || t.assignee===actor.id || (t.assignee===null&&parent.assignee===actor.id)));
        requireValue(["todo","doing","done"].includes(p.status),"Неизвестный статус задачи");
        t.status=p.status;
        break;
      }
      case "submit": allowed(s && s.status==="draft" && s.assignee===actor.id); requireValue(d.tasks.filter(t=>t.shardId===s.id).every(t=>t.status==="done"),"Завершите все Tasks в Shard перед приёмкой"); s.status="submitted"; break;
      case "accept": case "revise": allowed(lead && s && s.status==="submitted" && actor.id!==s.assignee); s.status=action==="accept"?"accepted":"draft"; break;
      case "material": {
        allowed(stock);
        requireValue(label(p.title)&&Number.isSafeInteger(p.qty)&&p.qty>=0,"Укажите название и целое количество");
        requireValue(typeof p.sku==="string"&&p.sku.trim().length>0&&p.sku.length<=80,"Укажите артикул (Artikelnummer)");
        requireValue(!d.garage.some(m=>m.sku?.trim().toUpperCase()===p.sku.trim().toUpperCase()),"Такой артикул уже есть на складе");
        d.garage.push({id:p.id,title:p.title,qty:p.qty,sku:p.sku.trim(),brand:(p.brand||"").trim(),unit:"шт."});
        break;
      }
      case "move": {
        const item=d.garage.find(x=>x.id===p.itemId);
        allowed(stock && item && (["receive","writeoff"].includes(p.type) || (s && s.status==="draft")));
        // Accepted work is closed: further stock movements require a new open Shard.
        requireValue(Number.isSafeInteger(p.qty)&&p.qty>0,"Количество должно быть положительным целым числом");
        requireValue(["issue","return","receive","writeoff"].includes(p.type),"Неизвестная складская операция");
        if(["issue","writeoff"].includes(p.type))requireValue(item.qty>=p.qty,"Недостаточно материала на складе");
        if(p.type==="writeoff")requireValue(typeof p.reason==="string"&&p.reason.trim().length>=3&&p.reason.length<=300,"Укажите причину списания");
        if(p.type==="return"){
          const outstanding=d.moves.filter(m=>m.itemId===item.id&&m.shardId===s.id).reduce((n,m)=>n+(m.type==="issue"?m.qty:m.type==="return"?-m.qty:0),0);
          requireValue(outstanding>=p.qty,"Возврат превышает выдачу по Shard");
        }
        item.qty=Math.round((item.qty+(["issue","writeoff"].includes(p.type)?-p.qty:p.qty))*1e6)/1e6;
        d.moves.push({id:p.id,type:p.type,qty:p.qty,itemId:item.id,shardId:["receive","writeoff"].includes(p.type)?null:s.id,actor:actor.id,reason:p.type==="writeoff"?p.reason.trim():""});
        break;
      }
      default: throw Error("Неизвестная операция");
    }
    return validate(d);
  }
  return {roles,migrate,validate,apply};
})();
