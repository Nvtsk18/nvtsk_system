"use strict";
globalThis.NVModel = (() => {
  const roles = ["Руководитель", "Монтажник", "Кладовщик"];
  // Business-card sourced company contact; system Captain is an app role, not a legal job title.
  // Legal/contact details sourced from sunpaur.com/impressum; service split supplied by operator.
  const sunpaurProfile=Object.freeze({
    id:"sunpaur-gmbh",name:"Sunpaur GmbH",category:"Auftraggeber",
    address:"Zur Gottwies 6, 78315 Radolfzell am Bodensee",
    city:"Radolfzell am Bodensee",phone:"+49 7732 987 99 00",
    email:"info@sunpaur.com",website:"https://sunpaur.com",
    register:"HRB 729086 · Amtsgericht Freiburg i.Br.",
    vatId:"DE361857259",
    directors:["Patrick Kohler","Christian Hertkorn"],
    services:["Photovoltaik","Energiemanagement","Elektrotechnik"],
    relationship:{from:"sunpaur-gmbh",to:"SolAn Plus GmbH",service:"DC-Montage",ac:"Sunpaur GmbH · eigene Elektriker",status:"Рабочий контрагент"},
    sources:["https://sunpaur.com/impressum/","https://sunpaur.com/"]
  });
  const seedCounterparties=list=>{
    const out=Array.isArray(list)?list:[];
    return out.some(x=>x?.id===sunpaurProfile.id)?out:[...out,JSON.parse(JSON.stringify(sunpaurProfile))];
  };
  const companyCaptain=Object.freeze({name:"Roman Eppinger",headline:"SolAn Plus GmbH",location:"Überlingen, Baden-Württemberg",address:"Hauptstraße 29, 88662 Überlingen",phone:"+49 160 784 19 43",email:"romaneppinger@solanplus.de",website:"https://www.solanplus.de",company:"SolAn Plus GmbH"});
  const upgradeCaptain=old=>{
    const crew=old?.crew;
    if(!Array.isArray(crew))return old;
    const lead=crew.find(c=>c&&c.id==="lead"&&c.role===roles[0]);
    if(!lead||!["Капитан","Координатор"].includes(lead.name))return old;
    return {...old,crew:crew.map(c=>c.id==="lead"?{...companyCaptain,...c,name:companyCaptain.name,
      headline:c.headline||companyCaptain.headline,location:c.location||companyCaptain.location,
      address:c.address||companyCaptain.address,phone:c.phone||companyCaptain.phone,
      email:c.email||companyCaptain.email,website:c.website||companyCaptain.website,
      company:c.company||companyCaptain.company}:c)};
  };

  const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
  const label = value => typeof value === "string" && value.trim().length > 0 && value.length <= 240;
  const amount = value => Number.isFinite(value) && value >= 0 && value <= 1e12;
  const optional = (value, max=2000) => value===undefined || (typeof value==="string" && value.length<=max);
  const attachments = list => list===undefined || (Array.isArray(list)&&list.length<=8&&list.every(a=>a&&ident(a.id)&&optional(a.name,180)&&a.name&&typeof a.data==="string"&&/^data:(image\/(png|jpeg|webp|gif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(a.data)&&a.data.length<=900000));
  const ident = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  // Optional technical dossier for one PV Project. Does not change historical Cases/Shards/Merit.
  const pvChecks=["risk","access","fall","static","materials","strings","dcTests","photos","handover"];
  const optQty=n=>n===undefined||n===null||(Number.isFinite(n)&&n>=0&&n<=1e7);
  const pvPlanValid=p=>{
    if(p===undefined)return true;
    if(!p||typeof p!=="object"||Array.isArray(p))return false;
    const texts=["bauherr","revision","roofType","tileType","mounting","moduleType","insulation","cableRoute","hazards","safetyPlan","sourcePlan","model3d","acScope","dcScope"];
    if(!texts.every(k=>optional(p[k],k==="hazards"||k==="safetyPlan"?2000:500)))return false;
    if(p.model3d&&!/^https:\/\/[^\s"'<>]{1,450}$/.test(p.model3d))return false;
    if(!["declaredModules","panelWp","declaredKwp","slopeDeg","eaveHeightM","rafterSpacingCm","roofLengthM"].every(k=>optQty(p[k])))return false;
    const list=(v,max,fn)=>v===undefined||(Array.isArray(v)&&v.length<=max&&v.every(fn)&&new Set(v.map(x=>x.id)).size===v.length);
    if(!list(p.zones,30,z=>z&&ident(z.id)&&label(z.name)&&optional(z.direction,80)&&optional(z.moduleType,140)&&optional(z.roofType,140)&&optional(z.mounting,140)&&optional(z.notes,600)&&optQty(z.modules)&&optQty(z.hooks)&&optQty(z.panelWp)))return false;
    if(!list(p.strings,60,t=>t&&ident(t.id)&&label(t.name)&&optional(t.direction,80)&&optional(t.mppt,80)&&optional(t.notes,600)&&optQty(t.modules)))return false;
    if(!list(p.cuts,120,t=>t&&ident(t.id)&&label(t.name)&&optional(t.notes,600)&&optQty(t.stockLengthMm)&&optQty(t.requiredLengthMm)&&optQty(t.qty)))return false;
    if(!list(p.materials,120,m=>m&&ident(m.id)&&label(m.name)&&optional(m.unit,20)&&optional(m.sku,90)&&optQty(m.qty)))return false;
    if(!list(p.documents,35,d=>d&&ident(d.id)&&label(d.name)&&optional(d.kind,70)&&optional(d.revision,70)&&optional(d.url,700)&&(!d.url||/^https:\/\/[^\s"'<>]{1,680}$/.test(d.url))))return false;
    if(p.checks!==undefined&&(!p.checks||typeof p.checks!=="object"||Object.keys(p.checks).some(k=>!pvChecks.includes(k)||typeof p.checks[k]!=="boolean")))return false;
    return true;
  };
  function migrate(old) {
    if (old.version === 2) return upgradeCaptain({...old,teams:Array.isArray(old.teams)?old.teams:[],counterparties:seedCounterparties(old.counterparties)});
    if (old.version !== 1) return old;
    const data = JSON.parse(JSON.stringify(old));
    requireValue(["cases","garage","tasks","crew","shards"].every(k => Array.isArray(data[k])), "Неверная схема v1");
    data.crew = [{id:"lead",role:roles[0],...companyCaptain}, ...data.crew.map((c,i) => ({id:"member-"+i,name:c.name,role:roles[1]}))];
    data.actor = "lead";
    data.moves = [];
    data.teams = [];
    data.counterparties=seedCounterparties(data.counterparties);
    data.version = 2;
    return data;
  }
  function validate(d) {
    requireValue(d && d.version === 2 && ["cases","shards","crew","garage","moves","tasks","teams","counterparties"].every(k => Array.isArray(d[k])), "Неверная версия или структура");
    for (const list of [d.cases,d.shards,d.tasks,d.crew,d.garage,d.moves,d.teams,d.counterparties]) {
      requireValue(list.every(x => x && ident(x.id)) && new Set(list.map(x=>x.id)).size === list.length,"Ошибка идентификаторов");
    }
    const has = (list,id) => list.some(x=>x.id===id);
    requireValue(d.crew.every(c=>label(c.name)&&roles.includes(c.role)&&optional(c.headline,120)&&optional(c.location,100)&&optional(c.bio,700)&&optional(c.company,120)&&optional(c.address,240)&&optional(c.phone,50)&&optional(c.email,160)&&optional(c.website,180)&&(c.skills===undefined||(Array.isArray(c.skills)&&c.skills.length<=8&&c.skills.every(x=>typeof x==="string"&&x.length<=36)))&&(c.avatar===undefined||(typeof c.avatar==="string"&&(c.avatar===""||(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.avatar)&&c.avatar.length<=240000))))) && has(d.crew,d.actor) && d.crew.some(c=>c.role===roles[0]),"Ошибка участников / профиля");
    requireValue(d.teams.every(t=>label(t.name)&&optional(t.description,500)&&has(d.crew,t.captainId)&&Array.isArray(t.memberIds)&&t.memberIds.length>=1&&t.memberIds.length<=40&&new Set(t.memberIds).size===t.memberIds.length&&t.memberIds.every(id=>has(d.crew,id))&&t.memberIds.includes(t.captainId)),"Ошибка состава Team");
    requireValue(d.counterparties.every(p=>label(p.name)&&optional(p.category,80)&&optional(p.address,240)&&optional(p.city,120)&&optional(p.phone,50)&&optional(p.email,160)&&optional(p.website,180)&&optional(p.register,180)&&optional(p.vatId,80)&&Array.isArray(p.directors)&&p.directors.length<=8&&p.directors.every(x=>label(x))&&Array.isArray(p.services)&&p.services.length<=15&&p.services.every(x=>typeof x==="string"&&x.length<=100)&&(!p.relationship||(typeof p.relationship==="object"&&optional(p.relationship.service,150)&&optional(p.relationship.ac,150)&&optional(p.relationship.status,120)))&&(!p.sources||(Array.isArray(p.sources)&&p.sources.length<=8&&p.sources.every(x=>typeof x==="string"&&x.startsWith("https://")&&x.length<=250)))),"Ошибка карточки контрагента");
    requireValue(d.cases.every(c=>label(c.title)&&label(c.city)&&amount(c.price)&&optional(c.address,300)&&optional(c.notes,4000)&&attachments(c.files)&&pvPlanValid(c.pvPlan)&&(c.counterpartyId===undefined||c.counterpartyId===null||has(d.counterparties,c.counterpartyId))),"Ошибка Project");
    requireValue(d.shards.every(s=>label(s.title)&&label(s.kind)&&amount(s.price)&&has(d.cases,s.caseId)&&optional(s.notes,4000)&&attachments(s.files)&&["draft","submitted","accepted"].includes(s.status)&&(s.assignee===null||has(d.crew,s.assignee))&&(s.teamId===undefined||s.teamId===null||has(d.teams,s.teamId))),"Ошибка Shard");
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
    const has=(list,id)=>list.some(item=>item.id===id);
    const lead = actor.role===roles[0], stock = lead || actor.role===roles[2];
    const s = d.shards.find(s=>s.id===p.shardId);
    const t = d.tasks.find(t=>t.id===p.taskId);
    const allowed = ok => requireValue(ok,"Действие недоступно для этой роли или статуса");
    switch(action) {
      case "actor": d.actor=p.id; break;
      case "crew": allowed(lead); d.crew.push({id:p.id,name:p.title,role:p.role}); break;
      case "team-create": {
        allowed(lead);
        requireValue(label(p.title)&&optional(p.description,500),"Укажите название Team");
        const members=[...new Set([p.captainId,...(p.memberIds||[])])];
        requireValue(has(d.crew,p.captainId)&&members.length<=40&&members.every(id=>has(d.crew,id)),"Выберите капитана и участников");
        d.teams.push({id:p.id,name:p.title.trim(),description:(p.description||"").trim(),captainId:p.captainId,memberIds:members});
        break;
      }
      case "team-update": {
        allowed(lead);
        const team=d.teams.find(t=>t.id===p.teamId);
        allowed(team);
        requireValue(label(p.title)&&optional(p.description,500),"Укажите название Team");
        const members=[...new Set([p.captainId,...(p.memberIds||[])])];
        requireValue(has(d.crew,p.captainId)&&members.length<=40&&members.every(id=>has(d.crew,id)),"Выберите капитана и участников");
        // Reassigning a Team does not alter already accepted Shards.
        Object.assign(team,{name:p.title.trim(),description:(p.description||"").trim(),captainId:p.captainId,memberIds:members});
        break;
      }
      case "team-assign": {
        allowed(lead && s && s.status==="draft");
        const team=d.teams.find(t=>t.id===p.teamId);
        allowed(team && team.captainId!==actor.id);
        s.teamId=team.id;
        s.assignee=team.captainId;
        break;
      }
      case "profile": {
        const target=d.crew.find(c=>c.id===p.memberId);
        allowed(target&&target.id===actor.id);
        requireValue(typeof p.headline==="string"&&p.headline.length<=120&&typeof p.location==="string"&&p.location.length<=100&&typeof p.bio==="string"&&p.bio.length<=700,"Слишком длинный текст профиля");
        const contact={address:p.address??target.address??"",phone:p.phone??target.phone??"",email:p.email??target.email??"",website:p.website??target.website??""};
        requireValue(typeof contact.address==="string"&&contact.address.length<=240&&typeof contact.phone==="string"&&contact.phone.length<=50&&typeof contact.email==="string"&&contact.email.length<=160&&typeof contact.website==="string"&&contact.website.length<=180,"Некорректные контактные данные профиля");
        requireValue(!contact.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email),"Некорректный email");
        requireValue(!contact.website||/^https:\/\/[a-z0-9.-]+(?:\/[a-zA-Z0-9._~!$&'()*+,;=:@%/?#-]*)?$/.test(contact.website),"Сайт должен начинаться с https://");
        requireValue(Array.isArray(p.skills)&&p.skills.length<=8&&p.skills.every(x=>typeof x==="string"&&x.length<=36),"Укажите до 8 навыков");
        if(p.avatar!==undefined)requireValue(p.avatar===""||(typeof p.avatar==="string"&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar)&&p.avatar.length<=240000),"Недопустимое фото профиля");
        Object.assign(target,{headline:p.headline.trim(),location:p.location.trim(),bio:p.bio.trim(),address:contact.address.trim(),phone:contact.phone.trim(),email:contact.email.trim(),website:contact.website.trim(),skills:p.skills.map(x=>x.trim()).filter(Boolean)});
        if(p.avatar!==undefined)target.avatar=p.avatar;
        break;
      }
      case "case": allowed(lead); d.cases.push({id:p.id,title:p.title,city:p.city,price:p.price,address:p.address||"",notes:p.notes||"",files:p.files||[],counterpartyId:p.counterpartyId||null}); break;
      case "case-media": {
        allowed(lead);
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(Array.isArray(p.files)&&p.files.length>0,"Выберите медиафайлы");
        c.files=[...(c.files||[]),...p.files];
        requireValue(c.files.length<=8,"Максимум 8 медиафайлов на Case");
        break;
      }
      case "pv-tech": {
        allowed(lead);
        const c=d.cases.find(x=>x.id===p.caseId); allowed(c);
        const keys=["bauherr","revision","roofType","tileType","mounting","moduleType","insulation","cableRoute","hazards","safetyPlan","sourcePlan","model3d","acScope","dcScope"];
        const nums=["declaredModules","panelWp","declaredKwp","slopeDeg","eaveHeightM","rafterSpacingCm","roofLengthM"];
        const current=c.pvPlan||{};
        const changes=Object.fromEntries(keys.map(k=>[k,String(p[k]??"").trim()]));
        for(const k of nums){changes[k]=p[k]===""||p[k]===undefined||p[k]===null?null:Number(p[k])}
        c.pvPlan={...current,...changes};
        break;
      }
      case "pv-add": {
        allowed(lead);
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        const type=p.list;
        requireValue(["zones","strings","cuts","materials","documents"].includes(type),"Некорректный раздел PV");
        const current=c.pvPlan||{},list=(current[type]||[]).slice();
        const item={id:p.id};
        if(type==="zones")Object.assign(item,{name:p.name,direction:p.direction||"",modules:p.modules===""?null:Number(p.modules),hooks:p.hooks===""?null:Number(p.hooks),moduleType:p.moduleType||"",roofType:p.roofType||"",mounting:p.mounting||"",panelWp:p.panelWp===""?null:Number(p.panelWp),notes:p.notes||""});
        if(type==="strings")Object.assign(item,{name:p.name,direction:p.direction||"",mppt:p.mppt||"",modules:p.modules===""?null:Number(p.modules),notes:p.notes||""});
        if(type==="cuts")Object.assign(item,{name:p.name,stockLengthMm:p.stockLengthMm===""?null:Number(p.stockLengthMm),requiredLengthMm:p.requiredLengthMm===""?null:Number(p.requiredLengthMm),qty:p.qty===""?null:Number(p.qty),notes:p.notes||""});
        if(type==="materials")Object.assign(item,{name:p.name,unit:p.unit||"St.",qty:Number(p.qty),sku:p.sku||""});
        if(type==="documents")Object.assign(item,{name:p.name,kind:p.kind||"Andere",url:p.url||"",revision:p.revision||""});
        list.push(item);
        c.pvPlan={...current,[type]:list};
        break;
      }
      case "pv-remove": {
        allowed(lead);
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(["zones","strings","cuts","materials","documents"].includes(p.list),"Некорректный раздел PV");
        const cur=c.pvPlan||{};
        c.pvPlan={...cur,[p.list]:(cur[p.list]||[]).filter(x=>x.id!==p.rowId)};
        break;
      }
      case "pv-check": {
        allowed(lead);
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(pvChecks.includes(p.key)&&typeof p.value==="boolean","Неизвестный пункт проверки");
        const cur=c.pvPlan||{};
        c.pvPlan={...cur,checks:{...cur.checks,[p.key]:p.value}};
        break;
      }
      case "link-counterparty": {
        allowed(lead);
        const project=d.cases.find(c=>c.id===p.caseId);
        allowed(project);
        requireValue(p.counterpartyId===null||has(d.counterparties,p.counterpartyId),"Неизвестный контрагент");
        project.counterpartyId=p.counterpartyId;
        break;
      }
      case "shard": allowed(lead);
        requireValue(Math.round(100*p.price)+d.shards.filter(s=>s.caseId===p.caseId).reduce((n,s)=>n+Math.round(100*s.price),0)<=Math.round(100*(d.cases.find(c=>c.id===p.caseId)?.price||0)),"Shard превышает доступный бюджет Project"); d.shards.push({id:p.id,title:p.title,kind:p.kind,price:p.price,caseId:p.caseId,assignee:p.assignee||null,status:"draft",notes:p.notes||"",files:p.files||[]}); break;
      case "assign": allowed(lead && s && s.status==="draft"); s.assignee=p.assignee; s.teamId=null; break;
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
      case "submit": allowed(s && s.status==="draft" && s.assignee===actor.id); requireValue(d.tasks.filter(t=>t.shardId===s.id).every(t=>t.status==="done"),"Завершите все задачи Shard перед приёмкой"); s.status="submitted"; break;
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
        if(p.type==="issue"||p.type==="return")requireValue(typeof p.recipientId==="string"&&has(d.crew,p.recipientId),"Выберите получателя из участников компании");
        if(["issue","writeoff"].includes(p.type))requireValue(item.qty>=p.qty,"Недостаточно материала на складе");
        if(p.type==="writeoff")requireValue(typeof p.reason==="string"&&p.reason.trim().length>=3&&p.reason.length<=300,"Укажите причину списания");
        if(p.type==="return"){
          const outstanding=d.moves.filter(m=>m.itemId===item.id&&m.shardId===s.id).reduce((n,m)=>n+(m.type==="issue"?m.qty:m.type==="return"?-m.qty:0),0);
          requireValue(outstanding>=p.qty,"Возврат превышает выдачу по Shard");
        }
        item.qty=Math.round((item.qty+(["issue","writeoff"].includes(p.type)?-p.qty:p.qty))*1e6)/1e6;
        d.moves.push({id:p.id,type:p.type,qty:p.qty,itemId:item.id,shardId:["receive","writeoff"].includes(p.type)?null:s.id,actor:actor.id,recipientId:["issue","return"].includes(p.type)?p.recipientId:null,reason:p.type==="writeoff"?p.reason.trim():""});
        break;
      }
      default: throw Error("Неизвестная операция");
    }
    return validate(d);
  }
  return {roles,migrate,validate,apply};
})();
