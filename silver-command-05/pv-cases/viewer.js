(() => {
  "use strict";
  const mount = document.getElementById("casebook");
  const source = document.getElementById("pv-case-data");
  const rate = 50;
  const money = value => value.toLocaleString("ru-RU") + " €";
  const fmt = value => value.toLocaleString("ru-RU",{maximumFractionDigits:2});
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let cases=[], objects=[], lastListY=0, lastPageUrl="";
  function validPack(data) {
    const short = value => typeof value==="string" && value.length<=3500;
    const base64 = value => typeof value==="string" && value.length>0 && /^[A-Za-z0-9+/=]+$/.test(value);
    if(data?.format!=="nvtsk-private-pv-1" || !Array.isArray(data.cases) || !data.cases.length || data.cases.length>100) return false;
    const ids=new Set();
    return data.cases.every(c=>{
      if(!c||!/^pv-[a-z0-9-]{1,50}$/.test(c.id)||ids.has(c.id))return false;
      ids.add(c.id);
      return [c.client,c.street,c.city,c.description,c.note,c.event].every(short)&&Number.isInteger(c.count)&&c.count>0&&c.count<=50000&&Number.isInteger(c.wp)&&c.wp>0&&Number.isFinite(c.planKwp)&&c.planKwp>0&&base64(c.original)&&Array.isArray(c.pages)&&c.pages.length>0&&c.pages.length<=150&&c.pages.every(p=>p&&short(p.label)&&base64(p.thumb)&&base64(p.preview)&&base64(p.pdf));
    });
  }
  function pdfUrl(encoded) {
    const str=atob(encoded), bytes=new Uint8Array(str.length);
    for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));objects.push(url);return url;
  }
  const img = str => "data:image/webp;base64," + str;
  const route = c => "#/"+c.id;
  const pageRoute = (c,i) => route(c)+"/"+(i+1);
  function markCurrent(el, id){if(el)el.href=pdfUrl(id);}
  function openPack(pack){if(!validPack(pack))throw Error("Формат карточек не распознан.");cases=pack.cases;}
  function picker() {
    return '<h1>Планы объектов</h1><section class="panel"><label for="plans-file">Открыть файл карточек NVTSK</label><input class="fileload" id="plans-file" type="file" accept=".html,.json"><p class="quiet">Выбранный файл открывается на этом устройстве.</p><p class="local-error" id="load-status" role="status"></p></section><a class="back" href="./#projects">‹ Рабочее пространство</a>';
  }
  function list() {
    const modules=cases.reduce((n,c)=>n+c.count,0);
    return '<h1>PV-объекты</h1><div class="hero"><small>Базовая стоимость монтажа</small><strong>'+money(modules*rate)+'</strong><span>'+cases.length+' объектов · '+modules+' модулей × '+money(rate)+'</span></div><div class="case-list">'+cases.map(c=>'<a class="case-link" href="'+route(c)+'"><span><strong>'+esc(c.client)+'</strong><small>'+esc(c.city.replace(/^\d+\s+/,""))+' · '+c.count+' мод.</small></span><b class="price">'+money(c.count*rate)+' ›</b></a>').join("")+'</div>';
  }
  function detail(c){
    const calc=c.count*c.wp/1000;
    return '<a class="back" href="#/">‹ Все объекты</a><header><span class="eyebrow">PV Case · Bauherr</span><h1>'+esc(c.client)+'</h1><p class="address">'+esc(c.street)+', '+esc(c.city)+'</p></header><section class="panel"><div class="stats"><div><small>Модулей в расчёте</small><strong>'+c.count+' шт.</strong></div><div><small>Мощность модуля</small><strong>'+c.wp+' Wp</strong></div></div><span class="quiet">Мощность по количеству · '+fmt(calc)+' kWp</span><div class="total"><span>'+c.count+' × '+money(rate)+'</span><b class="price">'+money(c.count*rate)+'</b></div><small class="quiet">Базовая стоимость монтажа</small>'+(c.note?'<p class="notice">'+esc(c.note)+'</p>':'')+'</section>'+
      '<section class="panel"><h2>Монтажный план</h2><div class="gesture">'+c.pages.length+' стр. · нажмите на лист для увеличения</div><div class="strip" aria-label="Страницы исходного плана">'+c.pages.map((p,i)=>'<a class="thumb" href="'+pageRoute(c,i)+'" aria-label="Страница '+(i+1)+' · '+esc(p.label)+'"><img alt="" loading="lazy" src="'+img(p.thumb)+'"><span>Лист '+(i+1)+'</span></a>').join("")+'</div><a id="full-pdf" class="doc" target="_blank" rel="noopener">Исходный PDF ↗</a></section>'+
      '<section class="panel"><h2>Описание и указания</h2><p>'+esc(c.description)+'</p><small class="source">Из монтажного плана объекта</small></section><section class="panel"><h2>Лента Case</h2><ul class="timeline">'+(c.event?'<li>'+esc(c.event)+'</li>':'')+'<li>Базовый расчёт подготовлен по ставке 50 € за модуль.</li></ul></section>';
  }
  function page(c,i){
    const p=c.pages[i];
    return '<div class="sheet-head"><a class="back" href="'+route(c)+'">‹ '+esc(c.client)+'</a><small>'+(i+1)+' / '+c.pages.length+'</small></div><h1>'+esc(p.label)+'</h1><div class="sheet-tools"><button type="button" class="btn" id="zoom" aria-pressed="false">Увеличить ×2</button><a class="btn" id="page-pdf" target="_blank" rel="noopener">Оригинал листа ↗</a></div><div id="canvas-box"><img class="sheet-image" alt="Страница '+(i+1)+' исходного PDF" src="'+img(p.preview)+'"></div><div class="page-nav">'+(i>0?'<a class="btn" href="'+pageRoute(c,i-1)+'">‹ Назад</a>':'')+(i+1<c.pages.length?'<a class="btn" href="'+pageRoute(c,i+1)+'">Дальше ›</a>':'')+'</div>';
  }
  function render(){
    objects.forEach(URL.revokeObjectURL);objects=[];
    const path=location.hash.slice(1).split("/").filter(Boolean),c=cases.find(c=>c.id===path[0]), index=Number(path[1])-1;
    const isPage=c&&path.length===2&&Number.isInteger(index)&&index>=0&&index<c.pages.length;
    mount.innerHTML=!cases.length?picker():isPage?page(c,index):c?detail(c):list();
    if(isPage){
      markCurrent(document.getElementById("page-pdf"),c.pages[index].pdf);
      const zoom=document.getElementById("zoom"), box=document.getElementById("canvas-box");
      zoom.onclick=()=>{const on=box.classList.toggle("zoomed");zoom.setAttribute("aria-pressed",String(on));zoom.textContent=on?"По ширине":"Увеличить ×2";};
    }else if(c)markCurrent(document.getElementById("full-pdf"),c.original);
    document.title=(c?c.client:"PV-объекты")+" · NVTSK";mount.focus({preventScroll:true});
    if(c && lastPageUrl.startsWith("#/"+c.id+"/") && path.length===1){mount.querySelector(".strip")?.scrollIntoView({block:"nearest"});}
    else window.scrollTo(0,c?0:lastListY);
    lastPageUrl=location.hash;
  }
  mount.addEventListener("click",e=>{if(e.target.closest(".case-link"))lastListY=window.scrollY;});
  mount.addEventListener("change",async e=>{
    if(e.target.id!=="plans-file")return;
    const file=e.target.files?.[0], hint=document.getElementById("load-status");if(!file)return;
    try{
      if(file.size>120*1024*1024)throw Error("Файл больше 120 МБ.");
      let text=await file.text();
      if(text.trimStart().startsWith("<")){
        const marker='<script type="application/json" id="pv-case-data">';
        const start=text.indexOf(marker),end=text.indexOf("</"+"script>",start+marker.length);
        if(start<0||end<0)throw Error("В файле отсутствуют карточки NVTSK.");
        text=text.slice(start+marker.length,end);
      }
      openPack(JSON.parse(text));history.replaceState(null,"","#/");render();
    }catch(error){hint.textContent=error.message; e.target.value="";}
  });
  try{const payload=JSON.parse(source.textContent);if(payload)openPack(payload);}catch{cases=[];}
  window.addEventListener("hashchange",render);render();
})();
