/* NVTSK | PV Project Dossier v62.
 * Generic data structures derived from montage plan layouts and public engineering practices.
 * No private homeowner data, PDF contents, or contact addresses are bundled into this public app.
 */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n===null||n===undefined||n===""?"—":Number(n).toLocaleString("de-DE",{maximumFractionDigits:2});
const value=(v,suffix="")=>v===undefined||v===null||v===""?"—":esc(v)+(suffix?" "+suffix:"");
const planChecks=[
 ["risk","Gefährdungsbeurteilung","Оценка рисков на объекте"],
 ["access","Zugang / Gerüst","Безопасный доступ и допуск к лесам"],
 ["fall","Absturzsicherung","Защита от падения / Durchsturz"],
 ["static","Statik / Dachprüfung","Подтверждение несущей способности и конструкции"],
 ["materials","Materialprüfung","Сверка количества материалов"],
 ["strings","DC-Stringplan","Проверка распределения модулей и строк"],
 ["dcTests","DC-Messungen","Протокол DC-измерений"],
 ["photos","Fotodokumentation","Фото монтажа и скрытых работ"],
 ["handover","Übergabe / Abnahme","Передача на приёмку"]
];
function infoRow(label,txt){return '<div class="pv-fact"><small>'+esc(label)+'</small><strong>'+esc(txt??"—")+'</strong></div>'}
function techValue(v,unit){return v===null||v===undefined||v===""?"—":fmt(v)+(unit?" "+unit:"")}
function conflicts(p){
 const issues=[];
 if(p.declaredModules!==null&&p.declaredModules!==undefined){
  const present=(p.zones||[]).filter(z=>Number.isFinite(z.modules));
  if(present.length){
   const found=present.reduce((n,z)=>n+z.modules,0);
   if(found!==p.declaredModules)issues.push({level:"danger",title:"Количество модулей не сходится",text:"Anlagenübersicht: "+p.declaredModules+" · Modulfläche/String: "+found+". Нужна проверка актуальной ревизии."});
  }
 }
 if((p.strings||[]).length){
  const actual=(p.strings||[]).filter(t=>Number.isFinite(t.modules));
  const sum=actual.reduce((v,t)=>v+t.modules,0);
  if(p.declaredModules!==null&&p.declaredModules!==undefined&&actual.length===(p.strings||[]).length&&sum!==p.declaredModules)
   issues.push({level:"warning",title:"Anlagenübersicht и DC Strings не совпадают",text:"Модулей в паспорте: "+p.declaredModules+" · в строках/группах: "+sum+". Проверьте, не объединены ли строки в одну Modulfläche/String."});
  const fields=(p.zones||[]).filter(z=>Number.isFinite(z.modules));
  if(fields.length&&fields.length===(p.zones||[]).length&&actual.length===(p.strings||[]).length){
    const fieldTotal=fields.reduce((v,z)=>v+z.modules,0);
    if(fieldTotal!==sum)issues.push({level:"warning",title:"Modulflächen и Strings не совпадают",text:"Монтажные поля: "+fieldTotal+" · DC Strings: "+sum+". Не подменяйте электрическую разбивку монтажными зонами."});
  }
 }
 for(const cut of p.cuts||[])if(Number.isFinite(cut.stockLengthMm)&&Number.isFinite(cut.requiredLengthMm)&&cut.requiredLengthMm>cut.stockLengthMm)
  issues.push({level:"warning",title:"Длина профиля превышает заготовку",text:cut.name+": нужно "+fmt(cut.requiredLengthMm)+" мм, заготовка "+fmt(cut.stockLengthMm)+" мм. Требуется проверенный способ соединения и раскрой."});
 if(p.declaredModules>0&&p.panelWp>0&&p.declaredKwp>0){
  const got=p.declaredModules*p.panelWp/1000;
  if(Math.abs(got-p.declaredKwp)>0.025)issues.push({level:"warning",title:"Не совпадает Anlagenleistung",text:p.declaredModules+" × "+p.panelWp+" Wp = "+fmt(got)+" kWp, в документе указано "+fmt(p.declaredKwp)+" kWp."});
 }
 if(!p.sourcePlan&&!p.model3d&&!(p.documents||[]).length)issues.push({level:"info",title:"Нет ссылки на актуальный монтажный план",text:"Добавьте ссылку на PDF, 3D-Modell или запись о версии документа, прежде чем начинать монтаж."});
 if(!(p.zones||[]).length)issues.push({level:"info",title:"Modulflächen ещё не внесены",text:"Распределите модули по зонам / Stringplan, чтобы система могла сравнить количества."});
 return issues;
}
function render(c,state,canEdit){
 const p=c.pvPlan||{},zones=p.zones||[],strings=p.strings||[],cuts=p.cuts||[],materials=p.materials||[],documents=p.documents||[],checks=p.checks||{};
 const w=conflicts(p),complete=planChecks.filter(x=>checks[x[0]]).length;
 const relevant=state.shards.filter(sh=>sh.caseId===c.id);
 const allocated=relevant.reduce((n,sh)=>n+Number(sh.price||0),0);
 const accepted=relevant.filter(sh=>sh.status==="accepted").reduce((n,sh)=>n+Number(sh.price||0),0);
 const hasTech=Boolean(p.sourcePlan||p.declaredModules!==undefined||zones.length||strings.length||cuts.length||materials.length||documents.length);
 const nav=[["pv-overview","Сводка"],["pv-roof","Крыша"],["pv-fields","Modulflächen"],["pv-strings","DC Strings"],["pv-cuts","Раскрой"],["pv-bom","Материалы"],["pv-docs","Документы"],["pv-checks","Контроль"],["pv-money","Финансы"]];
 const heading='<section class="pv-cockpit"><div class="pv-cockpit-hero"><div><small>PROJECT DOSSIER · SOLAN PLUS</small><h2>Управление монтажом PV</h2><p>Источник: Montageplanung · Modulfläche/String · Materialliste · DC Formular</p></div><div class="pv-cockpit-score"><strong>'+complete+' / '+planChecks.length+'</strong><span>отмечено пунктов</span></div></div>'+
 '<nav class="pv-cockpit-nav" aria-label="Разделы карточки PV">'+nav.map(([id,label])=>'<button type="button" data-pv-target="'+id+'">'+label+'</button>').join("")+'</nav></section>';
 const warnings='<section id="pv-overview" class="pv-block pv-preflight"><div class="pv-section-heading"><div><small>ENGINEERING PRE-FLIGHT</small><h3>Проверка комплекта документации</h3></div><span class="pv-counter '+(w.some(x=>x.level==="danger")?"pv-counter-danger":"")+'">'+(w.length?w.length+" замечаний":"Расхождений в заполненных полях нет")+'</span></div>'+
 (w.map(x=>'<div class="pv-issue pv-'+x.level+'"><strong>'+esc(x.title)+'</strong><p>'+esc(x.text)+'</p></div>').join("")||'<p class="pv-info">Автоматические проверки заполненных чисел пройдены. Это не заменяет проверку проекта инженером и осмотр объекта.</p>')+
 '<p class="pv-qualification">Внимание: автоматические совпадения чисел не подтверждают безопасность креплений, электрическую пригодность или корректность всех чертежей.</p></section>';
 const facts='<section id="pv-roof" class="pv-block"><div class="pv-section-heading"><div><small>BAUSTELLE · DACHAUFBAU</small><h3>Паспорт объекта</h3></div>'+(canEdit?'<button data-action="pv-tech" data-id="'+esc(c.id)+'">Редактировать</button>':"")+'</div>'+
 '<div class="pv-facts">'+infoRow("Bauherr",p.bauherr||"Не указан")+infoRow("PDF / Revision",p.sourcePlan||"Не указана")+
 infoRow("Модулей, Anlagenübersicht",techValue(p.declaredModules,"St."))+infoRow("Anlagenleistung",techValue(p.declaredKwp,"kWp"))+
 infoRow("Модуль",p.moduleType||"—")+infoRow("Modulleistung",techValue(p.panelWp,"Wp"))+
 infoRow("Dacheindeckung",p.roofType||"—")+infoRow("Ziegel / Material",p.tileType||"—")+
 infoRow("Dachneigung",techValue(p.slopeDeg,"°"))+infoRow("Höhe Traufe",techValue(p.eaveHeightM,"m"))+
 infoRow("Höhe in Schräge",techValue(p.roofLengthM,"m"))+infoRow("Sparrenabstand",techValue(p.rafterSpacingCm,"cm"))+
 infoRow("Aufdachdämmung",p.insulation||"—")+infoRow("Unterkonstruktion",p.mounting||"—")+
 infoRow("Leitungsführung",p.cableRoute||"—")+infoRow("AC Zuständigkeit",p.acScope||"—")+
 '</div>'+((p.hazards||p.safetyPlan)?'<div class="pv-roof-notes"><strong>Особенности объекта и Sicherheit</strong><p>'+esc(p.hazards||"")+'</p><p>'+esc(p.safetyPlan||"")+'</p></div>':"")+'</section>';
 const zoneList=zones.map((z,i)=>'<div class="pv-zone"><div class="pv-zone-number">'+(i+1)+'</div><div><strong>'+esc(z.name)+'</strong><small>'+esc(z.direction||"Ориентация не указана")+'</small><p>'+esc(z.moduleType||p.moduleType||"")+(z.roofType?" · Dach: "+esc(z.roofType):"")+(z.mounting?" · UK: "+esc(z.mounting):"")+(z.panelWp?" · "+fmt(z.panelWp)+" Wp":"")+(z.notes?" · "+esc(z.notes):"")+'</p></div><div class="pv-zone-metrics"><b>'+techValue(z.modules)+" мод.</b><small>"+techValue(z.hooks)+" Haken</small></div>"+(canEdit?'<button class="pv-icon-button" data-action="pv-remove" data-id="'+esc(c.id)+'" data-list="zones" data-row="'+esc(z.id)+'" aria-label="Удалить зону">×</button>':"")+'</div>').join("");
 const areas='<section id="pv-fields" class="pv-block"><div class="pv-section-heading"><div><small>MODULFLÄCHE / STRINGPLAN</small><h3>Монтажные зоны</h3></div>'+(canEdit?'<button data-action="pv-zone" data-id="'+esc(c.id)+'">＋ Зона</button>':"")+'</div><p class="pv-subtitle">Здесь фиксируются физические участки крыши. Электрические Strings указываются отдельно, чтобы не смешивать две разные схемы.</p><div class="pv-zone-list">'+(zoneList||'<div class="pv-empty">Зоны из PDF пока не внесены. Добавьте каждую Modulfläche/String отдельно.</div>')+'</div></section>';

 const electrical='<section id="pv-strings" class="pv-block"><div class="pv-section-heading"><div><small>STRINGPLAN · ELEKTRISCHE ZUORDNUNG</small><h3>DC Strings и группы</h3></div>'+(canEdit?'<button data-action="pv-string" data-id="'+esc(c.id)+'">＋ String</button>':"")+'</div>'+
 '<p class="pv-subtitle">Одна запись — электрическая строка или явно обозначенная группа из исходного PDF. Не принимайте подпись «Modulfläche/String» за доказательство одной строки.</p>'+
 '<div class="pv-zone-list">'+(strings.map((t,i)=>'<div class="pv-zone"><div class="pv-zone-number">DC</div><div><strong>'+esc(t.name)+'</strong><small>'+esc(t.direction||"Аusrichtung не указана")+'</small><p>'+esc(t.mppt?"MPPT: "+t.mppt:"MPPT не указан")+(t.notes?" · "+esc(t.notes):"")+'</p></div><div class="pv-zone-metrics"><b>'+techValue(t.modules)+' мод.</b></div>'+(canEdit?'<button class="pv-icon-button" data-action="pv-remove" data-id="'+esc(c.id)+'" data-list="strings" data-row="'+esc(t.id)+'" aria-label="Удалить String">×</button>':"")+'</div>').join("")||'<div class="pv-empty">Добавьте DC Stringplan по электропроекту. Названия из PDF могут объединять несколько строк, поэтому вводите количество только при подтверждении.</div>')+'</div></section>';
 const cutting='<section id="pv-cuts" class="pv-block"><div class="pv-section-heading"><div><small>SCHIENENZUSCHNITT · MONTAGE</small><h3>Раскрой шин</h3></div>'+(canEdit?'<button data-action="pv-cut" data-id="'+esc(c.id)+'">＋ Отрезок</button>':"")+'</div>'+
 '<p class="pv-subtitle">Фактические длины из монтажных чертежей — в миллиметрах. Сравнение с исходной заготовкой не заменяет статическую проверку соединений.</p>'+
 '<div class="pv-cut-list">'+(cuts.map(t=>{const remaining=Number.isFinite(t.stockLengthMm)&&Number.isFinite(t.requiredLengthMm)?t.stockLengthMm-t.requiredLengthMm:null;return '<div class="pv-cut"><div><strong>'+esc(t.name)+'</strong><small>'+esc(t.notes||"")+'</small></div><span><b>'+techValue(t.requiredLengthMm)+' мм</b><small>из '+techValue(t.stockLengthMm)+' мм · '+techValue(t.qty)+' шт.</small></span><em class="'+(remaining!==null&&remaining<0?"is-short":"")+'">'+(remaining===null?"Без расчёта":remaining<0?"Не хватает "+fmt(-remaining)+" мм":"Остаток "+fmt(remaining)+" мм")+'</em>'+(canEdit?'<button class="pv-icon-button" data-action="pv-remove" data-id="'+esc(c.id)+'" data-list="cuts" data-row="'+esc(t.id)+'" aria-label="Удалить отрезок">×</button>':"")+'</div>'}).join("")||'<div class="pv-empty">Раскрой не указан. В проектных PDF бывают отдельные схемы резки C-N-Schiene и Einlegeschiene — вносите их поштучно.</div>')+'</div></section>';
 const bom='<section id="pv-bom" class="pv-block"><div class="pv-section-heading"><div><small>UK · MATERIALBEDARF</small><h3>Ведомость материалов</h3></div>'+(canEdit?'<button data-action="pv-material" data-id="'+esc(c.id)+'">＋ Позиция</button>':"")+'</div><div class="pv-materials">'+(materials.map(m=>'<div class="pv-material"><span><strong>'+esc(m.name)+'</strong><small>'+esc(m.sku||"Без артикула")+'</small></span><b>'+techValue(m.qty)+" "+esc(m.unit||"St.")+'</b>'+(canEdit?'<button class="pv-icon-button" data-action="pv-remove" data-id="'+esc(c.id)+'" data-list="materials" data-row="'+esc(m.id)+'" aria-label="Удалить позицию">×</button>':"")+'</div>').join("")||'<div class="pv-empty">Плановая Stückliste пока не внесена. Указывайте элементы отдельно: Haken, Schienen, Verbinder, Nistschutz, Ballast.</div>')+'</div><p class="pv-footnote">Плановые количества не являются складскими остатками. Фактические выдачи учитываются через Garage и привязанные Shards.</p></section>';
 const safeHref=url=>typeof url==="string"&&/^https:\/\/[^\s"'<>]+$/.test(url)?url:"";
 const docs='<section id="pv-docs" class="pv-block"><div class="pv-section-heading"><div><small>DOKUMENTATION · REVISIONEN</small><h3>Чертежи и ссылки</h3></div>'+(canEdit?'<button data-action="pv-document" data-id="'+esc(c.id)+'">＋ Документ</button>':"")+'</div>'+
 (p.model3d&&safeHref(p.model3d)?'<a class="pv-drawing" href="'+esc(p.model3d)+'" target="_blank" rel="noopener noreferrer">Открыть 3D-Modell ↗</a>':"")+
 '<div class="pv-document-list">'+(documents.map(d=>'<div class="pv-document"><div><strong>'+esc(d.name)+'</strong><small>'+esc(d.kind||"PDF")+(d.revision?" · Revision "+esc(d.revision):"")+'</small></div>'+(safeHref(d.url)?'<a href="'+esc(d.url)+'" target="_blank" rel="noopener noreferrer">Открыть ↗</a>':'<span>Ссылка не задана</span>')+(canEdit?'<button class="pv-icon-button" data-action="pv-remove" data-id="'+esc(c.id)+'" data-list="documents" data-row="'+esc(d.id)+'" aria-label="Удалить ссылку">×</button>':"")+'</div>').join("")||'<div class="pv-empty">Здесь будут Bauplan, Belegungsplan, Stringplan, Materialliste, DC Formular и версии изменений.</div>')+'</div>'+
 '<p class="pv-footnote">В Local First сохраняются ссылки и метаданные документов, не сами большие PDF. Не размещайте персональные документы заказчиков в публичном репозитории.</p></section>';
 const safety='<section id="pv-checks" class="pv-block"><div class="pv-section-heading"><div><small>SAFETY · DC ABNAHME</small><h3>Контроль и приёмка</h3></div><span class="pv-counter">'+complete+"/"+planChecks.length+'</span></div>'+
 '<div class="pv-checklist">'+planChecks.map(([key,title,note])=>'<button type="button" class="pv-check'+(checks[key]?" is-done":"")+'" data-action="pv-check" data-id="'+esc(c.id)+'" data-check="'+key+'" '+(!canEdit?'disabled':'')+' aria-pressed="'+!!checks[key]+'"><span class="pv-checkmark">'+(checks[key]?"✓":"○")+'</span><span><strong>'+title+'</strong><small>'+note+'</small></span></button>').join("")+'</div>'+
 '<p class="pv-footnote">Эти отметки фиксируют рабочий статус в NVTSK. Они не создают юридически действующую Gefährdungsbeurteilung, Messprotokoll или Abnahmeprotokoll. Оригинальные документы и подписи должны храниться отдельно.</p></section>';
 const finance='<section id="pv-money" class="pv-block"><div class="pv-section-heading"><div><small>PROJECT CONTROLLING</small><h3>Управление бюджетом</h3></div></div><div class="pv-finance"><div><small>Бюджет Project</small><strong>'+fmt(c.price)+' €</strong></div><div><small>Распределено на Shards</small><strong>'+fmt(allocated)+' €</strong></div><div><small>Стоимость принятых работ</small><strong>'+fmt(accepted)+' €</strong></div><div><small>Нераспределённый бюджет</small><strong>'+fmt(Math.max(0,c.price-allocated))+' €</strong></div></div><p class="pv-footnote">Это плановый и операционный учёт. Счета, фактическое поступление оплаты и выплаты ещё требуют отдельного финансового журнала. Merit создаётся на уровне Project, Shard только распределяет существующий объём.</p></section>';
 return heading+warnings+facts+areas+electrical+cutting+bom+docs+safety+finance;
}
const field=(label,name,val,max=200)=>'<label>'+esc(label)+'<input name="'+name+'" maxlength="'+max+'" value="'+esc(val??"")+'"></label>';
const num=(label,name,val,step="1")=>'<label>'+esc(label)+'<input name="'+name+'" type="number" min="0" step="'+step+'" value="'+esc(val??"")+'"></label>';
const area=(label,name,val,max=1000)=>'<label>'+esc(label)+'<textarea name="'+name+'" maxlength="'+max+'" rows="3">'+esc(val??"")+'</textarea></label>';
function form(kind,c){
 const p=c?.pvPlan||{};
 if(kind==="pv-tech")return '<p class="hint">Поля повторяют структуру монтажного PDF; не придумывайте недостающие значения.</p>'+
 field("Bauherr (если нужен)","bauherr",p.bauherr)+field("Номер/ревизия PDF","sourcePlan",p.sourcePlan)+field("Ревизия","revision",p.revision)+
 num("Всего модулей по Anlagenübersicht","declaredModules",p.declaredModules)+num("Мощность Anlagenleistung, kWp","declaredKwp",p.declaredKwp,"0.01")+
 field("Modul-Typ","moduleType",p.moduleType)+num("Modulleistung, Wp","panelWp",p.panelWp)+field("Dacheindeckung","roofType",p.roofType)+
 field("Ziegel Typ / Материал крыши","tileType",p.tileType)+num("Dachneigung, °","slopeDeg",p.slopeDeg,"0.1")+
 num("Höhe Traufe, m","eaveHeightM",p.eaveHeightM,"0.01")+num("Höhe in Schräge, m","roofLengthM",p.roofLengthM,"0.01")+
 num("Sparrenabstand, cm","rafterSpacingCm",p.rafterSpacingCm,"0.1")+field("Aufdachdämmung","insulation",p.insulation)+
 field("UK / Einlegesystem","mounting",p.mounting)+field("3D-Modell HTTPS","model3d",p.model3d,500)+
 field("Leitungsführung","cableRoute",p.cableRoute,500)+field("Наш scope DC","dcScope",p.dcScope,500)+
 field("AC / Elektro — другая сторона","acScope",p.acScope,500)+area("Критические монтажные особенности","hazards",p.hazards,2000)+
 area("План безопасного доступа и работы","safetyPlan",p.safetyPlan,2000);
 if(kind==="pv-zone")return field("Modulfläche/String — название","name","")+field("Ausrichtung (SW, NO, Süd...)","direction","")+
 num("Anzahl Module","modules","")+num("Anzahl Haken","hooks","")+field("Modul-Typ этой зоны","moduleType","")+num("Modulleistung этой зоны, Wp","panelWp","")+field("Dacheindeckung этой зоны","roofType","")+field("UK / Montagesystem этой зоны","mounting","")+area("Особенности этой зоны","notes","",600);
 if(kind==="pv-string")return field("String / группа — название","name","")+field("Ausrichtung (Süd, Südwest ...)","direction","")+num("Anzahl Module","modules","")+field("MPPT / цепь, если подтверждено","mppt","")+area("По источнику: один String или группа?","notes","",600);
 if(kind==="pv-cut")return field("Schiene / Einlegeschiene — тип","name","")+num("Длина заготовки, мм","stockLengthMm","","1")+num("Требуемая длина, мм","requiredLengthMm","","1")+num("Количество одинаковых отрезков","qty","","1")+area("Положение на чертеже / Hinweis","notes","",600);
 if(kind==="pv-material")return field("Артикул / Наименование","name","")+field("SKU / Hersteller-Nr.","sku","")+num("Количество","qty","")+field("Единица (St., m, kg)","unit","St.");
 if(kind==="pv-document")return field("Название документа","name","")+field("Тип (Stringplan, Modulbelegung...)","kind","")+field("HTTPS ссылка","url","",700)+field("Revision / дата","revision","");
 return "";
}
globalThis.PVProjectCard={render,form,checks:planChecks,conflicts};
})();
