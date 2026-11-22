"use strict";
globalThis.NVModel = (() => {
  const roles = ["Руководитель", "Монтажник", "Кладовщик"];
  const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
  const label = value => typeof value === "string" && value.trim().length > 0 && value.length <= 240;
  const amount = value => Number.isFinite(value) && value >= 0 && value <= 1e12;
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
    for (const list of [d.cases,d.shards,d.crew,d.garage,d.moves]) {
      requireValue(list.every(x => x && ident(x.id)) && new Set(list.map(x=>x.id)).size === list.length,"Ошибка идентификаторов");
    }
    const has = (list,id) => list.some(x=>x.id===id);
    requireValue(d.crew.every(c=>label(c.name)&&roles.includes(c.role)) && has(d.crew,d.actor) && d.crew.some(c=>c.role===roles[0]),"Ошибка участников");
    requireValue(d.cases.every(c=>label(c.title)&&label(c.city)&&amount(c.price)),"Ошибка Case");
    requireValue(d.shards.every(s=>label(s.title)&&label(s.kind)&&amount(s.price)&&has(d.cases,s.caseId)&&["draft","submitted","accepted"].includes(s.status)&&(s.assignee===null||has(d.crew,s.assignee))),"Ошибка Shard");
    requireValue(d.garage.every(m=>label(m.title)&&amount(m.qty)),"Ошибка количества");
    const held = new Map();
    for (const m of d.moves) {
      requireValue((m.type==="receive" ? m.shardId===null : has(d.shards,m.shardId))&&has(d.garage,m.itemId)&&has(d.crew,m.actor)&&amount(m.qty)&&m.qty>0&&["issue","return","receive"].includes(m.type),"Ошибка движения");
      const key = m.shardId+"/"+m.itemId;
      const balance = (held.get(key)||0) + (m.type==="issue"?m.qty:m.type==="return"?-m.qty:0);
      requireValue(balance>=-0.000001,"Возврат превышает выдачу");
      held.set(key,balance);
    }
    return d;
  }
  function apply(source, action, p) {
    const d = JSON.parse(JSON.stringify(source)), actor = d.crew.find(c=>c.id===d.actor);
    const lead = actor.role===roles[0], stock = lead || actor.role===roles[2];
    const s = d.shards.find(s=>s.id===p.shardId);
    const allowed = ok => requireValue(ok,"Действие недоступно для этой роли или статуса");
    switch(action) {
      case "actor": d.actor=p.id; break;
      case "crew": allowed(lead); d.crew.push({id:p.id,name:p.title,role:p.role}); break;
      case "case": allowed(lead); d.cases.push({id:p.id,title:p.title,city:p.city,price:p.price}); break;
      case "shard": allowed(lead);
        requireValue(Math.round(100*p.price)+d.shards.filter(s=>s.caseId===p.caseId).reduce((n,s)=>n+Math.round(100*s.price),0)<=Math.round(100*(d.cases.find(c=>c.id===p.caseId)?.price||0)),"Стоимость Shard превышает остаток бюджета Case"); d.shards.push({id:p.id,title:p.title,kind:p.kind,price:p.price,caseId:p.caseId,assignee:p.assignee||null,status:"draft"}); break;
      case "assign": allowed(lead && s && s.status==="draft"); s.assignee=p.assignee; break;
      case "submit": allowed(s && s.status==="draft" && s.assignee===actor.id); s.status="submitted"; break;
      case "accept": case "revise": allowed(lead && s && s.status==="submitted" && actor.id!==s.assignee); s.status=action==="accept"?"accepted":"draft"; break;
      case "material": allowed(stock); d.garage.push({id:p.id,title:p.title,qty:p.qty}); break;
      case "move": {
        const item=d.garage.find(x=>x.id===p.itemId);
        allowed(stock && item && (p.type==="receive" || (s && s.status!=="accepted")));
        // Accepted work is closed: further stock movements require a new open Shard.
        requireValue(amount(p.qty)&&p.qty>0,"Введите положительное количество");
        item.qty=Math.round((item.qty+(p.type==="issue"?-p.qty:p.qty))*1e6)/1e6;
        d.moves.push({id:p.id,type:p.type,qty:p.qty,itemId:item.id,shardId:p.type==="receive"?null:s.id,actor:actor.id});
        break;
      }
      default: throw Error("Неизвестная операция");
    }
    return validate(d);
  }
  return {roles,migrate,validate,apply};
})();
