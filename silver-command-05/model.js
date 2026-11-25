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
    if (old.version === 2) {const normalized={...old,teams:Array.isArray(old.teams)?old.teams:[]};if(old.personalProfile===true)return {...normalized,counterparties:Array.isArray(old.counterparties)?old.counterparties:[]};return upgradeCaptain({...normalized,counterparties:seedCounterparties(old.counterparties)});}
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
  const cashCategories={income:["customer","pay","refund","other"],expense:["materials","fuel","travel","tools","crew","other"]};
  const cashDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;

  // Financial Engine v1: integer euro cents; all earnings are derived, never duplicated as cash entries.
  const cents=n=>Math.round(Number(n)*100);
  const fee=n=>Math.floor((n+50)/100);
  const validMoney=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000000000;
  const classes=["SOLO","LEAD","PILOT","BUILDER","PRO","CHIEF","ALLY"];
  const ownerOf=(d,c)=>c.fin?.ownerId||c.ownerId||d.crew.find(x=>x.id==="lead"&&x.role===roles[0])?.id||d.crew.find(x=>x.role===roles[0])?.id;
  const sharesFor=s=>s.shares??(s.assignee?[{memberId:s.assignee,cents:cents(s.price),className:"PRO"}]:[]);

  // v105: euro earnings are independent from Merit; one allocation per top-level Shard.
  // Existing activated v104 plans retain their original fee terms unless explicitly converted.
  const freeEconomy=c=>c.economy==="free-v105"||!c.fin;
  const ownsCase=(d,id,memberId=d.actor)=>{const c=d.cases.find(x=>x.id===id);return !!c&&ownerOf(d,c)===memberId};
  const organizerOf=s=>s.organizerId||s.assignee||null;
  const memberLine=id=>({memberId:id,gross:0,commission:0,net:0,expected:0,review:0,confirmed:0,available:0,paid:0,merit:0,meritLocked:0,meritWork:0,meritOrganize:0,meritCase:0});
  // Largest remainder allocation: exact hundredths of Merit, no floating-point drift.
  function apportion(total,weights){const sum=weights.reduce((n,x)=>n+BigInt(x),0n);if(!sum)return weights.map(()=>0);const parts=weights.map((w,i)=>{const p=BigInt(total)*BigInt(w);return {i,n:Number(p/sum),rem:p%sum}});let rest=total-parts.reduce((n,p)=>n+p.n,0);for(const p of parts.slice().sort((a,b)=>a.rem===b.rem?a.i-b.i:a.rem>b.rem?-1:1)){if(rest--<=0)break;p.n++}return parts.map(p=>p.n)}
  function meritShard(s){const total=cents(s.price),[work,organize,caseReward,platform]=apportion(total,[80,10,5,5]),shares=sharesFor(s),organizerId=organizerOf(s);const workParts=apportion(work,shares.map(x=>x.cents));return {total,work,organize,caseReward,platform,organizerId,workRows:shares.map((x,i)=>({memberId:x.memberId,merit:workParts[i]})),unassignedWork:shares.length?0:work,unassignedOrganize:organizerId?0:organize}}
  function freeFinancialCase(d,c){
    const f=c.fin||{},ownerId=ownerOf(d,c),budget=cents(c.price),shards=d.shards.filter(s=>s.caseId===c.id),allocated=shards.reduce((n,s)=>n+cents(s.price),0),remaining=budget-allocated,active=f.active===true,settled=f.settled===true,received=(f.receipts||[]).reduce((n,x)=>n+x.cents,0),fullyPaid=active&&received===budget,allAccepted=shards.length>0&&shards.every(s=>s.status==="accepted"),rows=[],byMember=new Map(),meritShards=shards.map(s=>({id:s.id,...meritShard(s)}));
    const ready=budget>0&&shards.length>0&&remaining===0&&shards.every(s=>cents(s.price)>0&&s.assignee&&sharesFor(s).some(x=>x.memberId===organizerOf(s)&&x.cents>0));
    const person=id=>{if(!byMember.has(id))byMember.set(id,memberLine(id));return byMember.get(id)};
    for(const s of shards){const status=settled?"available":s.status==="accepted"?"confirmed":s.status==="submitted"?"review":"expected";const shares=sharesFor(s);for(const x of shares){const p=person(x.memberId);rows.push({memberId:x.memberId,shardId:s.id,gross:x.cents,commission:0,net:x.cents,className:x.className,status});p.gross+=x.cents;p.net+=x.cents;p[status]+=x.cents}if(!shares.length)rows.push({memberId:null,shardId:s.id,gross:cents(s.price),commission:0,net:cents(s.price),className:"PRO",status:"unassigned"})}
    let meritPlatform=0,unassignedMerit=0;
    for(const ms of meritShards){for(const x of ms.workRows)person(x.memberId).meritWork+=x.merit;if(ms.organizerId)person(ms.organizerId).meritOrganize+=ms.organize;person(ownerId).meritCase+=ms.caseReward;meritPlatform+=ms.platform;unassignedMerit+=ms.unassignedWork+ms.unassignedOrganize}
    const paid=new Set((f.payouts||[]).map(x=>x.memberId));
    for(const p of byMember.values()){const total=p.meritWork+p.meritOrganize+p.meritCase;p.merit=settled?total:0;p.meritLocked=settled?0:total;if(settled&&paid.has(p.memberId)){p.paid=p.available;p.available=0}}
    return {id:c.id,policy:"free-v105",ownerId,budget,allocated,remaining,caseFee:0,shardFees:0,due:budget,received,fullyPaid,active,settled,allAccepted,ready,rows,people:[...byMember.values()],feeCovered:true,reserve:0,development:0,operations:0,meritMinted:allocated,meritAllocated:allocated,meritReleased:settled?allocated:0,meritLocked:settled?0:allocated,meritPlatform:settled?meritPlatform:0,meritPlatformLocked:settled?0:meritPlatform,unassignedMerit,meritShards,receipts:f.receipts||[],payouts:f.payouts||[]};
  }

  function financialCase(d,id){
    const c=d.cases.find(x=>x.id===id);if(!c)throw Error("Case не найден");if(freeEconomy(c))return freeFinancialCase(d,c);
    const f=c.fin||{},ownerId=ownerOf(d,c),budget=cents(c.price),shards=d.shards.filter(s=>s.caseId===id),allocated=shards.reduce((n,s)=>n+cents(s.price),0),remaining=budget-allocated,caseFee=fee(budget),shardFees=shards.reduce((n,s)=>n+fee(cents(s.price)),0),due=budget+caseFee;
    const active=f.active===true,settled=f.settled===true,received=(f.receipts||[]).reduce((n,x)=>n+x.cents,0),paidMap=new Map((f.payouts||[]).map(x=>[x.memberId,x])),fullyPaid=active&&received===due,allAccepted=shards.every(s=>s.status==="accepted"),rows=[];
    const row=(memberId,shardId,gross,className,status,commission=0)=>{if(gross===0&&commission===0)return;rows.push({memberId,shardId,gross,commission,net:gross-commission,className,status})};
    row(ownerId,null,remaining,"BUILDER",settled?"available":allAccepted?"confirmed":"expected",active?shardFees:0);
    for(const s of shards){const shares=sharesFor(s);for(const x of shares)row(x.memberId,s.id,x.cents,x.className,settled?"available":s.status==="accepted"?"confirmed":s.status==="submitted"?"review":"expected");if(!shares.length)row(null,s.id,cents(s.price),"PRO","unassigned")}
    const byMember=new Map();for(const r of rows){if(!r.memberId)continue;const p=byMember.get(r.memberId)||{memberId:r.memberId,gross:0,commission:0,net:0,expected:0,review:0,confirmed:0,available:0,paid:0,merit:0};p.gross+=r.gross;p.commission+=r.commission;p.net+=r.net;p[r.status]+=r.net;p.merit+=active?r.gross:0;byMember.set(r.memberId,p)}
    for(const p of byMember.values()){if(settled&&paidMap.has(p.memberId)){p.paid=p.available;p.available=0}}
    const reserveCase=Math.floor(caseFee/2),development=Math.floor(caseFee*3/10),operations=caseFee-reserveCase-development;
    return {id,policy:"legacy-v104",ready:true,meritReleased:settled?budget:0,meritLocked:active&&!settled?budget:0,meritPlatform:0,meritPlatformLocked:0,unassignedMerit:0,ownerId,budget,allocated,remaining,caseFee,shardFees,due,received,fullyPaid,active,settled,allAccepted,rows,people:[...byMember.values()],feeCovered:remaining>=shardFees,reserve:settled?reserveCase+shardFees:0,development:settled?development:0,operations:settled?operations:0,meritMinted:active?budget:0,meritAllocated:active?allocated:0,receipts:f.receipts||[],payouts:f.payouts||[]};
  }
  function financialMember(d,memberId){const totals={expected:0,review:0,confirmed:0,available:0,paid:0,merit:0,meritLocked:0,meritWork:0,meritOrganize:0,meritCase:0,commission:0};const cases=[];for(const c of d.cases){const f=financialCase(d,c.id),p=f.people.find(x=>x.memberId===memberId);if(!p)continue;for(const k of Object.keys(totals))totals[k]+=p[k]||0;cases.push({caseId:c.id,...p})}return {...totals,cases}}
  function validateFinance(d){
    const member=id=>d.crew.some(x=>x.id===id),unique=items=>new Set(items).size===items.length;
    for(const s of d.shards){const c=d.cases.find(x=>x.id===s.caseId);if(s.organizerId!==undefined)requireValue(member(s.organizerId),"Организатор Shard не найден");if(s.createdBy!==undefined)requireValue(member(s.createdBy),"Автор Shard не найден");if(freeEconomy(c)&&s.organizerId)requireValue(sharesFor(s).some(x=>x.memberId===s.organizerId&&x.cents>0),"Организатор должен участвовать в Shard");if(s.shares!==undefined){requireValue(Array.isArray(s.shares)&&s.shares.length<=40&&s.shares.every(x=>x&&member(x.memberId)&&validMoney(x.cents)&&x.cents>0&&classes.includes(x.className))&&unique(s.shares.map(x=>x.memberId))&&s.shares.reduce((n,x)=>n+x.cents,0)===cents(s.price),"Доли Shard должны в сумме равняться бюджету");requireValue(s.assignee&&s.shares.some(x=>x.memberId===s.assignee),"Ответственный должен входить в распределение Shard")}}
    for(const c of d.cases){const f=financialCase(d,c.id);requireValue(validMoney(f.budget)&&f.allocated<=f.budget,"Распределение превышает бюджет Case");if(c.ownerId!==undefined)requireValue(member(c.ownerId),"Владелец Case не найден");requireValue(c.economy===undefined||c.economy==="free-v105","Неизвестная экономика Case");if(c.fin===undefined)continue;
      const x=c.fin;requireValue(x&&typeof x==="object"&&x.active===true&&member(x.ownerId)&&typeof x.settled==="boolean"&&Array.isArray(x.receipts)&&Array.isArray(x.payouts),"Ошибка финансовой карточки");
      requireValue(f.feeCovered,"Недостаточно остатка BUILDER для комиссии Shard");if(f.policy==="free-v105"){requireValue(f.ready,"Нужен минимум один Shard, 100% бюджета и участвующие организаторы");requireValue(c.ownerId===undefined||c.ownerId===x.ownerId,"Владелец финансового плана не совпадает с создателем Case")}requireValue(x.receipts.length<=2000&&x.receipts.every(e=>e&&ident(e.id)&&validMoney(e.cents)&&e.cents>0&&cashDate(e.date)&&label(e.ref))&&unique(x.receipts.map(e=>e.id))&&unique(x.receipts.map(e=>e.ref.trim().toLowerCase()))&&f.received<=f.due,"Ошибка подтверждённых поступлений");
      requireValue(x.payouts.length<=d.crew.length&&x.payouts.every(e=>e&&member(e.memberId)&&validMoney(e.cents)&&e.cents>0&&cashDate(e.date)&&label(e.ref)&&f.people.some(p=>p.memberId===e.memberId&&p.net===e.cents))&&unique(x.payouts.map(e=>e.memberId))&&unique(x.payouts.map(e=>e.ref.trim().toLowerCase())),"Ошибка выплат");
      requireValue(!x.settled?(x.payouts.length===0):(f.fullyPaid&&f.allAccepted&&f.rows.every(r=>r.memberId&&r.net>=0)),"Нельзя закрыть неоплаченный или непринятый Case");
    }
  }
  function financeEditable(d,c){requireValue(c&&(!c.fin||(!c.fin.settled&&c.fin.receipts.length===0)),"Финансовый план заблокирован после первого платежа")}
  function financePlanEditable(d,c){financeEditable(d,c);requireValue(!(c.fin&&freeEconomy(c)),"Верните бесплатный план в редактирование перед изменением долей")}
  function financeOwner(d,c,actor){requireValue(c&&ownerOf(d,c)===actor.id,"Операция доступна владельцу Case")}


  // Network Rental v106: local records of external contracts, not a payment processor.
  const rentalKinds=["Автомобили","Прицепы","Подъёмники","Леса","Инструменты","Другое"];
  const rentalDays=(start,end)=>Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  function rentalQuote(r){
    const gross=r.dailyCents*rentalDays(r.start,r.end),fee= Math.floor((gross+5)/10),cost=r.costCents||0,net=Math.max(0,fee-cost),[fund,platformIncome]=apportion(net,[80,20]),[providerMerit,renterMerit,brokerMerit,platformMerit]=apportion(net,r.brokerId?[80,80,30,10]:[95,95,0,10]);
    return {gross,fee,cost,net,ownerCash:gross-fee,fund,platformIncome,merit:net,providerMerit,renterMerit,brokerMerit,platformMerit,days:rentalDays(r.start,r.end)};
  }
  const rentalProvider=(d,partnerId)=> (d.rentalPartners||[]).find(x=>x.id===partnerId)?.memberId||null;
  const managesRental=(d,partnerId,actorId=d.actor)=>{const p=(d.rentalPartners||[]).find(x=>x.id===partnerId);return !!p&&(p.memberId?p.memberId===actorId:d.crew.some(c=>c.id===actorId&&c.role===roles[0]))};
  function rentalCapital(d){
    const out={turnover:0,fee:0,cost:0,fund:0,platformIncome:0,merit:0,platformMerit:0,partners:Object.create(null),members:Object.create(null),count:0};
    for(const r of d.rentals||[]){if(r.status!=="settled")continue;const q=rentalQuote(r);out.count++;for(const k of ["fee","cost","fund","platformIncome","merit","platformMerit"])out[k]+=q[k];out.turnover+=q.gross;out.partners[r.partnerId]=(out.partners[r.partnerId]||0)+q.providerMerit;const provider=rentalProvider(d,r.partnerId);if(provider)out.members[provider]=(out.members[provider]||0)+q.providerMerit;out.members[r.renterId]=(out.members[r.renterId]||0)+q.renterMerit;if(r.brokerId)out.members[r.brokerId]=(out.members[r.brokerId]||0)+q.brokerMerit}
    return out;
  }
  function validateRental(d){
    const ps=d.rentalPartners??[],ls=d.rentalListings??[],rs=d.rentals??[],member=id=>d.crew.some(x=>x.id===id);
    for(const list of [ps,ls,rs])requireValue(Array.isArray(list)&&list.length<=10000&&list.every(x=>x&&ident(x.id))&&new Set(list.map(x=>x.id)).size===list.length,"Ошибка реестра Rental");
    requireValue(ps.every(p=>label(p.name)&&label(p.region)&&optional(p.contact,240)&&optional(p.notes,1500)&&(p.memberId===undefined||member(p.memberId))),"Ошибка профиля партнёра");
    requireValue(new Set(ps.filter(p=>p.memberId).map(p=>p.memberId)).size===ps.filter(p=>p.memberId).length,"У участника уже есть профиль проката");
    requireValue(ls.every(l=>ps.some(p=>p.id===l.partnerId)&&label(l.title)&&rentalKinds.includes(l.kind)&&validMoney(l.dailyCents)&&l.dailyCents>0&&l.dailyCents<=1000000000&&optional(l.notes,1500)),"Ошибка предложения аренды");
    const occupied=[],refs=new Set();
    for(const r of rs){const l=ls.find(x=>x.id===r.listingId);requireValue(l&&l.partnerId===r.partnerId&&member(r.renterId)&&rentalProvider(d,r.partnerId)!==r.renterId&&(r.brokerId===null||member(r.brokerId)&&r.brokerId!==r.renterId&&r.brokerId!==rentalProvider(d,r.partnerId))&&(r.caseId===null||d.cases.some(c=>c.id===r.caseId))&&cashDate(r.start)&&cashDate(r.end)&&rentalDays(r.start,r.end)>=1&&rentalDays(r.start,r.end)<=365&&validMoney(r.dailyCents)&&r.dailyCents>0&&r.dailyCents===l.dailyCents&&["requested","confirmed","returned","settled","cancelled"].includes(r.status),"Ошибка сделки Rental");
      if(["confirmed","returned","settled"].includes(r.status)){requireValue(!occupied.some(x=>x.listingId===r.listingId&&x.start<=r.end&&r.start<=x.end),"Пересечение подтверждённых аренд");occupied.push(r)}
      if(r.status==="settled"){const q=rentalQuote(r);requireValue(cashDate(r.paidDate)&&r.paidDate>=r.end&&label(r.ref)&&validMoney(r.costCents)&&r.costCents<=q.fee&&!refs.has(r.ref.trim().toLowerCase()),"Ошибка расчёта Rental");refs.add(r.ref.trim().toLowerCase())}else requireValue(r.ref===undefined&&r.costCents===undefined&&r.paidDate===undefined,"Незакрытая аренда не может начислять Merit");
    }
  }


  // Network and operations share the workspace graph. Media bytes remain in their own store.
  function caseRelations(d,id){
    const c=d.cases.find(x=>x.id===id);if(!c)return null;
    const shards=d.shards.filter(s=>s.caseId===id),ids=new Set(shards.map(s=>s.id)),tasks=d.tasks.filter(t=>ids.has(t.shardId)),moves=d.moves.filter(m=>ids.has(m.shardId)),rentals=(d.rentals||[]).filter(r=>r.caseId===id),posts=(d.network?.posts||[]).filter(p=>p.caseId===id),deals=(d.network?.deals||[]).filter(x=>x.caseId===id),members=new Set([ownerOf(d,c)]);
    for(const s of shards){if(s.assignee)members.add(s.assignee);for(const x of sharesFor(s))members.add(x.memberId);const team=d.teams.find(t=>t.id===s.teamId);for(const m of team?.memberIds||[])members.add(m)}
    for(const t of tasks)if(t.assignee)members.add(t.assignee);
    const stock=new Map();for(const m of moves){const key=JSON.stringify([m.itemId,m.shardId,m.recipientId||null]);const x=stock.get(key)||{itemId:m.itemId,shardId:m.shardId,recipientId:m.recipientId||null,qty:0};x.qty+=m.type==="issue"?m.qty:m.type==="return"?-m.qty:0;stock.set(key,x)}
    return {case:c,shards,tasks,moves,rentals,posts,deals,memberIds:[...members].filter(Boolean),stock:[...stock.values()].filter(x=>x.qty!==0),finance:financialCase(d,id),cash:(d.cashLedger||[]).filter(e=>e.caseId===id)};
  }
  function normalizeNetwork(d,n){
    const validCase=id=>d.cases.some(c=>c.id===id)?id:null;
    const posts=(n?.posts||[]).map(p=>({...p,kind:p.kind||"post",caseId:validCase(p.caseId),likes:p.likes||[],comments:p.comments||[]}));
    const deals=(n?.deals||[]).map(x=>({...x,caseId:validCase(x.caseId)||validCase("network-"+x.id)}));
    return {posts,deals};
  }
  function validateNetwork(d){
    if(d.network===undefined)return;const n=d.network,hasCase=id=>id===null||d.cases.some(c=>c.id===id);
    requireValue(n&&Array.isArray(n.posts)&&Array.isArray(n.deals)&&n.posts.length<=20000&&n.deals.length<=10000,"Ошибка Network");
    for(const list of [n.posts,n.deals])requireValue(list.every(x=>x&&ident(x.id))&&new Set(list.map(x=>x.id)).size===list.length,"Повторный ID Network");
    requireValue(n.posts.every(p=>ident(p.author)&&typeof p.text==="string"&&p.text.length<=1200&&p.text.trim()&&typeof p.created==="string"&&["post","video","offer","available"].includes(p.kind)&&hasCase(p.caseId)&&Array.isArray(p.likes)&&Array.isArray(p.comments)&&p.comments.every(c=>c&&ident(c.author)&&typeof c.text==="string"&&c.text.length<=500)&&(!["offer","available"].includes(p.kind)||(label(p.title)&&label(p.region)&&amount(p.budget)))),"Ошибка публикации Network");
    requireValue(n.deals.every(x=>ident(x.postId)&&label(x.title)&&label(x.region)&&amount(x.budget)&&typeof x.terms==="string"&&x.terms.length<=4000&&hasCase(x.caseId)),"Ошибка сделки Network");
    const linked=n.deals.filter(x=>x.caseId).map(x=>x.caseId);requireValue(new Set(linked).size===linked.length,"Case уже связан со сделкой");
  }

  function validate(d) {
    requireValue(d && d.version === 2 && ["cases","shards","crew","garage","moves","tasks","teams","counterparties"].every(k => Array.isArray(d[k])), "Неверная версия или структура");
    for (const list of [d.cases,d.shards,d.tasks,d.crew,d.garage,d.moves,d.teams,d.counterparties]) {
      requireValue(list.every(x => x && ident(x.id)) && new Set(list.map(x=>x.id)).size === list.length,"Ошибка идентификаторов");
    }
    const has = (list,id) => list.some(x=>x.id===id);
    const cash=d.cashLedger??[];
    requireValue(Array.isArray(cash)&&cash.length<=20000&&new Set(cash.map(e=>e?.id)).size===cash.length&&cash.every(e=>e&&ident(e.id)&&has(d.crew,e.memberId)&&(e.caseId===null||has(d.cases,e.caseId))&&Object.hasOwn(cashCategories,e.direction)&&cashCategories[e.direction].includes(e.category)&&Number.isSafeInteger(e.cents)&&e.cents>0&&e.cents<=100000000000&&cashDate(e.date)&&typeof e.note==="string"&&e.note.length<=500&&(e.voided===undefined||typeof e.voided==="boolean")),"Ошибка денежного журнала");
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
    validateFinance(d);
    validateRental(d);
    validateNetwork(d);
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
        allowed(s && s.status==="draft"&&ownsCase(d,s.caseId));
        const team=d.teams.find(t=>t.id===p.teamId);
        allowed(team && team.captainId!==actor.id);
        const c=d.cases.find(x=>x.id===s.caseId);financePlanEditable(d,c);delete s.shares;delete s.organizerId;
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
      case "cash-add": {
        requireValue(p.caseId===null||has(d.cases,p.caseId),"Выберите существующий объект");
        requireValue(Object.hasOwn(cashCategories,p.direction)&&cashCategories[p.direction].includes(p.category),"Выберите категорию операции");
        requireValue(Number.isSafeInteger(p.cents)&&p.cents>0&&p.cents<=100000000000&&cashDate(p.date),"Проверьте сумму и дату");
        requireValue(typeof p.note==="string"&&p.note.length<=500,"Комментарий до 500 символов");
        d.cashLedger=[...(d.cashLedger||[]),{id:p.id,memberId:actor.id,caseId:p.caseId,direction:p.direction,category:p.category,cents:p.cents,date:p.date,note:p.note.trim()}];
        break;
      }
      case "cash-void": {
        const entry=(d.cashLedger||[]).find(e=>e.id===p.id);
        allowed(entry&&entry.memberId===actor.id&&!entry.voided);
        entry.voided=true;
        break;
      }
      case "network-save": {d.network=normalizeNetwork(d,p.network);const old=source.network?.deals||[];for(const x of old.filter(x=>x.caseId)){const y=d.network.deals.find(v=>v.id===x.id);requireValue(y&&y.caseId===x.caseId&&y.budget===x.budget&&y.terms===x.terms,"Связанная сделка уже зафиксирована в Case")}break}
      case "network-case": {const x=d.network?.deals.find(v=>v.id===p.dealId);requireValue(x&&!x.caseId,"Case уже создан или сделка не найдена");const id="network-"+x.id;requireValue(!has(d.cases,id),"Case уже существует");d.cases.push({id,economy:"free-v105",ownerId:actor.id,title:x.title,city:x.region,price:x.budget,address:"",notes:x.terms,files:[],counterpartyId:null});x.caseId=id;const post=d.network.posts.find(v=>v.id===x.postId);if(post&&!post.caseId)post.caseId=id;break}
      case "case": d.cases.push({id:p.id,economy:"free-v105",ownerId:actor.id,title:p.title,city:p.city,price:p.price,address:p.address||"",notes:p.notes||"",files:p.files||[],counterpartyId:p.counterpartyId||null}); break;
      case "finance-activate": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);requireValue(!c.fin&&c.price>0,"Финансовый план уже активен или бюджет нулевой");const f=financialCase(d,c.id);requireValue(f.ready,"Распределите весь бюджет по Shards и назначьте участвующих организаторов");requireValue(f.feeCovered,"Оставьте в Case сумму для оплаты комиссий Shards");c.economy="free-v105";c.fin={active:true,ownerId:actor.id,settled:false,receipts:[],payouts:[]};break}
      case "finance-convert": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);financeEditable(d,c);requireValue(c.fin&&c.economy!=="free-v105","Case уже бесплатный");delete c.fin;c.economy="free-v105";break}
      case "finance-deactivate": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);financeEditable(d,c);requireValue(c.fin&&c.economy==="free-v105","Нет активного бесплатного плана");delete c.fin;break}
      case "finance-receipt": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);requireValue(c.fin&&!c.fin.settled,"Активируйте финансовый план");const f=financialCase(d,c.id);requireValue(validMoney(p.cents)&&p.cents>0&&f.received+p.cents<=f.due&&cashDate(p.date)&&label(p.ref),"Проверьте сумму, дату и ссылку на оплату");requireValue(!c.fin.receipts.some(x=>x.id===p.id||x.ref.trim().toLowerCase()===p.ref.trim().toLowerCase()),"Платёж уже записан");requireValue(d.shards.filter(s=>s.caseId===c.id).every(s=>s.assignee),"Сначала назначьте ответственных за все Shards");c.fin.receipts.push({id:p.id,cents:p.cents,date:p.date,ref:p.ref.trim()});break}
      case "finance-settle": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);const f=financialCase(d,c.id);requireValue(f.active&&!f.settled&&f.fullyPaid&&f.allAccepted&&f.ready&&f.feeCovered&&f.rows.every(r=>r.memberId&&r.net>=0),"Нужны полная оплата, принятые Shards и покрытие комиссий");c.fin.settled=true;break}
      case "finance-payout": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);const f=financialCase(d,c.id),person=f.people.find(x=>x.memberId===p.memberId);requireValue(f.settled&&person&&person.available>0&&cashDate(p.date)&&label(p.ref),"Выплата недоступна или уже подтверждена");c.fin.payouts.push({memberId:p.memberId,cents:person.available,date:p.date,ref:p.ref.trim()});break}
      case "finance-case-budget": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);financePlanEditable(d,c);requireValue(!d.shards.some(s=>s.caseId===c.id&&s.status!=="draft"),"Нельзя менять бюджет после сдачи работ");requireValue(amount(p.price)&&p.price>0,"Проверьте бюджет");c.price=p.price;break}
      case "finance-shard-budget": {allowed(s&&s.status==="draft");const c=d.cases.find(x=>x.id===s.caseId);financeOwner(d,c,actor);financePlanEditable(d,c);requireValue(amount(p.price)&&p.price>=0,"Проверьте бюджет");s.price=p.price;delete s.shares;delete s.organizerId;break}
      case "finance-shares": {allowed(s&&s.status==="draft");const c=d.cases.find(x=>x.id===s.caseId);financeOwner(d,c,actor);financePlanEditable(d,c);requireValue(s.assignee&&Array.isArray(p.shares),"Назначьте ответственного");s.shares=p.shares;if(freeEconomy(c))s.organizerId=p.organizerId||s.assignee;break}
      case "finance-shard-cancel": {allowed(s&&s.status==="draft");const c=d.cases.find(x=>x.id===s.caseId);financeOwner(d,c,actor);financePlanEditable(d,c);requireValue(!d.moves.some(m=>m.shardId===s.id),"Сначала урегулируйте складские операции");requireValue(!d.tasks.some(t=>t.shardId===s.id&&t.status!=="todo"),"Нельзя отменить начатые задачи");d.tasks=d.tasks.filter(t=>t.shardId!==s.id);d.shards=d.shards.filter(x=>x.id!==s.id);break}
      case "finance-case-cancel": {const c=d.cases.find(x=>x.id===p.caseId);financeOwner(d,c,actor);financePlanEditable(d,c);requireValue(!d.shards.some(s=>s.caseId===c.id)&&!(d.cashLedger||[]).some(e=>e.caseId===c.id)&&!(d.rentals||[]).some(r=>r.caseId===c.id)&&!(d.network?.deals||[]).some(x=>x.caseId===c.id),"Case связан с работами, финансами или сделкой; удаление недоступно");if(d.network)for(const post of d.network.posts)if(post.caseId===c.id)post.caseId=null;d.cases=d.cases.filter(x=>x.id!==c.id);break}
      case "case-media": {
        allowed(ownsCase(d,p.caseId));
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(Array.isArray(p.files)&&p.files.length>0,"Выберите медиафайлы");
        c.files=[...(c.files||[]),...p.files];
        requireValue(c.files.length<=8,"Максимум 8 медиафайлов на Case");
        break;
      }
      case "pv-tech": {
        allowed(ownsCase(d,p.caseId));
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
        allowed(ownsCase(d,p.caseId));
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
        allowed(ownsCase(d,p.caseId));
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(["zones","strings","cuts","materials","documents"].includes(p.list),"Некорректный раздел PV");
        const cur=c.pvPlan||{};
        c.pvPlan={...cur,[p.list]:(cur[p.list]||[]).filter(x=>x.id!==p.rowId)};
        break;
      }
      case "pv-check": {
        allowed(ownsCase(d,p.caseId));
        const c=d.cases.find(x=>x.id===p.caseId);allowed(c);
        requireValue(pvChecks.includes(p.key)&&typeof p.value==="boolean","Неизвестный пункт проверки");
        const cur=c.pvPlan||{};
        c.pvPlan={...cur,checks:{...cur.checks,[p.key]:p.value}};
        break;
      }
      case "link-counterparty": {
        allowed(ownsCase(d,p.caseId));
        const project=d.cases.find(c=>c.id===p.caseId);
        allowed(project);
        requireValue(p.counterpartyId===null||has(d.counterparties,p.counterpartyId),"Неизвестный контрагент");
        project.counterpartyId=p.counterpartyId;
        break;
      }
      case "shard": {const c=d.cases.find(x=>x.id===p.caseId);financePlanEditable(d,c);financeOwner(d,c,actor);}
        requireValue(Math.round(100*p.price)+d.shards.filter(s=>s.caseId===p.caseId).reduce((n,s)=>n+Math.round(100*s.price),0)<=Math.round(100*(d.cases.find(c=>c.id===p.caseId)?.price||0)),"Shard превышает доступный бюджет Project"); d.shards.push({id:p.id,title:p.title,kind:p.kind,price:p.price,caseId:p.caseId,assignee:p.assignee||null,createdBy:actor.id,status:"draft",notes:p.notes||"",files:p.files||[]}); break;
      case "assign": allowed(s && s.status==="draft");financeOwner(d,d.cases.find(x=>x.id===s.caseId),actor); financePlanEditable(d,d.cases.find(x=>x.id===s.caseId)); s.assignee=p.assignee; s.teamId=null; delete s.shares; delete s.organizerId; break;
      case "task": {
        allowed(s && s.status==="draft" && (ownsCase(d,s.caseId)||s.assignee===actor.id));
        requireValue(label(p.title)&&optional(p.notes,2000),"Укажите название и описание задачи");
        d.tasks.push({id:p.id,shardId:s.id,title:p.title.trim(),notes:p.notes||"",status:"todo",assignee:p.assignee||null});
        break;
      }
      case "task-status": {
        const parent=t&&d.shards.find(sh=>sh.id===t.shardId);
        allowed(t && parent && parent.status==="draft" && (ownsCase(d,parent.caseId) || t.assignee===actor.id || (t.assignee===null&&parent.assignee===actor.id)));
        requireValue(["todo","doing","done"].includes(p.status),"Неизвестный статус задачи");
        t.status=p.status;
        break;
      }
      case "submit": allowed(s && s.status==="draft" && s.assignee===actor.id); requireValue(d.tasks.filter(t=>t.shardId===s.id).every(t=>t.status==="done"),"Завершите все задачи Shard перед приёмкой"); s.status="submitted"; break;
      case "accept": case "revise": allowed(s && s.status==="submitted" && actor.id!==s.assignee&&ownsCase(d,s.caseId)); s.status=action==="accept"?"accepted":"draft"; break;
      case "finance-self-accept": {allowed(s&&s.status==="submitted"&&s.assignee===actor.id);financeOwner(d,d.cases.find(x=>x.id===s.caseId),actor);s.status="accepted";s.selfAccepted=true;break}
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
        if(p.type==="issue"||p.type==="return")requireValue(typeof p.recipientId==="string"&&has(d.crew,p.recipientId),"Выберите получателя из участников компании");if(p.type==="issue")requireValue(caseRelations(d,s.caseId).memberIds.includes(p.recipientId),"Получатель должен участвовать в Case");
        if(["issue","writeoff"].includes(p.type))requireValue(item.qty>=p.qty,"Недостаточно материала на складе");
        if(p.type==="writeoff")requireValue(typeof p.reason==="string"&&p.reason.trim().length>=3&&p.reason.length<=300,"Укажите причину списания");
        if(p.type==="return"){
          const outstanding=d.moves.filter(m=>m.itemId===item.id&&m.shardId===s.id&&m.recipientId===p.recipientId).reduce((n,m)=>n+(m.type==="issue"?m.qty:m.type==="return"?-m.qty:0),0);
          requireValue(outstanding>=p.qty,"Возврат превышает выдачу этому участнику по Shard");
        }
        item.qty=Math.round((item.qty+(["issue","writeoff"].includes(p.type)?-p.qty:p.qty))*1e6)/1e6;
        d.moves.push({id:p.id,type:p.type,qty:p.qty,itemId:item.id,shardId:["receive","writeoff"].includes(p.type)?null:s.id,actor:actor.id,recipientId:["issue","return"].includes(p.type)?p.recipientId:null,reason:p.type==="writeoff"?p.reason.trim():""});
        break;
      }

      case "rental-partner": {const external=p.external===true;allowed(!external||lead);requireValue(label(p.name)&&label(p.region),"Укажите название и регион");if(!external)requireValue(!(d.rentalPartners||[]).some(x=>x.memberId===actor.id),"У вас уже есть профиль аренды");d.rentalPartners=[...(d.rentalPartners||[]),{id:p.id,...(external?{}:{memberId:actor.id}),name:p.name.trim(),region:p.region.trim(),contact:String(p.contact||"").trim(),notes:String(p.notes||"").trim()}];break}
      case "rental-listing": {allowed(managesRental(d,p.partnerId,actor.id));d.rentalListings=[...(d.rentalListings||[]),{id:p.id,partnerId:p.partnerId,title:p.title,kind:p.kind,dailyCents:p.dailyCents,notes:String(p.notes||"")}];break}
      case "rental-request": {const l=(d.rentalListings||[]).find(x=>x.id===p.listingId);requireValue(l,"Предложение не найдено");requireValue(rentalProvider(d,l.partnerId)!==actor.id,"Нельзя арендовать собственное оборудование");d.rentals=[...(d.rentals||[]),{id:p.id,listingId:l.id,partnerId:l.partnerId,renterId:actor.id,brokerId:p.brokerId||null,caseId:p.caseId||null,start:p.start,end:p.end,dailyCents:l.dailyCents,status:"requested"}];break}
      case "rental-confirm": case "rental-return": case "rental-cancel": {const r=(d.rentals||[]).find(x=>x.id===p.id);allowed(r&&(managesRental(d,r.partnerId,actor.id)||(action==="rental-cancel"&&r.renterId===actor.id&&r.status==="requested")));if(action==="rental-confirm"){requireValue(r.status==="requested","Неверный статус");r.status="confirmed"}else if(action==="rental-return"){requireValue(r.status==="confirmed"&&cashDate(p.date)&&p.date>=r.end,"Подтвердите возврат после окончания аренды");r.status="returned"}else{requireValue(["requested","confirmed"].includes(r.status),"Закрытую аренду отменить нельзя");r.status="cancelled"}break}
      case "rental-settle": {const r=(d.rentals||[]).find(x=>x.id===p.id);allowed(r&&managesRental(d,r.partnerId,actor.id));requireValue(r.status==="returned","Сначала подтвердите возврат");requireValue(p.paidCents===rentalQuote(r).gross,"Подтвердите полную оплату аренды");r.status="settled";r.costCents=p.costCents;r.paidDate=p.date;r.ref=String(p.ref||"").trim();break}

      default: throw Error("Неизвестная операция");
    }
    return validate(d);
  }
  return {roles,migrate,validate,apply,financialCase,financialMember,sharesFor,classes,cents,meritShard,organizerOf,rentalKinds,rentalQuote,rentalCapital,rentalProvider,managesRental,ownsCase,caseRelations,normalizeNetwork};
})();
