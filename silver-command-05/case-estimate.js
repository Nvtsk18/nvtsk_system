/* A portable planning sheet uses the existing Case notes field and travels with its JSON export. */
const CaseEstimate = (() => {
  "use strict";
  const marker = "\n\n[Смета NVTSK v1]\n";
  const costs = {materials:"Материалы", transport:"Транспорт", overhead:"Операционные расходы", reserve:"Резерв"};
  function check(ok, message) { if (!ok) throw Error(message); }
  const text = (v, max=100) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const decimal = (v, max) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max &&
    Math.abs(v * 100 - Math.round(v * 100)) < 0.00001;
  const cents = v => Math.round(v * 100);
  const laborCents = r => Math.round(cents(r.hours) * cents(r.rate) / 100);
  function validate(plan) {
    check(plan && Array.isArray(plan.labor) && plan.labor.length > 0 && plan.labor.length <= 20, "Проверьте состав сметы.");
    const ids = new Set();
    for (const row of plan.labor) {
      check(row && typeof row.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(row.id) && !ids.has(row.id) &&
        decimal(row.hours, 5000) && decimal(row.rate, 10000), "Проверьте участника, часы и ставку.");
      ids.add(row.id);
    }
    check(plan.costs && Object.keys(costs).every(k => decimal(plan.costs[k], 10000000)), "Проверьте суммы расходов.");
    return plan;
  }
  function read(notes="") {
    const at = notes.lastIndexOf(marker);
    if (at >= 0) {
      try { return {description:notes.slice(0,at), plan:validate(JSON.parse(notes.slice(at+marker.length)))}; } catch {}
    }
    return {description:notes,plan:null};
  }
  function write(description, plan) {
    const notes = description + marker + JSON.stringify(validate(plan));
    check(notes.length <= 4000, "Сократите описание или состав сметы.");
    return notes;
  }
  function totals(revenue, plan) {
    const pay=plan.labor.reduce((total,r)=>total+laborCents(r),0);
    const other=Object.keys(costs).reduce((total,k)=>total+cents(plan.costs[k]),0);
    const sales=cents(revenue), margin=sales-pay-other;
    return {pay,other,margin,percent:sales?100*margin/sales:null};
  }
  function starter(input) {
    check(input?.format==="nvtsk-company-starter" && input.version===1, "Выберите файл приглашения NVTSK версии 1.");
    check(text(input.company) && text(input.owner) && text(input.trade,80) && Array.isArray(input.workers) &&
      input.workers.length>=1 && input.workers.length<=8 && input.workers.every(v=>text(v)) &&
      new Set(input.workers).size===input.workers.length, "Проверьте компанию и состав бригады.");
    check(Array.isArray(input.projects) && input.projects.length>=1 && input.projects.length<=12,"Проверьте список объектов.");
    for (const p of input.projects) {
      check(p && text(p.title) && text(p.scope,350) && decimal(p.revenue,10000000) && p.revenue>0 &&
        Array.isArray(p.labor) && p.labor.length===input.workers.length,"Проверьте объекты и цену работ.");
      const sheet = toPlan(p);
      validate(sheet);
      check(sheet.labor.every(r=>laborCents(r)>0) && totals(p.revenue,sheet).pay<=cents(p.revenue), "Бюджет Case должен покрывать начальное назначение бригады.");
    }
    return input;
  }
  function toPlan(p) {
    return {labor:p.labor.map((r,i)=>({id:"crew-"+(i+1),hours:r.hours,rate:r.rate})),
      costs:Object.fromEntries(Object.keys(costs).map(k=>[k,p.costs?.[k]]))};
  }
  function seed(input, roles) {
    const pack=starter(input), crew=[{id:"lead",name:pack.owner,company:pack.company,headline:"Руководитель · "+pack.trade,role:roles[0]},
      ...pack.workers.map((name,i)=>({id:"crew-"+(i+1),name,role:roles[1],company:pack.company,headline:pack.trade}))];
    const members=crew.slice(1).map(c=>c.id);
    let state=NVModel.validate({version:2,personalProfile:true,actor:"lead",crew,teams:[],cases:[],shards:[],tasks:[],garage:[],moves:[],counterparties:[],network:{posts:[],deals:[]}});
    const apply=(type,payload)=>{state=NVModel.apply(state,type,payload)};
    apply("team-create",{id:"installation-crew",title:pack.company+" · монтажная бригада",captainId:members[0],memberIds:members});
    pack.projects.forEach((p,i)=>{
      const plan=toPlan(p),caseId="site-"+(i+1),shardId=caseId+"-work";
      apply("case",{id:caseId,title:p.title,price:p.revenue,city:"Адрес предстоит уточнить",notes:write(p.scope,plan)});
      apply("shard",{id:shardId,caseId,title:pack.trade+" · монтажная бригада",kind:pack.trade,price:totals(p.revenue,plan).pay/100,assignee:members[0]});
      apply("team-assign",{shardId,teamId:"installation-crew"});
      apply("finance-shares",{shardId,organizerId:members[0],shares:plan.labor.map((r,j)=>({memberId:r.id,cents:laborCents(r),className:j?"PRO":"LEAD"}))});
      members.forEach((id,j)=>apply("task",{id:shardId+"-task-"+j,shardId,assignee:id,title:"Монтажные работы · "+pack.workers[j]}));
    });
    return state;
  }
  return Object.freeze({costs,read,write,totals,starter,seed,laborCents});
})();
if (typeof module === "object" && module.exports) module.exports = CaseEstimate;
