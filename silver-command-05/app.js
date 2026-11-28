(()=>{"use strict";
const BASE="nvtsk05_independent";
// NVTSK owns the product identity; SolAn Plus GmbH is the initial internal-company workspace.
const APP_BRAND=Object.freeze({developer:"NVTSK SYSTEM",workspace:"SolAn Plus GmbH",workspaceId:"solan-plus",scope:"Первый рабочий профиль"});
// Stage 1: platform identity and explicit workspace boundary; no fictitious multi-profile support.
const WORKSPACES_KEY=BASE+"_workspaces_v1";
function workspaceRegistry(){try{const r=JSON.parse(localStorage.getItem(WORKSPACES_KEY)||"null");if(r&&Array.isArray(r.items)&&r.items.length){if(!r.items.some(x=>x.id==="sunpaur"))return {...r,items:[...r.items,{id:"sunpaur",name:"Sunpaur GmbH",symbol:"☀",kind:"auftraggeber"}]};return r}}catch{}return {active:"solan-plus",items:[{id:"solan-plus",name:"SolAn Plus GmbH",symbol:"S"},{id:"sunpaur",name:"Sunpaur GmbH",symbol:"☀",kind:"auftraggeber"}]}}
function activeWorkspace(){const r=workspaceRegistry(),a=account();return a?r.items.find(w=>w.id===a.workspaceId):r.items.find(w=>w.id===r.active)||r.items[0]}
function workspaceBadge(){if(lab)return '<span class="nv91-company-name">ALPHA LAB · DEMO</span>';return '<span class="nv91-company-name" style="display:block;min-width:0;font-weight:700;font-size:14px;overflow-wrap:anywhere">'+esc(activeWorkspace().name)+'</span>'}
function workspaceKey(id){return id==="solan-plus"?BASE:BASE+"_company_"+id}
async function ensureWorkspace(id){const key=workspaceKey(id);if(id==="solan-plus"||projectRecords.get(key)!=null)return;const seed=migrate({version:1,cases:[],shards:[],tasks:[],garage:[],crew:[],actor:"lead"});const company=id==="sunpaur"?"Sunpaur GmbH":activeWorkspace().name;const data=validate({...seed,crew:[{id:"lead",name:"Администратор · "+company,role:roles[0],company}],counterparties:[]});await projectWrite(key,null,JSON.stringify({format:1,data,history:[]}))}
const SHARED_CASES_KEY=BASE+"_case_access_v1";
function caseAccessRegistry(){if(lab)return {};try{const r=JSON.parse(localStorage.getItem(SHARED_CASES_KEY)||"{}");return r&&typeof r==="object"?r:{}}catch{return {}}}
function sharedCase(id){const entry=caseAccessRegistry()[id];if(!entry||entry.status!=="accepted"||entry.executorId!==activeWorkspace().id)return null;const ownerRaw=projectRecords.get(workspaceKey(entry.ownerId));if(!ownerRaw)return null;try{const rec=JSON.parse(ownerRaw),data=validate(migrate(rec.format===1?rec.data:rec));return data.cases.find(c=>c.id===id)||null}catch{return null}}
function incomingCases(){const entries=Object.entries(caseAccessRegistry()).filter(([id,x])=>x.status==="accepted"&&x.executorId===activeWorkspace().id);return entries.map(([id])=>sharedCase(id)).filter(Boolean)}
function transferCase(caseId,targetId){if(!lead()||lab)return;const owner=activeWorkspace(),target=workspaceRegistry().items.find(w=>w.id===targetId),c=state.cases.find(x=>x.id===caseId);if(!target||!c||target.id===owner.id)return;if(!confirm("Открыть доступ к Case «"+c.title+"» для "+target.name+"? Карточка останется единственной."))return;const reg=caseAccessRegistry();reg[caseId]={ownerId:owner.id,executorId:target.id,status:"offered",offeredAt:new Date().toISOString()};localStorage.setItem(SHARED_CASES_KEY,JSON.stringify(reg));render()}
function acceptCase(id){if(lab)return;const reg=caseAccessRegistry(),entry=reg[id];if(!entry||entry.executorId!==activeWorkspace().id||entry.status!=="offered")return;reg[id]={...entry,status:"accepted",acceptedAt:new Date().toISOString()};localStorage.setItem(SHARED_CASES_KEY,JSON.stringify(reg));render()}
function offeredCases(){return Object.entries(caseAccessRegistry()).filter(([id,e])=>e.executorId===activeWorkspace().id&&e.status==="offered").map(([id,e])=>{try{const record=JSON.parse(projectRecords.get(workspaceKey(e.ownerId))||"null");if(!record)return null;const data=validate(migrate(record.format===1?record.data:record));return {id,case:data.cases.find(c=>c.id===id),ownerId:e.ownerId}}catch{return null}}).filter(x=>x&&x.case)}
function sharedCaseReadOnly(id){return !state.cases.some(c=>c.id===id)&&!!sharedCase(id)}
function companyProfile(){if(lab)return heading("Компании · ALPHA LAB")+lobbySection("Условные организации","",Array.from(new Set(state.crew.map(c=>c.company).filter(Boolean))).map(name=>finLine(name,String(state.crew.filter(c=>c.company===name).length)+" участников")).join("")+'<p class="hint">Вымышленные компании пока представлены принадлежностью участников; отдельных счетов и прав компаний нет.</p>');const w=activeWorkspace(),sun=w.id==="sunpaur";const emblem=w.logoData?'<img class="cp78-custom-logo" src="'+w.logoData+'" alt="Логотип компании">':sun?'<div class="cp78-sun-logo"><div class="cp78-sun">☀</div><div class="cp78-mountain">⌁</div><div class="cp78-panels">▱▱▱▱▱</div></div>':'<div class="cp78-monogram">'+esc(w.symbol||w.name[0])+'</div>';const rows=sun?state.cases.map(c=>'<div class="cp78-handoff-row"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city||c.address||"Объект")+'</small></span><button data-action="case-transfer" data-id="'+esc(c.id)+'" data-target="solan-plus">Открыть доступ SolAn Plus →</button></div>').join(""):"";return '<div class="cp78-company"><div class="cp78-hero"><div class="cp78-art">'+emblem+'</div><div class="cp78-title"><small>ПРОФИЛЬ КОМПАНИИ · '+(sun?"ЗАКАЗЧИК / AUFTRAGGEBER":"ИСПОЛНИТЕЛЬ / AUFTRAGNEHMER")+'</small><h1>'+esc(w.name)+'</h1><p>'+(sun?"Создание проектов и передача исполнителю":esc(w.trade||"Монтаж PV и управление работами"))+'</p></div></div><div class="cp78-logo-tools"><label>Логотип компании <input id="company-logo-upload" type="file" accept="image/png,image/jpeg,image/webp"></label><small>Загрузите изображение с визитки · хранение на этом устройстве.</small></div><div class="cp78-stats"><div><strong>'+state.cases.length+'</strong><small>Case</small></div><div><strong>'+state.crew.length+'</strong><small>Участники</small></div><div><strong>'+state.shards.length+'</strong><small>Shards</small></div></div><section class="panel"><h2>Рабочее пространство</h2><div class="cp78-buttons"><button data-route="projects">Проекты</button><button data-route="grid/people">Участники</button>'+'<button data-action="new-case">＋ Создать Case</button>'+'</div></section>'+'<section class="panel"><h2>Приглашения к Case</h2>'+((offeredCases().map(x=>'<div class="cp78-handoff-row"><strong>'+esc(x.case.title)+'</strong><button data-action="case-accept" data-id="'+esc(x.id)+'">Принять Case</button></div>').join(""))||'<p>Новых приглашений нет.</p>')+'</section>'+(sun?'<section class="panel"><h2>Передача Case → SolAn Plus</h2><p>Создайте и заполните Case, затем передайте его исполнителю. Открывается доступ к единой карточке, включая паспорт и медиа. Исполнитель должен принять Case.</p>'+(rows||'<p>Пока нет Case для передачи.</p>')+'</section>':'<section class="panel"><h2>Полученные Case</h2><p>Принятые Case отображаются в разделе Projects.</p></section>')+'</div>'}
const ACCOUNT_KEY=BASE+"_accounts_v1", SESSION_KEY=BASE+"_session_v1";
function accounts(){try{const list=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||"[]");return Array.isArray(list)?list:[]}catch{return []}}
// Local-first remembered session: no passwords or Google tokens stored here.
function rememberedAccountId(){const saved=localStorage.getItem(SESSION_KEY);if(saved!==null)return saved;const legacy=sessionStorage.getItem(SESSION_KEY);if(legacy&&accounts().some(a=>a.id===legacy)){localStorage.setItem(SESSION_KEY,legacy);sessionStorage.removeItem(SESSION_KEY);return legacy}return ""}
function account(){const id=rememberedAccountId(),a=accounts().find(a=>a.id===id);return a&&workspaceRegistry().items.some(w=>w.id===a.workspaceId)?a:undefined}
function forgetAccount(){localStorage.setItem(SESSION_KEY,"");sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(BASE+"_mode")}
async function passwordHash(password,salt){const enc=new TextEncoder(),key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:210000,hash:"SHA-256"},key,256))).map(x=>x.toString(16).padStart(2,"0")).join("")}
function enterAccount(a){const r=workspaceRegistry();localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,active:a.workspaceId}));localStorage.setItem(SESSION_KEY,a.id);sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(BASE+"_mode");location.hash=location.hash==="#grid/demo"?"#grid/demo":"#dashboard";location.reload()}
function authIcon(name){const paths={email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',company:'<path d="M3 21h18M5 21V7l10-4v18m0-11h4v11M8 10h1m2-1h1m-4 5h1m2-1h1m-4 5h1m2-1h1"/>',eye:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',eyeOff:'<path d="m3 3 18 18M10 6.2c.7-.2 1.3-.2 2-.2 6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.1 7.7A19 19 0 0 0 2 12s3.6 6 10 6c1.1 0 2.2-.2 3.2-.5"/>'};return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>'}
// Google identity for the local-first MVP. No Google token is stored.
const GOOGLE_CLIENT_ID=(document.querySelector('meta[name="nvtsk-google-client-id"]')?.content||"").trim();
let googleSdkPromise,googleAttempt=0,googlePending=null;
function googleError(message){const el=$("#nv95-google-status");if(el)el.textContent=message;const retry=$("#nv100-google-retry");if(retry)retry.hidden=!message||message.includes("Проверяем")||message.includes("ожидает настройки")}
function googleScript(){if(window.google?.accounts?.id)return Promise.resolve();if(!googleSdkPromise)googleSdkPromise=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client?hl=ru";s.async=true;s.onload=()=>window.google?.accounts?.id?resolve():reject(Error("Google недоступен"));s.onerror=()=>{s.remove();reject(Error("Не удалось загрузить Google"))};document.head.append(s)}).catch(e=>{googleSdkPromise=null;throw e});return googleSdkPromise}
function googleBytes(s){return Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(s.length/4)*4,"=")),c=>c.charCodeAt(0))}
async function verifyGoogleCredential(token,nonce){const p=String(token||"").split(".");if(p.length!==3)throw Error("Некорректный ответ Google");const decode=s=>JSON.parse(new TextDecoder().decode(googleBytes(s))),h=decode(p[0]),v=decode(p[1]),now=Math.floor(Date.now()/1000);if(h.alg!=="RS256"||!h.kid||!["accounts.google.com","https://accounts.google.com"].includes(v.iss)||v.aud!==GOOGLE_CLIENT_ID||(v.azp&&v.azp!==GOOGLE_CLIENT_ID)||!Number.isFinite(v.exp)||v.exp<=now||!Number.isFinite(v.iat)||v.iat>now+60||v.nonce!==nonce||typeof v.sub!=="string"||!v.sub||v.email_verified!==true||typeof v.email!=="string"||!v.email)throw Error("Google не подтвердил аккаунт");const res=await fetch("https://www.googleapis.com/oauth2/v3/certs",{cache:"no-store",credentials:"omit"});if(!res.ok)throw Error("Не удалось проверить подпись Google");const jwks=await res.json(),jwk=jwks.keys?.find(k=>k.kid===h.kid&&k.kty==="RSA"&&(!k.alg||k.alg==="RS256"));if(!jwk)throw Error("Ключ Google не найден");const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,googleBytes(p[2]),new TextEncoder().encode(p[0]+"."+p[1])))throw Error("Подпись Google недействительна");return {sub:v.sub,email:v.email.trim().toLowerCase(),name:typeof v.name==="string"?v.name.slice(0,100):"",exp:v.exp}}
let companyStarter=null;
function starterPicker() {
  return '<div class="starter-picker"><label for="starter-file">Приглашение в компанию</label><input type="file" id="starter-file" accept=".json,application/json"><p id="starter-summary" role="status">Выберите файл приглашения, который вам прислали. Компания и объекты откроются на этом устройстве.</p></div>';
}
document.addEventListener("change",async event=>{
  const input=event.target;
  if(input.id!=="starter-file")return;
  const form=$("#nv90-auth-form"), message=$("#starter-summary");
  companyStarter=null;form.hidden=true;
  const file=input.files[0];if(!file){message.textContent="Выберите файл приглашения.";return}
  try {
    if(file.size>65536)throw Error("Файл приглашения больше 64 КБ.");
    const pack=CaseEstimate.starter(JSON.parse(await file.text()));
    if(input.files[0]!==file||!input.isConnected)return;
    companyStarter=pack;
    $("#nv94-name").value=pack.owner;$("#nv94-name").readOnly=true;
    message.textContent=pack.company+" · "+pack.owner+" · монтажников: "+pack.workers.length+" · объектов: "+pack.projects.length+". Введите свой email и придумайте пароль.";
    form.hidden=false;$("#nv94-email").focus();
  } catch(error) {if(input.files[0]===file)message.textContent=error instanceof SyntaxError?"Не удалось прочитать JSON приглашения.":error.message}
});
function createPersonalAccount({email,nickname,provider="password",salt,hash,googleSub,starter}){const name=String(nickname||"").trim();if(!name||name.length>100)throw Error("Укажите никнейм (до 100 символов)");const list=accounts();if(list.some(x=>x.email===email||(googleSub&&x.googleSub===googleSub)))throw Error("Аккаунт уже существует");const r=workspaceRegistry(),id="account-"+crypto.randomUUID(),a={id:crypto.randomUUID(),email,nickname:name,kind:"individual",workspaceId:id,actorId:"lead",provider,...(provider==="google"?{googleSub}:{salt,hash})},item={id,name:starter?.company||name,symbol:Array.from(starter?.company||name)[0].toUpperCase(),kind:starter?"company":"individual",...(starter?{trade:starter.trade}:{})};if(starter)a.kind="company";const data=starter?CaseEstimate.seed(starter,roles):validate({version:2,personalProfile:true,cases:[],shards:[],tasks:[],garage:[],crew:[{id:"lead",name,role:roles[0],company:""}],actor:"lead",moves:[],teams:[],counterparties:[]});localStorage.setItem(workspaceKey(id),JSON.stringify({format:1,data,history:[]}));localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,items:[...r.items,item]}));localStorage.setItem(ACCOUNT_KEY,JSON.stringify([...list,a]));return a}
function googleOnboarding(identity){stopGoogleResize();googlePending=identity;const glass=$(".nv94-glass");if(!glass)return;$(".nv94-brand h2").textContent="Профиль специалиста";glass.innerHTML='<div class="nv95-onboarding"><p class="nv95-confirmed">Google · '+esc(identity.email)+'</p><form id="nv95-google-onboarding"><label for="nv95-name">Никнейм</label><div class="nv94-field"><span class="nv95-name-icon">'+authIcon("user")+'</span><input id="nv95-name" name="nickname" maxlength="100" autocomplete="nickname" placeholder="Имя в рабочем пространстве" required></div><button class="nv94-submit" type="submit">Продолжить</button><p id="nv95-google-status" role="status"></p></form><button type="button" class="nv94-switch" data-auth-toggle="true">Назад</button></div>'}
async function googleResult(response,nonce,attempt){try{if(attempt!==googleAttempt)return;googleError("Проверяем аккаунт Google…");const identity=await verifyGoogleCredential(response.credential,nonce);if(attempt!==googleAttempt)return;const list=accounts(),a=list.find(x=>x.googleSub===identity.sub&&x.provider==="google");if(a){enterAccount(a);return}if(list.some(x=>x.email===identity.email))throw Error("Этот email уже используется. Войдите прежним способом. Автоматическое объединение отключено.");googleOnboarding(identity)}catch(e){if(attempt===googleAttempt)googleError(e.message||"Не удалось войти через Google")}}
let googleResizeObserver=null,googleResizeFrame=0;
function stopGoogleResize(){if(googleResizeObserver){googleResizeObserver.disconnect();googleResizeObserver=null}if(googleResizeFrame){cancelAnimationFrame(googleResizeFrame);googleResizeFrame=0}}
function googleButtonOptions(width){const w=Math.floor(Math.min(400,Math.max(0,width)));return {type:w<200?"icon":"standard",theme:"outline",size:"large",text:"signin_with",shape:w<200?"circle":"pill",logo_alignment:"left",...(w>=200?{width:String(w)}:{}),locale:"ru"}}
async function mountGoogle(){stopGoogleResize();const attempt=++googleAttempt,host=$("#nv95-google-button");if(!host)return;googlePending=null;if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID)){googleError("Google-вход ожидает настройки OAuth.");return}try{await googleScript();if(attempt!==googleAttempt||!host.isConnected)return;const nonce=crypto.randomUUID();window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:r=>googleResult(r,nonce,attempt),nonce,auto_select:false,ux_mode:"popup"});let lastWidth=-1;const draw=()=>{if(attempt!==googleAttempt||!host.isConnected){stopGoogleResize();return}const w=Math.min(400,Math.floor(host.getBoundingClientRect().width));if(w<=0||w===lastWidth)return;lastWidth=w;host.replaceChildren();window.google.accounts.id.renderButton(host,googleButtonOptions(w));googleError("")};const schedule=()=>{if(googleResizeFrame)cancelAnimationFrame(googleResizeFrame);googleResizeFrame=requestAnimationFrame(()=>{googleResizeFrame=0;try{draw()}catch(e){googleError(e.message||"Google недоступен")}})};draw();if(typeof ResizeObserver==="function"){googleResizeObserver=new ResizeObserver(schedule);googleResizeObserver.observe(host)}else if(lastWidth<0)schedule()}catch(e){if(attempt===googleAttempt)googleError(e.message||"Google недоступен")}}
document.addEventListener("click",e=>{if(e.target.closest("[data-google-retry]"))mountGoogle()});

document.addEventListener("submit",e=>{if(e.target.id!=="nv95-google-onboarding")return;e.preventDefault();const form=e.target,btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{const i=googlePending,p=Object.fromEntries(new FormData(form));if(!i||i.exp<=Date.now()/1000)throw Error("Сессия Google истекла. Повторите вход.");const a=createPersonalAccount({email:i.email,nickname:p.nickname,provider:"google",googleSub:i.sub});googlePending=null;enterAccount(a)}catch(err){googleError(err.message);btn.disabled=false}});
function gridFilmLink(){return '<a class="grid-film" href="grid-demo.html">'+icon("open")+'Демо Grid со звуком · 1:28</a>'}
function loginScreen(register=false){const invitation=location.hash==="#start";if(invitation)register=true;companyStarter=null;document.body.classList.remove("nv108-more");stopGoogleResize();document.body.classList.add("nv90-auth");$("#nav").hidden=true;$(".top").hidden=true;$("#app").innerHTML='<div class="nv94-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i></div><section class="nv90-login nv94-login"><div class="nv94-brand"><img class="nv92-auth-logo" src="art/nvtsk-approved.webp" alt="NVTSK SYSTEM" width="160" height="144"><h1>NVTSK SYSTEM</h1><div class="nv94-divider" aria-hidden="true"></div><h2>'+(invitation?"Открыть свою компанию":register?"Создать аккаунт":"Войти в систему")+'</h2></div><div class="nv94-glass">'+(invitation?starterPicker():"")+'<form '+(invitation?"hidden ":"")+'id="nv90-auth-form" data-register="'+register+'"><div class="nv97-auth-fields" id="nv97-credentials"><label for="nv94-email">Email</label><div class="nv94-field">'+authIcon("email")+'<input id="nv94-email" name="email" type="email" autocomplete="email" required></div><label for="nv94-password">Пароль</label><div class="nv94-field nv94-password">'+authIcon("lock")+'<input id="nv94-password" name="password" type="password" minlength="8" autocomplete="'+(register?"new-password":"current-password")+'" required><button type="button" class="nv94-eye" data-auth-password aria-label="Показать пароль" aria-pressed="false">'+authIcon("eye")+'</button></div></div>'+(register?'<div class="nv97-auth-fields" id="nv97-profile"><label for="nv94-name">Никнейм</label><div class="nv94-field"><span class="nv94-name-icon">'+authIcon("user")+'</span><input id="nv94-name" name="nickname" maxlength="100" autocomplete="nickname" placeholder="Имя в рабочем пространстве" required></div></div>':'')+'<button class="nv94-submit" type="submit">'+(register?"Создать аккаунт":"Войти")+'</button><p id="nv90-auth-error" role="alert"></p></form><div id="nv97-alternatives" '+(invitation?"hidden":"")+'><div class="nv95-or"><span>или</span></div><div id="nv95-google-button" aria-label="Вход через Google"><span class="nv100-google-loading">Загрузка Google…</span></div><p id="nv95-google-status" role="status"></p><button id="nv100-google-retry" type="button" class="nv100-google-retry" data-google-retry hidden>Повторить подключение Google</button><button class="nv94-switch" type="button" data-auth-toggle="'+(!register)+'">'+(register?'Уже есть аккаунт? <strong>Войти</strong>':'<strong>Создать аккаунт</strong>')+'</button></div></div>'+gridFilmLink()+'<small class="nv94-local">LOCAL FIRST <span>·</span> Данные хранятся на этом устройстве.<br>Вход по email без подтверждения почты.</small>'+(invitation?'<a href="#register" class="starter-return">Создать профиль без приглашения</a>':register?'<a href="#start" class="starter-return">У меня есть приглашение в компанию</a>':'')+'</section>';if(!invitation)mountGoogle()}
document.addEventListener("click",e=>{const t=e.target.closest("[data-auth-password]");if(!t)return;const p=$("#nv94-password");if(!p)return;const show=p.type==="password";p.type=show?"text":"password";t.setAttribute("aria-label",show?"Скрыть пароль":"Показать пароль");t.setAttribute("aria-pressed",String(show));t.innerHTML=authIcon(show?"eyeOff":"eye")});
document.addEventListener("click",e=>{const t=e.target.closest("[data-auth-toggle]");if(t){const register=t.dataset.authToggle==="true";if(["#register","#login"].includes(location.hash))location.hash=register?"register":"login";else loginScreen(register)}if(e.target.closest("[data-auth-logout]")){try{forgetAccount();location.reload()}catch(error){alert("Не удалось завершить сеанс: "+error.message)}}});

document.addEventListener("submit",async e=>{if(e.target.id!=="nv90-auth-form")return;e.preventDefault();const form=e.target,p=Object.fromEntries(new FormData(form)),email=String(p.email||"").trim().toLowerCase(),btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{let a=accounts().find(x=>x.email===email);if(form.dataset.register==="true"){if(a)throw Error("Email уже зарегистрирован");if(!String(p.nickname||"").trim())throw Error("Укажите никнейм");if(String(p.password||"").length<8)throw Error("Пароль должен содержать минимум 8 символов");const salt=crypto.randomUUID(),hash=await passwordHash(p.password,salt);if(location.hash==="#start"&&!companyStarter)throw Error("Выберите файл приглашения.");a=createPersonalAccount({email,nickname:p.nickname,salt,hash,starter:location.hash==="#start"?companyStarter:null})}else{if(!a||a.provider==="google"||!a.hash||await passwordHash(p.password,a.salt)!==a.hash)throw Error("Неверный email или пароль")}enterAccount(a)}catch(err){$("#nv90-auth-error").textContent=err.message;btn.disabled=false}});
const bootAccountId=account()?.id||"";
let lab=sessionStorage.getItem(BASE+"_mode")==="alpha";
let KEY=workspaceKey(activeWorkspace().id)+(lab?"_alpha_lab_v1":"");
const  $=s=>document.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial=()=>({version:1,cases:[{id:"demo-1",title:"PV Dachmontage · Demo",city:"Stockach",price:12500},{id:"demo-2",title:"Solarprojekt · Demo",city:"Singen",price:8300},{id:"demo-3",title:"Anmeldung · Demo",city:"Überlingen",price:3900},{id:"demo-4",title:"PV Anlage · Demo",city:"Konstanz",price:6400}],shards:[{id:"sample-dc",title:"Монтаж DC · Demo",kind:"DC",caseId:"demo-1",price:800,assignee:"member-0",status:"draft"},{id:"sample-ac",title:"Подключение AC · Demo",kind:"AC",caseId:"demo-2",price:1400,assignee:null,status:"draft"},{id:"sample-plan",title:"Проектирование · Demo",kind:"Projektierung",caseId:"demo-4",price:640,assignee:null,status:"draft"}],garage:[{id:"rail",title:"Einlegeschiene 5,90 м",qty:24,art:"rail"},{id:"clamp",title:"Mittelklemme 1,8 см",qty:48,art:"clamp"},{id:"module",title:"PV-модуль",qty:18,art:"module"},{id:"vertical",title:"CN37 · вертикаль",qty:36,art:"vertical"},{id:"van",title:"Sprinter 313 · Demo",qty:1,art:"van"},{id:"car",title:"Seat Leon · Demo",qty:1,art:"car"},{id:"trailer",title:"Anhänger · Demo",qty:1,art:"trailer"}],crew:[{name:"Demo Monteur",role:"Monteur"}],tasks:[]});
const {roles,migrate,validate,apply}=NVModel;
const actor=()=>state.crew.find(c=>c.id===(lab?state.actor:account()?.actorId||state.actor));
const lead=()=>actor().role===roles[0], warehouse=()=>lead()||actor().role===roles[2];
// Workspace snapshots live in IndexedDB; small account/settings records remain in localStorage.
const projectRecords=new Map();
let projectDBPromise,projectReady=false,projectChannel=null;
function projectDB(){if(!projectDBPromise)projectDBPromise=new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(Error("IndexedDB недоступна"));return}const req=indexedDB.open("nvtsk-workspaces",1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("records"))req.result.createObjectStore("records")};req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();projectDBPromise=null};resolve(db)};req.onerror=()=>reject(req.error||Error("Не удалось открыть хранилище"));req.onblocked=()=>reject(Error("Закройте другие вкладки NVTSK и повторите вход"))}).catch(e=>{projectDBPromise=null;throw e});return projectDBPromise}
async function projectTransaction(key,mode,expected,next,backup=false){const db=await projectDB();return new Promise((resolve,reject)=>{const tx=db.transaction("records","readwrite"),store=tx.objectStore("records");let result=null,problem=null;const req=store.get(key);req.onsuccess=()=>{const current=req.result??null;result=current;if(mode==="migrate"&&current===null&&next!==null){store.put(next,key);result=next}else if(mode==="write"){if(current!==expected){problem=Error("Данные изменились в другой вкладке. Обновите страницу.");tx.abort();return}if(backup&&current!==null)store.put(current,key+"_damaged");store.put(next,key);result=next}};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(problem||tx.error||req.error||Error("Не удалось сохранить данные"))})}
async function projectLoad(key){const legacy=localStorage.getItem(key),stored=await projectTransaction(key,"migrate",null,legacy);projectRecords.set(key,stored);if(legacy!==null&&stored===legacy&&localStorage.getItem(key)===legacy){try{localStorage.removeItem(key)}catch{}}return stored}
async function projectWrite(key,expected,next,backup=false){const saved=await projectTransaction(key,"write",expected,next,backup);projectRecords.set(key,saved);try{projectChannel?.postMessage({key})}catch{}return saved}
function projectKeys(){return [...new Set([BASE,BASE+"_lab",KEY,...workspaceRegistry().items.flatMap(w=>[workspaceKey(w.id),workspaceKey(w.id)+"_lab"])])]}
async function loadProjectRecords(){await Promise.all(projectKeys().map(projectLoad))}
let state,raw=null,history=[],damaged=false;
function readStore(){
 raw=projectRecords.get(KEY)??null;
 const record=raw?JSON.parse(raw):initial();
 state=validate(migrate(record.format===1?record.data:record));
 history=record.format===1?record.history.map(item=>validate(migrate(item))):[];
 if(!lab&&account()&&state.crew.some(c=>c.id===account().actorId))state={...state,actor:account().actorId};if(lab&&state.labSeed!=="alpha-v1")throw Error("Тестовые данные не найдены");
 damaged=false;
}
function readProjectState(){try{readStore()}catch{damaged=true;state=validate(migrate(initial()));history=[]}}
function projectError(error){return error?.name==="QuotaExceededError"?"Хранилище устройства заполнено. Проект не сохранён, исходные данные не изменены. Освободите место на устройстве и повторите.":error?.message||"Не удалось сохранить проект."}
async function change(operation,undo=false,recovery=false){
 const write=async()=>{
  if(!projectReady)throw Error("Хранилище ещё не готово.");
  if(!bootAccountId||account()?.id!==bootAccountId)throw Error("Аккаунт изменился. Откройте приложение снова.");
  if(damaged&&!recovery)throw Error("Повреждённые данные. Откройте настройки для восстановления.");
  const proposed=operation();if(lab?proposed.labSeed!=="alpha-v1":!!proposed.labSeed)throw Error("Нельзя смешивать ALPHA LAB и рабочие данные");const next=validate({...proposed,actor:lab?proposed.actor:account()?.actorId||state.actor}),past=undo?history.slice(0,-1):[...history,state].slice(-10);
  if((undo||recovery)&&!damaged){const protectedRecords=d=>JSON.stringify(d.cases.filter(c=>c.fin&&(c.fin.receipts.length||c.fin.settled||c.fin.payouts.length)).map(c=>({id:c.id,fin:c.fin,economy:c.economy,ownerId:c.ownerId,price:c.price,shards:d.shards.filter(s=>s.caseId===c.id).map(s=>({id:s.id,price:s.price,assignee:s.assignee,organizerId:s.organizerId,createdBy:s.createdBy,shares:s.shares,status:s.status}))})));if((state.network!==undefined&&next.network===undefined)||JSON.stringify((state.network?.deals||[]).filter(d=>d.caseId))!==JSON.stringify((next.network?.deals||[]).filter(d=>d.caseId))||protectedRecords(state)!==protectedRecords(next)||JSON.stringify((state.rentals||[]).filter(r=>r.status==="settled"))!==JSON.stringify((next.rentals||[]).filter(r=>r.status==="settled")))throw Error("Time Machine и импорт не могут отменить подтверждённые финансовые записи. Сохраните резервную копию; исправление платежей требует отдельной операции.");}
  const record=JSON.stringify({format:1,data:next,history:past});
  await projectWrite(KEY,raw,record,damaged);
  raw=record;state=next;history=past;damaged=false;render();
 };
 try{if(navigator.locks)await navigator.locks.request(KEY,write);else await write();return true}
 catch(error){alert(projectError(error));return false}
}
const money=n=>Number(n||0).toLocaleString("de-DE",{maximumFractionDigits:2});
const shardCount=n=>n+" Shard"+(n===1?"":"s");
const pct=id=>{const s=state.shards.filter(x=>x.caseId===id);return s.length?Math.round(100*s.filter(x=>x.status==="accepted").length/s.length):0};
const button=(label,action,id)=>'<button data-action="'+action+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+label+'</button>';
const panel=(title,route,body)=>'<section class="panel"><div class="panelhead"><h2>'+title+'</h2><button data-route="'+route+'">Открыть →</button></div>'+body+'</section>';
const stat=(symbol,label,value,detail)=>'<div class="stat"><span class="symbol">'+symbol+'</span><div><strong>'+esc(value)+'</strong><label>'+label+'</label><small>'+detail+'</small></div></div>';
function projectCover(project, caption = false) {
  const photo = (project.files || []).find(file => file.data?.startsWith("data:image/"));
  if (photo) return '<img class="project-photo" src="'+esc(photo.data)+'" alt="'+(caption ? esc(photo.name || "Фото объекта") : "")+'" loading="lazy">';
  return '<span class="project-placeholder"'+(caption ? '' : ' aria-hidden="true"')+'>'+icon("layers")+(caption ? '<small>Фото не добавлено</small>' : '')+'</span>';
}
const row=c=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb">'+projectCover(c)+'</span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><span class="casemeta"><b>'+pct(c.id)+'%</b><small>'+money(c.price)+' €</small></span></button>';
const shard=s=>'<button class="shard" data-route="case/'+esc(s.caseId)+'"><span class="ring" style="--p:'+(s.status==="accepted"?100:0)+'%"><b>'+(s.status==="accepted"?"100%":"0%")+'</b></span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(statusName[s.status])+'</small></span><b>›</b></button>';
const iconPaths={
 grid:"M3 5h6v6H3z M15 13h6v6h-6z M9 8h4l3 5 M6 11v5h9 M15 5h4v4",
 open:"M5 19 19 5M7 5h12v12",
 camera:"M3 7h4l2-3h6l2 3h4v13H3z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0",
 folder:"M3 6h6l2 3h10v11H3z", shard:"m12 2 8 6-3 10-5 4-8-6 3-10z M12 2l-1 10 9-4 M11 12l1 10",
 lab:"M8 3h8 M10 3v7L4 19c-.5 1 0 2 1 2h14c1 0 1.5-1 1-2l-6-9V3 M7 15h10",
 passport:"M5 3h13a1 1 0 0 1 1 1v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2z M5 17h14 M9 10l3-3 3 3-3 3z",
 bell:"M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4",
 search:"M21 21l-4.4-4.4 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
 home:"M2 10 12 2l10 8 M5 9v12h5v-7h4v7h5V9",
 layers:"m2 8 10-5 10 5-10 5z M2 12l10 5 10-5 M2 16l10 5 10-5",
 box:"M3 7l9-5 9 5v11l-9 5-9-5z M3 7l9 5 9-5 M12 12v11",
 van:"M2 6h13v11H2z M15 9h4l3 4v4h-7 M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
 team:"M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2c0-6 14-6 14 0v2 M16 4c5 0 5 8 0 8 M18 15c3 0 5 2 5 6",
 pulse:"M3 21v-6h3v6z M10 21V11h3v10z M17 21V6h3v15z M2 10l7-5 5 1 7-5",
 coins:"M4 8c0-4 14-4 14 0s-14 4-14 0z M4 8v9c0 4 14 4 14 0V8 M4 13c0 4 14 4 14 0",
 check:"M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2z M9 2h6v4H9z M8 13l3 3 6-7",
 settings:"M12 3l2 3 4-1 1 4 3 3-3 3-1 4-4-1-2 3-2-3-4 1-1-4-3-3 3-3 1-4 4 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
 screen:"M2 3h20v14H2z M12 17v4 M7 21h10",
 field:"M3 16h18 M5 16v-3c0-5 3-8 7-8s7 3 7 8v3 M10 4v8 M14 4v8 M2 17v3h20v-3",
 clock:"M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v7l4 2"};
const icon=name=>'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+iconPaths[name]+'"/></svg>';
const mapTowns = [
  ["Singen",47.760,8.841], ["Stockach",47.851,9.012], ["Radolfzell",47.737,8.969],
  ["Überlingen",47.769,9.171], ["Konstanz",47.660,9.175]
];
function caseMiniMap() {
  const projects = state.cases;
  const cityGroup = c => lab || c.id.startsWith("demo-") ? mapTowns.find(([name]) => c.city === name)?.[0] || "" : "";
  const markers = mapTowns.map(([name, lat, lon]) => {
    const items = projects.filter(c => cityGroup(c) === name);
    const pos = 'style="left:'+((lon-8.57)/.88*100).toFixed(2)+'%;top:'+((47.913-lat)/.315*100).toFixed(2)+'%"';
    return items.length
      ? '<button type="button" class="map-town" '+pos+' data-map-city="'+name+'" aria-pressed="false" aria-label="'+name+' · объектов '+items.length+'"><b>'+items.length+'</b><span>'+name+'</span></button>'
      : '<span class="map-town town-reference" '+pos+'><b></b><span>'+name+'</span></span>';
  }).join("");
  const choices = projects.map(c => '<option value="'+esc(c.id)+'" data-town="'+esc(cityGroup(c))+'">'+esc(c.title)+'</option>').join("");
  return '<section class="dna-atlas surface"><header class="module-head"><h2>Карта объектов</h2><span class="meta">'+projects.length+' '+projectWord(projects.length)+'</span></header>'+
    '<div class="map-viewport"><div class="map-sheet"><img src="art/bodensee-west.svg" alt="" width="1000" height="500">'+markers+'<i class="lake-name" aria-hidden="true">Bodensee</i></div><span class="map-north" aria-label="Север">↑ N</span></div>'+
    '<div class="map-foot">'+(choices?
      '<div class="atlas-picker-head"><label for="dna-map-case">Объект</label><button type="button" id="dna-map-clear" hidden>Все города</button></div>'+
      '<select id="dna-map-case"><option value="">Выбрать объект</option>'+choices+'</select>'+
      '<div id="dna-map-details" hidden aria-live="polite"></div>':
      '<p class="hint">Объектов пока нет</p>')+'</div></section>';
}
function projectWord(count) {
  const units=count%10, tens=count%100;
  return units===1&&tens!==11?"объект":units>=2&&units<=4&&(tens<12||tens>14)?"объекта":"объектов";
}
function setMapCase(picker) {
  const details = document.getElementById("dna-map-details");
  const project = state.cases.find(c => c.id === picker.value);
  details.hidden = !project;
  if (!project) { details.replaceChildren(); return; }
  const progress = pct(project.id);
  const route = "case/"+esc(project.id);
  details.innerHTML = '<div class="atlas-address"><div><small>Адрес объекта</small><strong>'+esc(project.address || project.city || "Адрес не указан")+'</strong></div><div class="atlas-completion"><small>Готовность</small><b>'+progress+'%</b></div></div>'+
    '<progress max="100" value="'+progress+'" aria-label="Готовность объекта"></progress>'+
    '<div class="atlas-actions"><button id="dna-open-case" data-route="'+route+'">'+icon("folder")+'Открыть Case</button><button data-route="'+route+'/work">'+icon("check")+'Работы и задачи</button></div>';
}
document.addEventListener("click", e => {
  const pin = e.target.closest("[data-map-city]");
  const clear = e.target.closest("#dna-map-clear");
  if (!pin && !clear) return;
  const atlas = (pin || clear).closest(".dna-atlas");
  const picker = atlas.querySelector("#dna-map-case");
  if (!picker) return;
  const city = pin && pin.getAttribute("aria-pressed") !== "true" ? pin.dataset.mapCity : "";
  for (const other of atlas.querySelectorAll("[data-map-city]")) {
    other.setAttribute("aria-pressed", String(other.dataset.mapCity === city));
  }
  let first = "";
  for (const opt of picker.options) {
    opt.hidden = Boolean(city && opt.value && opt.dataset.town !== city);
    opt.disabled = opt.hidden;
    if (!first && opt.value && !opt.hidden) first = opt.value;
  }
  atlas.querySelector('label[for="dna-map-case"]').textContent = city ? "Объекты · "+city : "Объект";
  atlas.querySelector("#dna-map-clear").hidden = !city;
  picker.value = city ? first : "";
  setMapCase(picker);
  if (clear) picker.focus();
  if (city && matchMedia("(max-width:650px)").matches) {
    const bottom = atlas.getBoundingClientRect().bottom;
    const limit = document.getElementById("nav").getBoundingClientRect().top - 8;
    if (bottom > limit) window.scrollBy(0, bottom - limit);
  }
});
document.addEventListener("change", e => { if (e.target.id === "dna-map-case") setMapCase(e.target); });

function myProjects(){
 const who=state.actor,manager=lead(),ids=new Set(),taskIds=new Set(),stockIds=new Set();
 const projectId=shardId=>state.shards.find(sh=>sh.id===shardId)?.caseId;
 state.shards.forEach(sh=>{if(sh.assignee===who)ids.add(sh.caseId)});
 state.tasks.forEach(t=>{if(t.assignee===who){const id=projectId(t.shardId);if(id){ids.add(id);taskIds.add(id)}}});
 state.moves.forEach(m=>{if(m.actor===who&&m.shardId){const id=projectId(m.shardId);if(id){ids.add(id);stockIds.add(id)}}});
 for(const sh of state.shards){
   if(sh.teamId&&state.teams.some(t=>t.id===sh.teamId&&t.memberIds.includes(who)))ids.add(sh.caseId);
 }
 const projects=state.cases.filter(c=>manager||ids.has(c.id)).slice().reverse();
 const html=projects.map(c=>{
  const shards=state.shards.filter(sh=>sh.caseId===c.id),shardIds=new Set(shards.map(sh=>sh.id));
  const taskCount=state.tasks.filter(t=>shardIds.has(t.shardId)).length;
  const labels=manager?["Управление"]:[...(shards.some(sh=>sh.assignee===who)?["Shard"]:[]),...(shards.some(sh=>sh.teamId&&state.teams.some(t=>t.id===sh.teamId&&t.memberIds.includes(who)))?["Team"]:[]),...(taskIds.has(c.id)?["Task"]:[]),...(stockIds.has(c.id)?["Склад"]:[])];
  const status=shards.some(sh=>sh.status==="submitted")?"На приёмке":shards.some(sh=>sh.status==="draft")?"В работе":shards.length?"Принято":"Планирование";
  const percent=pct(c.id);
  return '<button class="command-myproject" data-route="case/'+esc(c.id)+'" aria-label="Открыть '+esc(c.title)+'"><img src="art/tile0.webp" alt="" loading="lazy"><span class="command-myproject-info"><strong>'+esc(c.title)+'</strong><small>'+esc(c.city)+' · '+shardCount(shards.length)+' · '+taskCount+' Tasks</small><span class="command-myproject-tags">'+labels.map(t=>'<em>'+esc(t)+'</em>').join("")+'</span></span><span class="command-myproject-side"><small>'+esc(status)+'</small><b>'+percent+'%</b><span class="command-myproject-track"><i style="width:'+percent+'%"></i></span><span class="command-myproject-arrow">›</span></span></button>';
 }).join("");
 return '<section class="command-myprojects" aria-label="Мои проекты"><div class="command-myprojects-head"><div><small>МОЁ РАБОЧЕЕ ПРОСТРАНСТВО</small><h2>Мои проекты</h2></div><span>'+projects.length+' доступно</span></div><div class="command-myprojects-list">'+(html||'<div class="command-myprojects-empty"><strong>Пока нет проектов с вашим участием</strong><p>Назначенные Shards, Tasks и складские операции появятся здесь автоматически.</p></div>')+'</div></section>';
}
function dashboard(){
 const active=state.shards.filter(s=>s.status!=="accepted");
 const review=state.shards.filter(s=>s.status==="submitted");
 const materials=state.garage.filter(x=>!["van","car","trailer"].includes(x.art));
 const fleet=state.garage.filter(x=>["van","car","trailer"].includes(x.art));
 const total=state.cases.reduce((n,x)=>n+Number(x.price||0),0);
 const accepted=state.shards.filter(s=>s.status==="accepted").length;
  const completion=state.cases.length?Math.round(state.cases.reduce((n,c)=>n+pct(c.id),0)/state.cases.length):0;
 const metrics=[["Projects",state.cases.length,"projects","layers"],["Shards",state.shards.length,"tasks","box"],["Участники",state.crew.length,"team","team"],["Garage",state.garage.length,"garage","van"],["В работе",active.length,"projects","layers"],["Приёмка",review.length,"tasks","check"],["Merit",money(state.cases.reduce((n,c)=>n+NVModel.financialCase(state,c.id).meritMinted/100,0)),"merit","coins"]];
 const cases=state.cases.slice(0,3).map((c,i)=>'<button class="command-case-row" data-route="case/'+esc(c.id)+'"><img class="command-case-photo" src="art/'+(["roof","tile0","tile1"][i]||"roof")+'.webp" alt="" loading="lazy"><span class="command-case-id">P-'+esc(String(i+1).padStart(3,"0"))+'</span><span class="command-case-name">'+esc(c.title)+'</span><span class="command-progress"><i style="width:'+pct(c.id)+'%"></i></span><b>'+pct(c.id)+'%</b></button>').join("")||'<p class="command-empty">Создайте первый Project</p>';
 const resources=[["Оборудование",materials.reduce((n,x)=>n+Number(x.qty||0),0)+" ед."],["Позиций на складе",materials.length],["Транспорт",fleet.length+" ед."],["Принято Shards",accepted]].map(([name,value])=>'<div class="command-info-row"><span>⌁</span><span>'+esc(name)+'</span><b>'+esc(value)+'</b></div>').join("");
 const team=[["Участники",state.crew.length],["Назначено Shards",state.shards.filter(s=>s.assignee).length],["На приёмке",review.length],["Свободно Shards",state.shards.filter(s=>!s.assignee).length]].map(([name,value],i)=>'<div class="command-info-row"><span class="command-dot dot-'+i+'">●</span><span>'+esc(name)+'</span><b>'+value+'</b></div>').join("");
 const ownNext=state.shards.find(s=>s.assignee===state.actor&&s.status==="draft");
 const nextShard=(lead()&&review[0])||ownNext||active[0];
 const nextCase=nextShard&&state.cases.find(c=>c.id===nextShard.caseId);
 const nextAction=nextShard
  ?'<section class="command-mission" aria-label="Следующий шаг"><img src="art/roof.webp" alt="" loading="lazy"><div class="command-mission-copy"><small>СЛЕДУЮЩИЙ ШАГ · '+esc(nextShard.status==="submitted"?"НА ПРИЁМКЕ":"В РАБОТЕ")+'</small><strong>'+esc(nextShard.title)+'</strong><span>'+esc(nextCase?.title||"Project")+' · '+esc(nextCase?.city||"")+'</span></div><button data-route="case/'+esc(nextShard.caseId)+'">Продолжить '+icon("layers")+'</button></section>'
  :'<section class="command-mission" aria-label="Следующий шаг"><img src="art/roof.webp" alt="" loading="lazy"><div class="command-mission-copy"><small>НАЧАЛО РАБОТЫ</small><strong>Создайте первый Project</strong><span>Новый объект, команда и рабочие этапы</span></div><button data-route="projects">Projects '+icon("layers")+'</button></section>';
 const dock=[["Projects","Объекты","projects","layers"],["Shards","Рабочие блоки","tasks","box"],["Garage","Техника и склад","garage","van"],["Сообщество","Люди, профили и достижения","team","team"],["Финансы","Расчёты","finance","coins"]];
 return '<div class="command-center"><header class="command-top"><div class="command-brand"><img class="command-brand-logo" src="art/nvtsk-approved.webp" alt="NVTSK" width="56" height="56"><span class="nvtsk-brand-caption"><strong>NVTSK SYSTEM</strong><small>ПЛАТФОРМА УПРАВЛЕНИЯ</small></span>'+workspaceBadge()+'</div><div class="command-status"><span>● Локальный режим</span><span>▤ Данные на устройстве</span><span>↻ Синхронизация: выкл.</span></div><div class="command-topbuttons"><button data-route="social" aria-label="Уведомления">♧</button><button data-route="projects" aria-label="Открыть Projects">⌕</button><button data-route="settings" aria-label="Настройки">⚙</button></div></header><section class="command-stage"><div class="command-stage-head"><div class="command-home-hero"><div class="command-home-actions" aria-label="Основные действия"><button class="command-home-action is-create" data-action="new-case"><span class="command-home-action-icon">'+icon("box")+'</span><span>+ Project</span></button></div><div class="command-home-map">'+caseMiniMap()+'</div></div><div class="command-stage-meta"><div class="command-health"><small>PV · ГОТОВНОСТЬ</small><strong>'+completion+'%</strong><span>'+state.cases.length+' объектов · '+accepted+' принято</span><svg class="command-trend" viewBox="0 0 200 36" aria-hidden="true"><path d="M0 29Q28 34 52 22T100 19T154 8T200 3"/></svg></div><div class="command-clock"><strong>'+new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"})+'</strong><span>'+state.moves.length+' движений · Local First</span></div></div></div><div class="command-metrics">'+metrics.map(([label,value,route,glyph])=>'<button data-route="'+route+'" class="command-metric"><span class="command-metric-glyph">'+icon(glyph)+'</span><span>'+label+'</span><strong>'+esc(value)+'</strong></button>').join("")+'</div><div class="command-globe-scene" aria-hidden="true"><div class="command-globe"><span>N</span></div><div class="command-globe-base"></div></div>'+myProjects()+nextAction+'<div class="command-panels"><section class="command-panel command-panel-resources"><h2>'+icon("van")+' Ресурсы и техника <button data-route="garage" aria-label="Открыть Garage">›</button></h2><img class="command-panel-banner" src="art/store.webp" alt="" loading="lazy">'+resources+'</section><section class="command-panel command-panel-team"><h2>'+icon("team")+' Сообщество <button data-route="grid/people" aria-label="Открыть сообщество">›</button></h2><img class="command-panel-banner" src="art/hero.webp" alt="" loading="lazy">'+team+'</section></div></section><nav class="command-dock" aria-label="Основные разделы">'+dock.map(([name,subtitle,route,glyph],i)=>'<button class="'+(i===0?"is-primary":"")+'" data-route="'+route+'"><span>'+icon(glyph)+'</span><strong>'+name+'</strong><small>'+subtitle+'</small></button>').join("")+'</nav></div>';
}
const heading=(name,action="")=>'<div class="screenhead"><h1>'+name+'</h1>'+action+'</div>';
function visualTiles(items){return '<div class="visualtiles">'+items.map(([img,title,subtitle,route])=>'<button class="visualtile" data-route="'+route+'"><img src="art/'+img+'.webp" alt="" loading="lazy"><span><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></span></button>').join("")+'</div>'}
// Project Hub v56 — three user-centered surfaces, never a claim of a real online marketplace.
// Project -> Shard -> Task data models remain unchanged.
let projectHubSelectedCase=null;
let projectHubTab="mine",projectHubFilter="all",projectHubQuery="",projectHubCity="all",projectHubKind="all";
const projectHubStatusLabel={review:"Приёмка",active:"В работе",accepted:"Завершён",planning:"Планирование"};
const projectHubStatusOrder={review:0,active:1,planning:2,accepted:3};
function projectHubMembership(c){
 const shards=state.shards.filter(sh=>sh.caseId===c.id), ids=new Set(shards.map(sh=>sh.id));
 const tasks=state.tasks.filter(t=>ids.has(t.shardId));
 const ownShard=shards.some(sh=>sh.assignee===state.actor||NVModel.sharesFor(sh).some(x=>x.memberId===state.actor));
 const ownTask=tasks.some(t=>t.assignee===state.actor);
 const ownStock=state.moves.some(m=>m.actor===state.actor&&ids.has(m.shardId));
 const ownTeam=shards.some(sh=>state.teams.some(t=>t.id===sh.teamId&&t.memberIds.includes(state.actor)));
 const participation=[...(ownShard?["Shard"]:[]),...(ownTask?["Task"]:[]),...(ownTeam?["Team"]:[]),...(ownStock?["Склад"]:[])];
 const status=shards.some(sh=>sh.status==="submitted")?"review":shards.some(sh=>sh.status==="draft")?"active":shards.length?"accepted":"planning";
 return {c,shards,tasks,participation,joined:participation.length>0,managed:ownsCase(c.id),status,percent:pct(c.id)};
}
function projectHubSavedKey(){return KEY+"_market_saved_"+state.actor}
function projectHubSaved(){
 try{const value=JSON.parse(localStorage.getItem(projectHubSavedKey())||"[]");
 return new Set(Array.isArray(value)?value.filter(id=>typeof id==="string"&&id.length<101).slice(0,200):[])}
 catch{return new Set()}
}
function projectHubOfferProjects(all){
 return all.map(x=>({...x,offers:x.shards.filter(sh=>sh.status==="draft"&&sh.assignee===null)})).filter(x=>x.offers.length>0);
}
function projectHubMeta(x){
 const text=[x.c.title,x.c.city,...x.shards.map(sh=>sh.title+" "+sh.kind),...x.tasks.map(t=>t.title)].join(" ");
 return {search:text.toLocaleLowerCase(),city:x.c.city.toLocaleLowerCase()};
}
function projectHubProjectCard(x){
 const tags=[...(x.managed?["Капитан"]:[]),...x.participation];
 const label=tags.length?tags:["Мой объект"];
 const meta=projectHubMeta(x);
 const activeCount=x.shards.filter(sh=>sh.status==="draft"&&sh.assignee===state.actor).length;
 return '<article class="ph-row" data-hubsearch="'+esc(meta.search)+'" data-hubstatus="'+x.status+'" data-hubcity="'+esc(meta.city)+'">'+
 '<button type="button" class="ph-card" data-route="case/'+esc(x.c.id)+'" aria-label="Открыть Project '+esc(x.c.title)+'">'+
 '<span class="ph-card-art"><img src="art/roof.webp" loading="lazy" alt=""></span>'+
 '<span class="ph-card-main"><strong>'+esc(x.c.title)+'</strong><small>'+esc(x.c.city)+' · '+shardCount(x.shards.length)+' · '+x.tasks.length+' Tasks</small>'+
 '<span class="ph-tags">'+label.map(t=>'<em>'+esc(t)+'</em>').join("")+(activeCount?'<em class="ph-tag-action">'+activeCount+' в работе у вас</em>':"")+'</span></span>'+
 '<span class="ph-card-progress"><small>'+projectHubStatusLabel[x.status]+'</small><b>'+x.percent+'%</b><span class="ph-track"><i style="width:'+x.percent+'%"></i></span><span class="ph-open">Открыть ›</span></span></button></article>';
}
function projectHubMarketCard(x,saved){
 const meta=projectHubMeta(x);
 const kinds=[...new Set(x.offers.map(sh=>sh.kind))];
 const total=x.offers.reduce((sum,sh)=>sum+Number(sh.price||0),0);
 const isSaved=saved.has(x.c.id);
 return '<article class="ph-row ph-market-row" data-hubsearch="'+esc(meta.search)+'" data-hubcity="'+esc(meta.city)+'" data-hubstatus="active" data-hubkinds="'+esc(kinds.join("|"))+'" data-hubsaved="'+isSaved+'">'+
 '<button type="button" class="ph-card ph-offer" data-route="case/'+esc(x.c.id)+'" aria-label="Открыть предложение '+esc(x.c.title)+'">'+
 '<span class="ph-card-art"><img src="art/module.webp" loading="lazy" alt=""></span>'+
 '<span class="ph-card-main"><strong>'+esc(x.c.title)+'</strong><small>'+esc(x.c.city)+' · '+x.offers.length+' свободных Shards</small>'+
 '<span class="ph-tags">'+kinds.slice(0,4).map(k=>'<em>'+esc(k)+'</em>').join("")+'</span></span>'+
 '<span class="ph-card-progress"><small>Общий бюджет свободных Shards</small><b>'+money(total)+' €</b><span class="ph-open">Посмотреть →</span></span></button>'+
 '<button class="ph-save'+(isSaved?" is-saved":"")+'" type="button" data-action="project-save" data-id="'+esc(x.c.id)+'" aria-pressed="'+isSaved+'" aria-label="'+(isSaved?"Убрать из сохранённых":"Сохранить предложение")+'">'+(isSaved?"★ Сохранено":"☆ Сохранить")+'</button></article>';
}
function filterProjectHub(){
 const search=(document.getElementById("project-hub-search")?.value||"").trim().toLocaleLowerCase();
 const cards=[...document.querySelectorAll(".ph-row[data-hubsearch],.sc75-project[data-hubsearch]")];
 let shown=0;
 for(const el of cards){
  const textMatch=el.dataset.hubsearch.includes(search);
  const cityMatch=projectHubCity==="all"||el.dataset.hubcity===projectHubCity;
  const kindMatch=projectHubTab!=="market"||projectHubKind==="all"||(el.dataset.hubkinds||"").split("|").includes(projectHubKind);
  const filterMatch=projectHubTab==="market"?(projectHubFilter!=="saved"||el.dataset.hubsaved==="true"):(projectHubFilter==="all"||(projectHubFilter==="active"?["active","planning"].includes(el.dataset.hubstatus):el.dataset.hubstatus===projectHubFilter));
  el.hidden=!(textMatch&&cityMatch&&kindMatch&&filterMatch);
  if(!el.hidden)shown++;
 }
 const result=document.getElementById("ph-result-count"),empty=document.getElementById("ph-no-match");
 if(result)result.textContent=shown+" найдено";
 if(empty)empty.hidden=shown>0||cards.length===0;
}

function counterpartyForProject(c){return state.counterparties.find(p=>p.id===c.counterpartyId)}
function counterpartySelector(value=null){
 return '<label>Контрагент / Auftraggeber<select name="counterpartyId">'+options([["","Без контрагента"],...state.counterparties.map(p=>[p.id,p.name])],value||"")+'</select></label>';
}
function contractorContacts(p){
 const website=typeof p.website==="string"&&p.website.startsWith("https://")?p.website:"";
 const tel=typeof p.phone==="string"&&/^\+?[\d\s()-]{6,50}$/.test(p.phone)?p.phone:"";
 const email=typeof p.email==="string"&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)?p.email:"";
 return '<div class="cp-contact-grid">'+contactDetail("Адрес",p.address||"",null)+
 contactDetail("Телефон",tel,tel?"tel:"+tel.replace(/[^\d+]/g,""):null)+
 contactDetail("Email",email,email?"mailto:"+email:null)+
 contactDetail("Официальный сайт",website?website.replace(/^https:\/\//,""):null,website)+'</div>';
}
function counterpartiesView(){
 const items=state.counterparties.map(p=>{
  const projects=state.cases.filter(c=>c.counterpartyId===p.id);
  return '<article class="cp-list-card"><div class="cp-list-symbol">S</div><div class="cp-list-content"><small>AUFTRAGGEBER · КОНТРАГЕНТ</small><h3>'+esc(p.name)+'</h3><p>'+esc(p.city||"")+' · '+esc(p.category||"Компания")+'</p><div class="cp-list-tags"><span>DC · субподряд</span><span>AC · электрики заказчика</span><span>'+projects.length+' Projects</span></div></div><button data-route="partner/'+esc(p.id)+'">Профиль →</button></article>';
 }).join("");
 return '<section class="cp-partners"><div class="cp-list-heading"><span class="ph-eyebrow">BUSINESS NETWORK</span><h2>Контрагенты SolAn Plus</h2><p>Компании-заказчики, контакты и связи с объектами — отдельно от внутренних Teams.</p></div>'+items+
 '<p class="cp-note">Привязка к Project создаётся вручную. Существующие объекты не привязаны автоматически.</p></section>';
}
function counterpartyProfile(id){
 const p=state.counterparties.find(x=>x.id===id);
 if(!p)return heading("Контрагент не найден");
 const projects=state.cases.filter(c=>c.counterpartyId===p.id);
 const linked=state.shards.filter(sh=>projects.some(c=>c.id===sh.caseId));
 const dc=linked.filter(sh=>sh.kind==="DC");
 const accepted=dc.filter(sh=>sh.status==="accepted");
 return '<div class="community cp-profile"><button class="back" data-route="projects">← Projects / Контрагенты</button>'+
 '<section class="cp-hero"><div class="cp-hero-title"><span class="cp-eyebrow">EXTERNAL PARTNER · AUFTRAGGEBER</span><h1>'+esc(p.name)+'</h1><p>'+esc(p.city||"")+' · '+esc(p.category||"Контрагент")+'</p></div><div class="cp-badge-mark"><span>sunpaur</span><small>SOLAR & ENERGY</small></div></section>'+
 '<div class="cp-stats"><div><b>'+projects.length+'</b><small>Связанные Projects</small></div><div><b>'+dc.length+'</b><small>DC Shards</small></div><div><b>'+accepted.length+'</b><small>Принято DC</small></div></div>'+
 '<section class="community-section cp-relationship"><div class="community-section-head"><div><h2>Схема сотрудничества</h2><small>Рабочие условия SolAn Plus GmbH</small></div></div>'+
 '<div class="cp-rel-graph"><div class="cp-rel-box"><small>ЗАКАЗЧИК / AUFTRAGGEBER</small><strong>'+esc(p.name)+'</strong><span>Передаёт объекты на монтаж</span></div><div class="cp-rel-arrow">↓ DC Shards</div>'+
 '<div class="cp-rel-box cp-rel-sol"><small>ИСПОЛНИТЕЛЬ / AUFTRAGNEHMER</small><strong>SolAn Plus GmbH</strong><span>Монтаж панелей · DC</span></div></div>'+
 '<div class="cp-scope-grid"><div><small>В нашей зоне ответственности</small><strong>DC-Montage</strong><p>Монтаж PV-модулей и DC-работы согласно Shard.</p></div>'+
 '<div><small>На стороне контрагента</small><strong>AC / Elektro</strong><p>Подключение выполняют собственные электрики Sunpaur.</p></div></div>'+
 '<p class="cp-note">Эта схема основана на информации о сотрудничестве, полученной от пользователя. Публичный сайт Sunpaur не подтверждает условия конкретного субподряда.</p></section>'+
 '<section class="community-section cp-contact-section"><div class="community-section-head"><div><h2>Юридические данные и контакты</h2><small>Из официального Impressum</small></div></div>'+
 contractorContacts(p)+
 '<div class="cp-legal"><div><small>Handelsregister</small><strong>'+esc(p.register||"")+'</strong></div><div><small>USt-IdNr.</small><strong>'+esc(p.vatId||"")+'</strong></div></div>'+
 '<h3>Geschäftsführung</h3><div class="cp-directors">'+(p.directors||[]).map((n,i)=>'<div><span>GF</span><strong>'+esc(n)+'</strong><small>'+esc(i===0?"Geschäftsführer · B.Eng. Elektrotechnik":"Geschäftsführer · Elektromeister")+'</small></div>').join("")+'</div>'+
 '<p class="cp-source">Источники: <a href="https://sunpaur.com/impressum/" target="_blank" rel="noopener noreferrer">Impressum</a> · <a href="https://sunpaur.com/" target="_blank" rel="noopener noreferrer">Сайт</a></p></section>'+
 '<section class="community-section cp-projects"><div class="community-section-head"><div><h2>Совместные Projects</h2><small>Привязанные объекты и DC-работы</small></div>'+(lead()?button("＋ Project от Sunpaur","new-case-partner",p.id):"")+'</div>'+
 (projects.length?projects.map(c=>'<button class="cp-project-row" data-route="case/'+esc(c.id)+'"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city)+' · '+shardCount(state.shards.filter(sh=>sh.caseId===c.id).length)+'</small></span><b>Открыть →</b></button>').join(""):'<div class="cp-empty"><strong>Пока нет привязанных Projects</strong><p>Создай новый объект Sunpaur или привяжи существующий вручную. Неподтверждённые связи не создаются автоматически.</p></div>')+
 '</section></div>';
}
function projectHubAccounting(){
 const budget=state.cases.reduce((sum,c)=>sum+Number(c.price||0),0);
 const allocated=state.shards.reduce((sum,sh)=>sum+Number(sh.price||0),0);
 const accepted=state.shards.filter(sh=>sh.status==="accepted").reduce((sum,sh)=>sum+Number(sh.price||0),0);
 const waiting=state.shards.filter(sh=>sh.status==="submitted");
 const rows=state.cases.map(c=>{
   const shards=state.shards.filter(sh=>sh.caseId===c.id),planned=shards.reduce((n,sh)=>n+Number(sh.price||0),0);
   const done=shards.filter(sh=>sh.status==="accepted").reduce((n,sh)=>n+Number(sh.price||0),0);
   return '<button type="button" class="ph-account-row" data-route="case/'+esc(c.id)+'">'+
   '<span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city)+' · '+shardCount(shards.length)+'</small></span>'+
   '<span><small>Бюджет</small><b>'+money(c.price)+' €</b></span>'+
   '<span><small>Распределено</small><b>'+money(planned)+' €</b></span>'+
   '<span><small>Принято</small><b>'+money(done)+' €</b></span></button>';
 }).join("");
 return '<div class="ph-account">'+
 '<div class="ph-account-stats">'+
 '<div><small>Бюджет всех Projects</small><strong>'+money(budget)+' €</strong></div>'+
 '<div><small>Распределено по Shards</small><strong>'+money(allocated)+' €</strong></div>'+
 '<div><small>Принято работ</small><strong>'+money(accepted)+' €</strong></div>'+
 '<div><small>Shards ожидают приёмки</small><strong>'+waiting.length+'</strong></div></div>'+
 '<div class="ph-local-note"><strong>Управленческая сводка</strong><span>Это плановые бюджеты и стоимость принятых работ, а не подтверждённые поступления денег, расходы или выплаты. Для полноценного финансового учёта потребуется отдельный журнал операций.</span></div>'+
 '<div class="ph-account-title"><h3>По объектам</h3><button data-route="pulse">Обзор Merit и бюджетов →</button></div>'+
 '<div class="ph-account-list">'+(rows||'<p class="ph-empty">Создайте первый Project, чтобы начать учёт.</p>')+'</div></div>';
}
function visibleProjectHub(){
 const all=[...state.cases,...incomingCases().filter(c=>!state.cases.some(x=>x.id===c.id))].map(projectHubMembership);
 const own=lead()?all:all.filter(x=>x.managed||x.joined||sharedCaseReadOnly(x.c.id));
 return own.sort((a,b)=>(projectHubStatusOrder[a.status]??9)-(projectHubStatusOrder[b.status]??9));
}
function projects(){
 const list=visibleProjectHub();
 const current=list.find(x=>x.c.id===projectHubSelectedCase)||list[0];
 const status=x=>projectHubStatusLabel[x.status]||"Планирование";
 const originLabel=c=>c.origin?'<small class="cp78-origin">Получено от '+esc(c.origin.workspaceName)+'</small>':"";
 const cards=list.map(x=>'<button class="sc75-project'+(current&&current.c.id===x.c.id?' is-current':'')+'" aria-pressed="'+Boolean(current&&current.c.id===x.c.id)+'" data-state="'+esc(x.status)+'" data-action="project-select" data-id="'+esc(x.c.id)+'" data-hubsearch="'+esc(projectHubMeta(x).search)+'">'+projectCover(x.c)+'<span class="sc75-card-info"><strong>'+esc(x.c.title)+'</strong>'+originLabel(x.c)+'<small>'+esc(x.c.city||x.c.address||"Объект")+'</small><span>'+x.shards.length+' Shards · '+x.tasks.length+' Tasks</span><span class="sc75-track"><i style="width:'+x.percent+'%"></i></span></span><span class="sc75-card-end"><em>'+status(x)+'</em><b>'+x.percent+'%</b></span></button>').join("");
 let pane='<section class="sc75-empty">Выберите Case, чтобы открыть паспорт, медиа и задачи.</section>';
 if(current){
  const x=current,c=x.c,p=c.pvPlan||{};
  const facts=[["Мощность",p.declaredKwp?esc(String(p.declaredKwp))+" kWp":"—"],["Модули",p.declaredModules?esc(String(p.declaredModules))+" шт.":"—"],["Инвертор",esc(p.inverter||p.inverterType||"—")],["Крыша",esc(p.roofType||"—")],["Крепление",esc(p.mounting||"—")],["Уклон",p.slopeDeg!=null&&p.slopeDeg!==""?esc(String(p.slopeDeg))+"°":"—"]];
  const files=(c.files||[]).slice(0,6).map(f=>'<a class="sc75-file" href="'+f.data+'" download="'+esc(f.name)+'">'+(f.data.startsWith("data:image/")?'<img src="'+f.data+'" alt="'+esc(f.name)+'">':'<span>PDF</span>')+'</a>').join("");
  const stages=[["Подготовка",x.shards.length>0],["Монтаж",x.percent>0],["AC",x.shards.some(sh=>sh.kind==="AC"&&sh.status==="accepted")],["Приёмка",x.status==="review"||x.status==="accepted"],["Закрытие",x.status==="accepted"]];
  pane='<section class="sc75-detail" id="project-inspector" tabindex="-1"><button class="list-return" data-project-list>← К списку объектов</button><div class="sc75-detail-head"><div><h2>'+esc(c.title)+'</h2><p>'+esc([c.address,c.city].filter(Boolean).join(" · "))+'</p></div><span class="sc75-status" data-state="'+esc(x.status)+'">'+status(x)+'</span></div>'+
   '<div class="sc75-case-top"><div class="sc75-cover">'+projectCover(c,true)+'</div><div class="sc75-passport"><div class="sc75-section-head"><h3>Паспорт объекта</h3><button data-route="case/'+esc(c.id)+'">Открыть Case ↗</button></div><div class="sc75-facts">'+facts.map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join("")+'</div></div></div>'+
   '<div class="sc75-actions"><button data-route="case/'+esc(c.id)+'/work">Работы и задачи</button><button data-route="case/'+esc(c.id)+'/docs">Документы</button><button data-route="case/'+esc(c.id)+'/people">Команда</button></div>'+
   '<div class="sc75-progress"><div><strong>Прогресс проекта</strong><b>'+x.percent+'%</b></div><span class="sc75-track"><i style="width:'+x.percent+'%"></i></span><div class="sc75-stages">'+stages.map(([label,done])=>'<span class="'+(done?'done':'')+'">'+(done?'●':'○')+' '+label+'</span>').join("")+'</div></div>'+
   '<div class="sc75-media"><div class="sc75-section-head"><h3>Медиа объекта <small>('+(c.files||[]).length+')</small></h3>'+(ownsCase(c.id)?'<button data-action="new-case-media" data-id="'+esc(c.id)+'">＋ Фото / PDF</button>':'')+'</div><div class="sc75-media-items">'+(files||'<p>Пока нет медиа. Добавьте фото крыши, монтажных работ или проектные PDF.</p>')+'</div></div>'+
   '</section>';
 }
 const mobilePlans=matchMedia("(max-width:959px)").matches
   ? '<p class="pv-mobile-plans"><a href="pv-cases.html">Открыть монтажные планы PV →</a></p>' : "";
 return '<div class="sc75-shell"><header class="sc75-header"><div><h1>Проекты</h1><p>Объекты, Case и задачи рабочего пространства</p></div>'+'<button data-action="new-case">＋ Новый Case</button>'+'</header>'+mobilePlans+'<div class="sc75-layout"><aside class="sc75-list"><label class="sc75-search">⌕ <input id="project-hub-search" type="search" placeholder="Название, адрес, клиент…" aria-label="Поиск проектов" value="'+esc(projectHubQuery)+'"></label><div class="sc75-cards">'+(cards||'<p>Проектов пока нет</p>')+'</div><p id="ph-no-match" hidden>Нет совпадений</p></aside>'+pane+'</div></div>';
}
const statusName={draft:"В работе",submitted:"На проверке",accepted:"Принято"};
const taskStatusName={todo:"К выполнению",doing:"В работе",done:"Готово"};
const tasksForShard=id=>state.tasks.filter(t=>t.shardId===id);
const taskProgress=id=>{const work=tasksForShard(id);return work.length?Math.round(work.filter(t=>t.status==="done").length/work.length*100):0};
const mayEditTask=(t,sh)=>sh.status==="draft"&&(ownsCase(sh.caseId)||t.assignee===state.actor||(t.assignee===null&&sh.assignee===state.actor));
function taskRows(sh){
 const list=tasksForShard(sh.id);
 const out=list.map(t=>{
  const who=t.assignee||sh.assignee;
  const action=mayEditTask(t,sh)?'<button class="task-status-btn" data-action="task-next" data-id="'+esc(t.id)+'">'+(t.status==="todo"?"Начать":t.status==="doing"?"Завершить":"Вернуть в работу")+'</button>':"";
  return '<div class="shard-task-row '+(t.status==="done"?"is-done":"")+'"><span class="task-state">'+(t.status==="done"?"✓":t.status==="doing"?"◉":"○")+'</span><div><strong>'+esc(t.title)+'</strong><small>'+esc(taskStatusName[t.status])+' · '+esc(member(who))+'</small>'+(t.notes?'<p>'+esc(t.notes)+'</p>':"")+'</div>'+action+'</div>';
 }).join("");
 return '<div class="shard-task-list"><div class="shard-task-title"><strong>Tasks · '+list.filter(t=>t.status==="done").length+' / '+list.length+'</strong><span>Готово '+taskProgress(sh.id)+'%</span></div>'+(out||'<p class="hint">Tasks ещё не добавлены.</p>')+(sh.status==="draft"&&(ownsCase(sh.caseId)||sh.assignee===state.actor)?button("＋ Task","new-task",sh.id):"")+'</div>';
}
const displayMemberName=c=>c?(c.id==="lead"&&c.name==="Координатор"?"Капитан":c.name):"Без назначения";
const displayRole=c=>c.role===roles[0]?"Администратор пространства":c.role;
const member=id=>displayMemberName(state.crew.find(c=>c.id===id));
const options=(items,value)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join("");
const teamOptions=()=>state.crew.map(c=>[c.id,displayMemberName(c)+" · "+displayRole(c)]);
function shardRow(s){
  let actions="";
  if(s.status==="draft" && ownsCase(s.caseId)&&finPlanEditable(NVModel.financialCase(state,s.caseId)))actions+=button("Назначить","assign",s.id)+(state.teams.length?button("Назначить Team","assign-team",s.id):"");
  if(s.status==="draft" && state.actor===s.assignee)actions+=button("На проверку","submit",s.id);
  if(s.status==="submitted" && ownsCase(s.caseId) && state.actor!==s.assignee)actions+=button("Принять","accept",s.id)+button("На доработку","revise",s.id);if(s.status==="submitted"&&ownsCase(s.caseId)&&state.actor===s.assignee&&finOwner(NVModel.financialCase(state,s.caseId)))actions+=button("Самоподтверждение","finance-self-accept",s.id);
  return '<article class="taskrow shard-work-card" data-state="'+esc(s.status)+'"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(member(s.assignee))+' · '+statusName[s.status]+(s.teamId?' · Team: '+esc(state.teams.find(t=>t.id===s.teamId)?.name||''):'')+'</small><p>'+esc(s.notes||'')+'</p><div>'+fileLinks(s.files)+'</div></div><div><button data-route="shard/'+esc(s.id)+'">Открыть Shard →</button>'+actions+'</div>'+taskRows(s)+'</article>';
}
function shardDetail(id){
 const sh=state.shards.find(x=>x.id===id);
 if(!sh)return heading("Shard не найден");
 const project=state.cases.find(c=>c.id===sh.caseId);
 return '<button class="back" data-route="case/'+esc(project.id)+'/work">← '+esc(project.title)+'</button><section class="panel shard-workspace"><div class="shard-workspace-heading"><div><small>PROJECT / SHARD / TASKS</small><h1>'+esc(sh.title)+'</h1><p>'+esc(project.title)+' · '+esc(sh.kind)+' · '+esc(member(sh.assignee))+'</p><span class="fieldstatus" data-status="'+esc(sh.status)+'">'+esc(statusName[sh.status])+'</span></div>'+projectCover(project)+'</div><p>'+esc(sh.notes||"")+'</p><div class="shard-work-progress"><span>Выполнено '+taskProgress(sh.id)+'%</span><div class="progress"><i style="width:'+taskProgress(sh.id)+'%"></i></div></div>'+taskRows(sh)+'<div class="shard-work-actions">'+(sh.status==="draft"&&sh.assignee===state.actor?button("Передать на приёмку","submit",sh.id):"")+(sh.status==="submitted"&&ownsCase(sh.caseId)&&state.actor!==sh.assignee?button("Принять Shard","accept",sh.id)+button("На доработку","revise",sh.id):"")+(sh.status==="submitted"&&ownsCase(sh.caseId)&&state.actor===sh.assignee&&finOwner(NVModel.financialCase(state,sh.caseId))?button("Самоподтверждение","finance-self-accept",sh.id):"")+'</div></section>'+finShardPanel(sh)+lobbySection("Материалы и участники",lobbyLink("case/"+project.id+"/stock","Материалы Case →"),'<p>Складские движения и получатели привязаны к этому Shard.</p>'+lobbyLink("lager/"+project.id,"Открыть склад Case")+lobbyLink("case/"+project.id+"/people","Команда Case"));
}
function caseMaterialHistory(caseId){
 const related=new Set(state.shards.filter(s=>s.caseId===caseId).map(s=>s.id));
 const moves=state.moves.filter(m=>related.has(m.shardId)).slice().reverse();
 if(!moves.length)return '<p>Движений материалов нет</p>';
 return moves.map(m=>{
  const item=state.garage.find(x=>x.id===m.itemId);
  const shard=state.shards.find(x=>x.id===m.shardId);
  const operator=state.crew.find(x=>x.id===m.actor);
  const kind={issue:"Выдача",return:"Возврат",receive:"Приход"}[m.type]||m.type;
  return '<div class="taskrow"><div><strong>'+esc(kind)+' · '+esc(item?.title||"Материал")+' · '+esc(m.qty)+'</strong><small>'+esc(shard?.title||"Shard")+' · '+esc(operator?.name||"Участник")+' · Получатель: '+esc(m.recipientId?member(m.recipientId):"не указан")+'</small></div><button data-route="shard/'+esc(shard?.id||"")+'">Shard →</button></div>';
 }).join("");
}
function caseTeam(id){
 const rel=NVModel.caseRelations(state,id),linked=rel?.shards||[],ids=new Set(rel?.memberIds||[]),owner=rel?.finance.ownerId;
 const rows=state.crew.filter(c=>ids.has(c.id)).map(c=>{const roles=[...(c.id===owner?["Создатель Case"]:[]),...linked.filter(s=>NVModel.organizerOf(s)===c.id).map(s=>"Организатор · "+s.title),...linked.filter(s=>NVModel.sharesFor(s).some(x=>x.memberId===c.id)).map(s=>"Исполнитель · "+s.title)];return '<article class="taskrow"><div><strong>'+esc(displayMemberName(c))+'</strong><small>'+esc(roles.join(" · ")||"Участник команды / задачи")+'</small></div><button data-route="member/'+esc(c.id)+'">Профиль →</button></article>'}).join("");
 return '<section class="panel"><div class="panelhead"><h2>Команда Case</h2><button data-route="grid/people">Grid · участники →</button></div>'+(rows||'<p>Участники пока не назначены</p>')+'<p class="hint">Назначения и доли берутся из Shards, Teams и Tasks. Роли зависят от участия в этом Case.</p></section>';
}
function estimatePanel(c, plan) {
  const result=CaseEstimate.totals(c.price,plan),editable=ownsCase(c.id)&&state.cases.some(x=>x.id===c.id);
  const amount=n=>money(n/100)+" €", percent=result.percent===null?"—":result.percent.toLocaleString("ru-RU",{maximumFractionDigits:1})+"%";
  const who=id=>state.crew.find(m=>m.id===id)?.name||"Участник";
  const lines=plan.labor.map(r=>`<tr><th scope="row">${esc(who(r.id))}</th><td>${money(r.hours)}</td><td>${money(r.rate)} €</td><td>${amount(CaseEstimate.laborCents(r))}</td></tr>`).join("");
  const costs=Object.entries(CaseEstimate.costs);
  const field=(name,value,title,max)=>`<label>${esc(title)}<input type="number" step=".01" min="0" max="${max}" name="${name}" value="${value}" required inputmode="decimal"></label>`;
  const edit=editable?`<details class="estimate-edit"><summary>Изменить смету</summary><form data-estimate="${esc(c.id)}">
    ${plan.labor.map((r,i)=>`<fieldset><legend>${esc(who(r.id))}</legend>${field("hours"+i,r.hours,"Часы",5000)}${field("rate"+i,r.rate,"Ставка, €/ч",10000)}</fieldset>`).join("")}
    <fieldset><legend>Расходы, €</legend>${costs.map(([k,label])=>field(k,plan.costs[k],label,10000000)).join("")}</fieldset>
    <button type="submit">Сохранить смету</button><p role="alert"></p></form></details>`:"";
  return `<section class="panel case-estimate"><header><div><small>ПЛАН · БЕЗ НДС</small><h2>Смета работ</h2></div><div class="estimate-margin"><small>Маржа</small><b>${amount(result.margin)}</b><small>${percent} выручки</small></div></header>
    <table><caption>План оплаты монтажников</caption><thead><tr><th>Участник</th><th>Часы</th><th>€/ч</th><th>Оплата</th></tr></thead><tbody>${lines}</tbody></table>
    <dl><div><dt>Выручка по бюджету Case</dt><dd>${amount(Math.round(c.price*100))}</dd></div><div><dt>Оплата бригады</dt><dd>${amount(result.pay)}</dd></div>${costs.map(([k,label])=>`<div><dt>${label}</dt><dd>${amount(Math.round(plan.costs[k]*100))}</dd></div>`).join("")}</dl>
    <p>Маржа до налогов = выручка − оплата бригады − расходы и резерв. Ставки и суммы плановые. Фактические платежи ведутся в разделе «Финансы».</p>${edit}<span class="estimate-status" role="status"></span></section>`;
}
document.addEventListener("submit",async e=>{
  const form=e.target;if(!form.matches("form[data-estimate]"))return;
  e.preventDefault();const id=form.dataset.estimate,old=state.cases.find(c=>c.id===id);
  if(!old||!ownsCase(id))return;
  const {description,plan}=CaseEstimate.read(old.notes);if(!plan)return;
  const data=new FormData(form),val=key=>Number(data.get(key)),submit=form.querySelector("button[type=submit]");
  submit.disabled=true;
  try {
    const next={labor:plan.labor.map((r,i)=>({id:r.id,hours:val("hours"+i),rate:val("rate"+i)})),costs:Object.fromEntries(Object.keys(CaseEstimate.costs).map(k=>[k,val(k)]))};
    const notes=CaseEstimate.write(description,next);
    if(await change(()=>({...state,cases:state.cases.map(c=>c.id===id?{...c,notes}:c)})))document.querySelector(".estimate-status").textContent="Смета сохранена.";
  } catch(error){form.querySelector('[role=alert]').textContent=error.message}
  finally{submit.disabled=false}
});
function caseTabs(id,tab){return '<nav class="nv109-tabs" aria-label="Разделы Case">'+[["overview","Обзор"],["work","Работы"],["people","Команда"],["stock","Материалы"],...(CaseEstimate.read(state.cases.find(c=>c.id===id)?.notes).plan?[["estimate","Смета"]]:[]),["finance","Финансы"],["network","Grid"],["docs","Документы"]].map(([k,t])=>'<button data-route="case/'+esc(id)+'/'+k+'" class="'+(tab===k?"active":"")+'" aria-current="'+(tab===k?"page":"false")+'">'+t+'</button>').join("")+'</nav>'}
function caseStockPanel(id){const rel=NVModel.caseRelations(state,id);return lobbySection("На объекте · по получателям",lobbyLink("lager/"+id,"Lager →"),(rel.stock.map(x=>{const m=state.garage.find(i=>i.id===x.itemId),s=state.shards.find(i=>i.id===x.shardId);return '<div class="nv104-line"><span>'+esc(m?.title||"Материал")+'<small>'+esc(s?.title||"Shard")+' · '+esc(x.recipientId?member(x.recipientId):"Получатель не указан · старая запись")+'</small></span><strong>'+esc(x.qty)+' '+esc(m?.unit||"шт.")+'</strong></div>'}).join("")||'<p class="hint">Выдач пока нет.</p>')+'<h3>Журнал движений</h3>'+caseMaterialHistory(id))}
function caseNetworkPanel(id){const rel=NVModel.caseRelations(state,id);return lobbySection("Источники и сотрудничество",lobbyLink("grid","Grid →"),(rel.deals.map(d=>finLine("Сделка · "+d.title,euroCents(NVModel.cents(d.budget)))).join("")||'<p class="hint">Case создан вручную или не связан с предложением Grid.</p>')+'<h3>Публикации об объекте</h3>'+(rel.posts.map(p=>networkPost(p,state.network?.deals?.find(d=>d.postId===p.id),rel.case)).join("")||'<p class="hint">Публикаций пока нет.</p>')+'<button data-route="network/case/'+esc(id)+'">＋ Публикация об объекте</button>')+caseRentalPanel(id)}
function detail(id,tab="overview"){
  const c=state.cases.find(x=>x.id===id)||sharedCase(id);
  if(!c)return heading("Project не найден");
  const rel=NVModel.caseRelations(state,id),shards=rel?.shards||[];
  const estimate=CaseEstimate.read(c.notes);
  const partner=counterpartyForProject(c);
  const partnerInfo='<section class="panel cp-case-link"><div class="panelhead"><h2>Заказчик / Auftraggeber</h2>'+(ownsCase(id)?button("Связать контрагента","link-counterparty",id):"")+'</div>'+
    (partner?'<button data-route="partner/'+esc(partner.id)+'" class="cp-case-partner"><strong>'+esc(partner.name)+'</strong><span>DC-монтаж · SolAn Plus · AC — электрики заказчика</span><small>Открыть профиль →</small></button>':'<p>Контрагент не назначен. Исторические проекты сохраняются без автоматически установленного заказчика.</p>')+'</section>';
  const mediaItems=(c.files||[]).map(a=>'<a class="case-media-item" href="'+a.data+'" download="'+esc(a.name)+'" target="_blank" rel="noopener noreferrer">'+(a.data.startsWith("data:image/")?'<img src="'+a.data+'" alt="'+esc(a.name)+'">':'<span class="case-media-pdf">PDF</span>')+'<small>'+esc(a.name)+'</small></a>').join("");
  const mediaPanel='<section class="panel case-media-panel"><div class="panelhead"><h2>Медиа объекта · '+(c.files||[]).length+'/8</h2>'+(ownsCase(id)?'<button data-action="new-case-media" data-id="'+esc(id)+'">＋ Фото / PDF</button>':'')+'</div><div class="case-media-grid">'+(mediaItems||'<p class="hint">Фото крыши, чертежи, Stringplan и документы объекта.</p>')+'</div></section>';
  const head='<button class="back" data-route="projects">← Projects</button><section class="panel casehead nv109-casehead">'+projectCover(c)+'<div><small>CASE · '+esc(c.id.slice(0,12))+'</small><h1>'+esc(c.title)+'</h1><p>'+esc(c.address||c.city)+'</p><span class="progress"><i style="width:'+pct(id)+'%"></i></span><small>Готовность '+pct(id)+'%</small></div></section>';
  if(!rel)return head+mediaPanel+PVProjectCard.render(c,state,false);
  const f=rel.finance,works='<section class="panel"><div class="panelhead"><h2>Shards · рабочие участки</h2>'+(finPlanEditable(f)?button("＋ Shard","new-shard",id):"")+'</div>'+(shards.map(shardRow).join("")||'<p>Добавьте первый рабочий участок.</p>')+'</section>';
  const monitors='<div class="nv109-case-monitors">'+[["work","Работы",shards.filter(s=>s.status==="accepted").length+" / "+shards.length,"Shards"],["work","Задачи",rel.tasks.filter(t=>t.status==="done").length+" / "+rel.tasks.length,"Tasks"],["finance","Бюджет",money(c.price)+" €","Case"],["finance","Merit",meritFmt(f.meritMinted),"WORK"],["stock","Материалы",rel.moves.length,"движений"],["people","Команда",rel.memberIds.length,"участников"]].map(([route,label,value,caption])=>'<button data-route="case/'+esc(id)+'/'+route+'"><small>'+label+'</small><b>'+esc(value)+'</b><span>'+caption+'</span></button>').join("")+'</div>';
  let body="";
  if(tab==="estimate"&&estimate.plan)body=estimatePanel(c,estimate.plan);
  else if(tab==="work")body=works;
  else if(tab==="people")body=partnerInfo+caseTeam(id);
  else if(tab==="stock")body=caseStockPanel(id);
  else if(tab==="finance")body=finCasePanel(id)+cashPanel(id)+lobbySection("Аренда · отдельные сделки",lobbyLink("case/"+id+"/network","Подробнее →"),finLine("Оплаченная аренда",euroCents(rel.rentals.filter(r=>r.status==="settled").reduce((n,r)=>n+NVModel.rentalQuote(r).gross,0)))+'<p class="hint">Аренда не вычитается автоматически из оплаты исполнителей и не создаёт WORK Merit.</p>');
  else if(tab==="network")body=caseNetworkPanel(id);
  else if(tab==="docs")body=mediaPanel+PVProjectCard.render(c,state,ownsCase(id));
  else{tab="overview";body=lobbySection("Паспорт и ход работ",lobbyLink("case/"+id+"/docs","Документы →"),'<p>'+esc(estimate.description||"Описание пока не добавлено.")+'</p>'+finLine("Оплачено заказчиком",euroCents(f.received))+finLine("Ожидают приёмки",String(shards.filter(s=>s.status==="submitted").length))+finLine("Распределено",euroCents(f.allocated))+finLine("Арендные сделки",String(rel.rentals.length)))+works+partnerInfo}
  const estimateLink=estimate.plan&&tab!=="estimate"?'<a class="estimate-shortcut" href="#case/'+esc(id)+'/estimate"><strong>Смета работ</strong><span>Часы, расходы и маржа →</span></a>':"";
  return '<div class="nv109-case">'+head+estimateLink+monitors+caseTabs(id,tab)+'<div class="nv109-case-content">'+body+'</div></div>';
}
const warehousePhotos=[
 {name:"novotegra Einlegeschiene",brand:"novotegra",kind:"Einlegesystem · не привязано к артикулу",image:"https://www.novotegra.com/fileadmin/_processed_/d/9/csm_einlegeschiene-kombination-03-0013xx_e3262ee072.jpg",url:"https://www.novotegra.com/fileadmin/04_Downloads/Certificates/novotegra_system/Montagesystemkatalog/DE-novotegra-Montage-Systemkatalog.pdf",verified:false},
 {name:"novotegra Kurzprofil C47",brand:"novotegra",kind:"Kurzprofil · не привязано к артикулу",image:"https://www.novotegra.com/fileadmin/_processed_/c/4/csm_kurzprofil-c47-03-001108_431a324da3.jpg",url:"https://www.novotegra.com/de/montagesysteme/fassade/metall-fassade-kurzprofil",verified:false},
 {name:"K2 SingleRail 36",brand:"K2 Systems",kind:"5,95 м · Artikel 2004260 · EN AW-6063 T66",image:"art/rail.webp",url:"https://catalogue.k2-systems.com/de/singlerail-36/2004260",verified:true,illustration:true}
];
const articleShops={
 "2004260":[{name:"MAXSEL",url:"https://www.maxsel.de/produkt/k2-2004260-singlerail-36-595-m/"},{name:"SolarLogic",url:"https://shop.solarlogic.de/de/products/k2-mounting-rail-singlerail-36-with-5-95-m-sl-000975"},{name:"SOLARCRAFT",url:"https://solarcraft.eu/de/k2-systems-singlerail-36-5-95-m-2004260.html"}],
 "03-001670":[{name:"BayWa r.e.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/c-n-schiene-37-5-90m.html"},{name:"MAXSEL",url:"https://www.maxsel.de/produkt/novotegra-03-001670-c-n-schiene-37-590m/"}],
 "03-001347":[{name:"BayWa r.e.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/schienenverbinder-set-c-n-37-s.html"},{name:"Elektroshop Bischof",url:"https://www.elektroshop-bischof.de/novotegra-03-001347-schienenverbinder-set-c-n-37-s"},{name:"MAXSEL",url:"https://www.maxsel.de/produkt/novotegra-03-001347/"}]
};
const shopLinks=sku=>(articleShops[String(sku||"").trim()]||[]).map(x=>'<a class="stocksource" target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">Купить · '+esc(x.name)+' ↗</a>').join(" ");
const systemReferences=[
 {title:"novotegra C-N-Schiene 37 · 5,90 м",article:"03-001670",detail:"Алюминиевый профиль 52 × 37 мм; не путать с Einlegeschiene.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/c-n-schiene-37-5-90m.html"},
 {title:"novotegra Schienenverbinder-Set C-N 37 S",article:"03-001347",detail:"Соединитель длиной 250 мм для C-N-Schiene 37.",url:"https://solar-distribution.baywa-re.de/montagesystem-novotegra/schienenverbinder-set-c-n-37-s.html"},
 {title:"K2 SingleRail 36 · 5,95 м",article:"2004260 · GTIN 4251786213344 · 36 × 39,4 мм · 4,579 кг",detail:"Алюминий EN AW-6063 T66. Система крепления подбирается по покрытию и статике в K2 Base.",url:"https://catalogue.k2-systems.com/de/singlerail-36/2004260"},
 {title:"K2 SingleRail 36/50 RailConnector",article:"Системный соединитель",detail:"Использовать только в совместимых конфигурациях по инструкции K2; момент затяжки и расположение проверять по актуальному руководству.",url:"https://catalogue.k2-systems.com/en/resource-access?file=4cd5ecfbec174967aacdf50449a1cfec"},
 {title:"novotegra Insertion System",article:"Комплект зависит от варианта монтажа",detail:"Insertion Rail Plus, Support Rail IR, EPDM-T и крепёж подбираются по конкретной схеме; комплект не универсальный.",url:"https://www.novotegra.com/fileadmin/04_Downloads/Mounting_instruction/Tile_Roof/Insertion_System_Side-Fix/mounting-instructions-tile-roof-side-fix-novotegra.pdf"}
];
function garage(view="material",caseId=null){
 const rel=caseId?NVModel.caseRelations(state,caseId):null;if(caseId&&!rel)return heading("Case не найден");const moves=(rel?rel.moves:state.moves).slice().reverse();
 const stockPhoto=m=>{const t=m.title.toLowerCase();if(m.sku==="2004260"&&/singlerail/.test(t))return warehousePhotos[2];return null};
 const visibleItems=state.garage.filter(m=>view==="fuhrpark"?["van","car","trailer"].includes(m.art):!["van","car","trailer"].includes(m.art));
 const inventory=visibleItems.map(m=>{const photo=stockPhoto(m),fallback=['rail','clamp','module','vertical','van','car','trailer'].includes(m.art)?'art/'+m.art+'.webp':null;
  return '<article class="panel item stockitem" data-stock="'+esc((m.title+" "+(m.sku||"")+" "+(m.brand||"")).toLowerCase())+'"><div class="stockmedia">'+(photo?'<img loading="lazy" src="'+esc(photo.image)+'" alt="'+esc(photo.name)+'" onerror="this.onerror=null;this.src=\''+(fallback||'art/rail.webp')+'\'">':fallback?'<img loading="lazy" src="'+fallback+'" alt="Схематичная иллюстрация; точный артикул не подтверждён">':'<span class="stocknoimage">'+icon("box")+'<small>Нет фото</small></span>')+'</div><div class="stockdetails">'+(photo?'<small class="stockbrand">'+esc(photo.brand)+'</small>':'<small class="stockbrand">Артикул / фото не верифицированы</small>')+'<h2>'+esc(m.title)+'</h2>'+(m.sku?'<small>ART. '+esc(m.sku)+'</small>':'<small>Артикул не указан</small>')+'<p>Остаток <strong>'+esc(m.qty)+'</strong> '+esc(m.unit||'шт.')+'</p>'+(photo?'<a class="stocksource" href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer">Каталог производителя ↗</a>':'')+shopLinks(m.sku)+'</div>'+(warehouse()?button("Операции","move",m.id):"")+'</article>'}).join("");
 const catalogue=warehousePhotos.map(p=>'<article class="stockcataloguecard"><img onerror="this.hidden=true" loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.name)+'"><div><small>'+esc(p.brand)+' · '+esc(p.kind)+'</small><strong>'+esc(p.name)+'</strong><a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">Официальный каталог ↗</a></div></article>').join("");
 const specs=systemReferences.map(r=>'<article class="taskrow"><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.article)+' · '+esc(r.detail)+'</small><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Инструкция / каталог производителя ↗</a></div></article>').join('');
 return '<div class="warehouse">'+(rel?'<div class="panel nv109-context"><button data-route="case/'+esc(caseId)+'/stock">← '+esc(rel.case.title)+'</button><p>Склад · выдача и возврат для выбранного Case</p></div>':"")+heading(view==="fuhrpark"?"Fuhrpark":"Lager",warehouse()?button("＋ Добавить позицию","new-material"):"")+'<div class="lagertabs"><button data-route="lager" class="'+(view==="material"?"active":"")+'">Material · Склад</button><button data-route="fuhrpark" class="'+(view==="fuhrpark"?"active":"")+'">Fuhrpark · Автопарк</button></div>'+'</div><div class="stocksummary"><span>ПОЗИЦИЙ <b>'+state.garage.length+'</b></span><span>ЕДИНИЦ <b>'+state.garage.reduce((sum,m)=>sum+m.qty,0)+'</b></span><span>ДВИЖЕНИЙ <b>'+state.moves.length+'</b></span></div><div class="columns stock"><section class="panel stockinventory"><div class="panelhead"><h2>'+(view==="fuhrpark"?"Транспорт":"Материалы и оборудование")+'</h2><small>'+visibleItems.length+' позиций</small></div><label class="stocksearch">Поиск по складу<input id="stock-search" type="search" placeholder="Название, профиль, производитель"></label><div class="cards">'+(inventory||'<p class="empty">В этом разделе пока нет позиций.</p>')+'</div></section><section class="panel"><div class="panelhead"><h2>История движений</h2></div>'+moves.map(m=>'<div class="taskrow"><div>'+esc(state.garage.find(i=>i.id===m.itemId)?.title||"Удалённая позиция")+' · '+esc(m.qty)+'<small>'+({issue:"Выдача",return:"Возврат",receive:"Приход",writeoff:"Списание"})[m.type]+' · '+esc(state.shards.find(s=>s.id===m.shardId)?.title||"Склад")+(m.type==="issue"||m.type==="return"?" · "+(m.recipientId?"Получатель: "+esc(state.crew.find(c=>c.id===m.recipientId)?.name||"Удалённый участник"):"Получатель не указан (старая запись)"):"")+'</small></div></div>').join("")+(!moves.length?"<p>Движений пока нет</p>":"")+'</section></div><section class="panel stockreferences"><div class="panelhead"><h2>Каталог производителей</h2><small>novotegra: фото производителя · K2: иллюстрация</small></div><p class="stockhint">Изображения novotegra требуют проверки соответствия конкретному артикулу; K2 SingleRail показан локальной иллюстрацией до проверки точного фото. Каталог не отражает остатки.</p><div class="stockcatalogue">'+catalogue+'</div><h2>Проверенные технические источники</h2><p class="stockhint">Не заменяет проектную статику, монтажную инструкцию и подбор крепежа под крышу. Не смешивать системы разных производителей без подтверждения совместимости.</p>'+specs+'</section>';
}

function tasks(){
 const pending=state.shards.filter(s=>s.status==="submitted");
 const active=state.shards.filter(s=>s.status==="draft");
 return heading("Shards & Tasks")+
 panel("Ожидают приёмки · "+pending.length,"projects",pending.map(shardRow).join("")||"<p>Нет заданий на проверке</p>")+
 panel("В работе · "+active.length,"projects",active.map(shardRow).join("")||"<p>Все задания обработаны</p>");
}

const communityLevel=xp=>xp>=650?"Эксперт":xp>=300?"Специалист":xp>=100?"Практик":"Новичок";
function communityStats(c){
  const owned=state.shards.filter(sh=>sh.assignee===c.id);
  const accepted=owned.filter(sh=>sh.status==="accepted").length;
  const tasks=state.tasks.filter(t=>t.assignee===c.id||(t.assignee===null&&owned.some(sh=>sh.id===t.shardId)));
  const done=tasks.filter(t=>t.status==="done").length;
  const verified=tasks.filter(t=>t.status==="done"&&state.shards.some(sh=>sh.id===t.shardId&&sh.status==="accepted")).length;
  const projects=new Set(owned.map(sh=>sh.caseId));
  for(const t of tasks){const sh=state.shards.find(sh=>sh.id===t.shardId);if(sh)projects.add(sh.caseId)}
  const xp=accepted*60+verified*15;
  const next=[100,300,650].find(n=>n>xp)||650;
  const prev=xp>=300?300:xp>=100?100:0;
  const percent=xp>=650?100:Math.round(100*(xp-prev)/(next-prev));
  const badges=[];
  if(c.role===roles[0])badges.push(["shield-check","Капитан"]);
  if(accepted>0)badges.push(["check-circle","Первый Shard"]);
  if(verified>=5)badges.push(["list-checks","5 принятых Tasks"]);
  if(accepted>=3)badges.push(["award","Надёжный партнёр"]);
  return {accepted,assigned:owned.length,done,verified,tasks:tasks.length,projects:projects.size,xp,next,percent,badges,level:communityLevel(xp)};
}
function memberAvatar(c,large=false){
  return '<span class="community-avatar'+(large?" is-large":"")+'">'+(c.avatar?'<img src="'+esc(c.avatar)+'" alt="">':'<span>'+esc(displayMemberName(c).trim().slice(0,1).toUpperCase())+'</span>')+'</span>';
}

function teamsWorkspace() {
  const people = new Map(state.crew.map(person=>[person.id,person]));
  const cards = state.teams.map(team => {
    const members = team.memberIds.map(id=>people.get(id)).filter(Boolean);
    const captain = people.get(team.captainId);
    const shards = state.shards.filter(sh=>sh.teamId===team.id);
    const tags = [team.name,team.description,...members.flatMap(c=>[displayMemberName(c),c.location,c.headline,...(c.skills||[])])].filter(Boolean);
    const facts = [[members.length,"Участники"],[shards.length,"Рабочие участки"],[new Set(shards.map(sh=>sh.caseId)).size,"Объекты"]];
    return `<article class="grid-team" data-grid-entry="${esc(tags.join(" ").toLocaleLowerCase())}">
      <div class="grid-team-head"><i>${icon("team")}</i><h2>${esc(team.name)}</h2>${lead()?button("Настроить","team-edit",team.id):""}</div>
      ${team.description?`<p>${esc(team.description)}</p>`:""}
      ${captain?`<a class="grid-captain" href="#member/${esc(captain.id)}">${memberAvatar(captain)}<span><small>Капитан бригады</small><strong>${esc(displayMemberName(captain))}</strong></span></a>`:""}
      <dl class="grid-team-facts">${facts.map(([n,label])=>`<div><dt>${label}</dt><dd>${n}</dd></div>`).join("")}</dl>
      <details><summary>Состав бригады</summary><div class="grid-team-members">${members.map(c=>`<a href="#member/${esc(c.id)}">${memberAvatar(c)}<span>${esc(displayMemberName(c))}<small>${esc(c.headline||displayRole(c))}</small></span></a>`).join("")}</div></details>
      ${shards.length?`<details><summary>Назначенные работы</summary>${shards.map(sh=>`<a class="grid-assignment" href="#shard/${esc(sh.id)}"><span>${esc(sh.title)}</span><small>${esc(statusName[sh.status])}</small></a>`).join("")}</details>`:""}
    </article>`;
  }).join("");
  const control = lead() ? button("＋ Создать бригаду","new-team") : "";
  const manager = people.get("lead");
  const managerLink = manager ? gridLink("member/"+manager.id,"Профиль руководителя →") : "";
  return `<div class="grid-directory-tools">${control}${managerLink}</div>`+
    (cards?gridSearchList("teams",`<div class="grid-team-list">${cards}</div>`):gridEmpty("Пока нет бригад","Бригада объединяет участников, капитана и назначенные Shard."));
}

function gridPeopleContent(view){
  if(view==="teams")return teamsWorkspace();
  if(view==="achievements"){
    const members=state.crew.map(c=>({c,stats:communityStats(c)})).sort((a,b)=>b.stats.xp-a.stats.xp);
    const body='<section class="community-section"><div class="community-section-head"><h2>Путь мастерства</h2><small>Проверяемые результаты работ</small></div><p class="community-muted">XP — отдельная пилотная оценка прогресса. 60 XP за принятый Shard и 15 XP за выполненную Task внутри принятого Shard. Финансовые Merit не затрагиваются.</p><div class="community-levels"><span>Новичок</span><span>Практик</span><span>Специалист</span><span>Эксперт</span></div><div class="community-rank-list">'+members.map((entry,i)=>'<button data-route="member/'+esc(entry.c.id)+'" class="community-rank-row"><b>#'+(i+1)+'</b>'+memberAvatar(entry.c)+'<span><strong>'+esc(displayMemberName(entry.c))+'</strong><small>'+esc(entry.stats.level)+' · '+entry.stats.accepted+' Shards принято</small></span><strong>'+entry.stats.xp+' XP</strong></button>').join("")+'</div></section>';
    return body;
  }
  const roster = state.crew.map(c => {
    const stats = communityStats(c), skills=c.skills||[];
    const words = [displayMemberName(c),displayRole(c),c.company,c.location,c.headline,...skills].filter(Boolean);
    return `<a class="grid-person community-person" href="#member/${esc(c.id)}" data-grid-entry="${esc(words.join(" ").toLocaleLowerCase())}">
      ${memberAvatar(c)}<div><strong>${esc(displayMemberName(c))}</strong><span>${esc(c.headline||displayRole(c))}</span>
      ${c.location?`<small>${esc(c.location)}</small>`:""}</div>
      ${skills.length?`<p>${esc(skills.slice(0,3).join(" · "))}</p>`:""}
      <footer><span>${esc(stats.level)}</span><small>Принято Shard · ${stats.accepted}</small></footer></a>`;
  }).join("");
  const self=actor(), stats=communityStats(self);
  const manage=`<details class="grid-account"><summary>Мой профиль и управление</summary>
    ${companyMainCaptain()}<p>${esc(stats.level)} · ${stats.xp} XP · выполнено задач ${stats.done}</p>
    <div class="grid-person-tools"><button data-route="member/${esc(self.id)}">Мой профиль</button><button data-route="grid/achievements">Достижения</button></div>${profile()}</details>`;
  return (lead()?`<div class="grid-directory-tools">${button("＋ Участник","new-crew")}</div>`:"")+
    gridSearchList("people",`<div class="grid-roster">${roster}</div>`)+manage;
}

function companyMainCaptain(){
  const manager=state.crew.find(c=>c.id==="lead"&&c.role===roles[0]);
  if(!manager)return "";
  return '<section class="company-captain-entry" aria-label="Главный управляющий профиль">'+
    '<div class="company-captain-overline"><span>'+esc(lab ? manager.company || "ALPHA LAB" : activeWorkspace().name)+'</span><small>Центр управления</small></div>'+
    '<div class="company-captain-person">'+memberAvatar(manager,true)+
    '<div><small>ГЛАВНЫЙ ПРОФИЛЬ · CAPTAIN</small><strong>'+esc(displayMemberName(manager))+'</strong><span>'+esc(manager.location||"Überlingen")+'</span></div>'+
    '<button data-route="member/'+esc(manager.id)+'">Открыть профиль →</button></div>'+
    '<div class="company-captain-relations"><span>'+state.cases.length+' Projects</span><span>'+state.teams.length+' Teams</span><span>'+state.crew.length+' участников</span></div></section>';
}
function contactDetail(label,content,href){
 if(!content)return "";
 return '<div class="company-contact-detail"><small>'+esc(label)+'</small>'+(href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(content)+'</a>':'<strong>'+esc(content)+'</strong>')+'</div>';
}
function memberContacts(c){
 let website="";
 try{if(typeof c.website==="string"){const url=new URL(c.website);if(url.protocol==="https:"&&/^[a-z0-9.-]+$/i.test(url.hostname))website=url.href}}catch{}
 const phone=typeof c.phone==="string"&&/^\+?[\d\s()-]{6,50}$/.test(c.phone)?c.phone:"";
 const email=typeof c.email==="string"&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)?c.email:"";
 const pieces=[
   contactDetail("Адрес",c.address||"",null),
   contactDetail("Телефон",phone,phone?"tel:"+phone.replace(/[^\d+]/g,""):null),
   contactDetail("Email",email,email?"mailto:"+email:null),
   contactDetail("Веб-сайт",website?website.replace(/^https:\/\//,""):null,website||null)
 ].join("");
 return pieces?'<section class="community-section company-contact-section"><div class="community-section-head"><h2>Контакты</h2><small>Данные профиля</small></div><div class="company-contact-grid">'+pieces+'</div></section>':"";
}
function captainRelations(c){
 const managing=c.id==="lead"&&c.role===roles[0];
 const memberTeams=state.teams.filter(t=>t.memberIds.includes(c.id));
 const title=managing?"Структура управления":"Рабочие связи";
 const manager=state.crew.find(t=>t.id==="lead"&&t.role===roles[0]);
 const allTeams=managing?state.teams:memberTeams;
 const membership=allTeams.map(t=>'<button class="company-network-link" data-route="grid/teams"><span>TEAM</span><strong>'+esc(t.name)+'</strong><small>'+t.memberIds.length+' участников</small></button>').join("");
 const ownShards=state.shards.filter(sh=>sh.assignee===c.id||sh.teamId&&memberTeams.some(t=>t.id===sh.teamId)||state.tasks.some(t=>t.shardId===sh.id&&t.assignee===c.id));
 const relatedProjectIds=managing?state.cases.map(p=>p.id):[...new Set(ownShards.map(sh=>sh.caseId))];
 const people=managing?state.crew.filter(person=>person.id!==c.id):state.crew.filter(person=>person.id!==c.id&&memberTeams.some(t=>t.memberIds.includes(person.id)));
 const relations='<div class="company-network">'+
  '<div class="company-network-company"><small>COMPANY</small><strong>SolAn Plus GmbH</strong><span>Внутренняя рабочая среда</span></div>'+
  '<div class="company-network-arrow">↓</div>'+
  '<div class="company-network-captain"><small>'+(managing?"ГЛАВНЫЙ CAPTAIN":"РУКОВОДСТВО")+'</small><strong>'+esc(managing?displayMemberName(c):displayMemberName(manager||{name:"Капитан"}))+'</strong><span>Управление Projects и Teams</span></div>'+
  '<div class="company-network-branches"><div><small>TEAMS · '+allTeams.length+'</small>'+(membership||'<span class="company-network-empty">Будут сформированы здесь</span>')+'</div>'+
  '<div><small>PROJECTS · '+relatedProjectIds.length+'</small>'+relatedProjectIds.slice(0,5).map(pid=>{
   const p=state.cases.find(x=>x.id===pid);return p?'<button class="company-network-link" data-route="case/'+esc(p.id)+'"><span>PROJECT</span><strong>'+esc(p.title)+'</strong><small>'+esc(p.city)+'</small></button>':"";
  }).join("")+(relatedProjectIds.length>5?'<button class="company-network-more" data-route="projects">Все Projects →</button>':"")+'</div></div>'+
  '<div class="cp-network-partners"><div class="company-network-people-header"><small>КОНТРАГЕНТЫ · '+state.counterparties.length+'</small><button data-route="projects">Projects / Партнёры →</button></div>'+
  state.counterparties.map(p=>'<button class="cp-network-partner" data-route="partner/'+esc(p.id)+'"><span>AUFTRAGGEBER</span><strong>'+esc(p.name)+'</strong><small>Заказы на DC · AC выполняет партнёр</small></button>').join("")+'</div>'+
  '<div class="company-network-people"><div class="company-network-people-header"><small>УЧАСТНИКИ · '+people.length+'</small><button data-route="grid/people">Все профили →</button></div>'+
  '<div class="company-network-people-list">'+(people.map(person=>'<button data-route="member/'+esc(person.id)+'" class="company-network-person">'+memberAvatar(person)+'<span><strong>'+esc(displayMemberName(person))+'</strong><small>'+esc(displayRole(person))+'</small></span></button>').join("")||'<span class="company-network-empty">Участники появятся здесь после добавления профилей</span>')+'</div></div></div>';
 return '<section class="community-section company-network-section"><div class="community-section-head"><h2>'+title+'</h2><small>Связи формируются из Teams, Projects и назначений</small></div>'+relations+'</section>';
}
function memberProfile(id){
 const c=state.crew.find(x=>x.id===id);
 if(!c)return heading("Профиль не найден");
 const st=communityStats(c),own=c.id===state.actor;
 const captain=c.id==="lead"&&c.role===roles[0];
 const groups=state.teams.filter(t=>t.memberIds.includes(c.id));
 const shardList=state.shards.filter(sh=>sh.assignee===c.id||(sh.teamId&&groups.some(t=>t.id===sh.teamId))||state.tasks.some(t=>t.shardId===sh.id&&t.assignee===c.id));
 const projectIds=state.cases.filter(p=>NVModel.caseRelations(state,p.id).memberIds.includes(c.id)).map(p=>p.id);
 const projectLinks=projectIds.map(pid=>{
  const p=state.cases.find(x=>x.id===pid);
  if(!p)return "";
  return '<button data-route="case/'+esc(pid)+'" class="community-profile-project"><img src="art/roof.webp" alt=""><span><strong>'+esc(p.title)+'</strong><small>'+esc(p.city)+' · '+shardCount(state.shards.filter(sh=>sh.caseId===pid).length)+'</small></span><b>›</b></button>';
 }).join("");
 const badges=st.badges.map(([kind,name])=>'<span class="community-earned-badge">'+esc(name)+'</span>').join("")||'<p class="community-muted">Достижения появятся после приёмки Shards и выполненных Tasks.</p>';
 const leadLabel="";
 const captainNote="";
 return '<div class="community community-profile"><button class="back" data-route="grid/people">← Сообщество</button>'+
 '<section class="community-profile-hero"><div class="community-profile-cover"><img src="art/hero.webp" alt="PV-панели" loading="lazy"></div>'+
 '<div class="community-profile-summary">'+memberAvatar(c,true)+
 '<div><small>'+(captain?esc(activeWorkspace().name)+' · COMPANY PROFILE':'NVTSK MEMBER · '+esc(st.level))+'</small>'+alphaLabel(c)+'<h1>'+esc(displayMemberName(c))+'</h1><p>'+esc(c.headline||displayRole(c))+'</p><span>'+esc(c.location||"Город не указан")+'</span>'+leadLabel+'</div>'+
 (own?button("Редактировать профиль","edit-profile",c.id):"")+'</div></section>'+
 '<div class="community-profile-stats"><div><b>'+projectIds.length+'</b><small>Projects</small></div><div><b>'+st.assigned+'</b><small>Shards</small></div><div><b>'+st.done+'</b><small>Tasks готово</small></div><div><b>'+st.xp+'</b><small>XP</small></div></div>'+
 captainNote+memberContacts(c)+captainRelations(c)+(own?meritPassportPanel(c.id):"")+
 '<div class="community-profile-grid"><section class="community-section"><h2>О себе</h2><p class="community-about">'+esc(c.bio||"Описание профиля пока не заполнено.")+'</p>'+
 '<h3>Специализация</h3><div class="community-person-skills">'+((c.skills||[]).map(k=>'<em>'+esc(k)+'</em>').join("")||'<span class="community-muted">Навыки пока не указаны</span>')+'</div>'+
 '<h3>'+(captain?"Projects компании":"Участие в Projects")+'</h3>'+(projectLinks||'<p class="community-muted">Пока нет назначений</p>')+'</section>'+
 '<aside class="community-section"><h2>Путь мастерства</h2><div class="community-progress"><strong>'+st.xp+' XP</strong><span>'+esc(st.level)+'</span><div class="community-progress-rail"><i style="width:'+st.percent+'%"></i></div><small>Следующий порог · '+st.next+' XP</small></div>'+
 '<h3>Достижения</h3><div class="community-badges">'+badges+'</div><small class="community-muted">XP не связан с Merit или выплатами.</small></aside></div>'+
 '<section class="community-section community-profile-activity"><div class="community-section-head"><div><h2>Подтверждённые работы</h2><small>История принятых Shards</small></div></div><div class="community-work-log">'+
 (communityWorkFeed(acceptedWorkEvents(c.id))||'<p class="community-muted">Принятых работ пока нет.</p>')+'</div></section></div>';
}
function alphaLabel(c){return c.alphaId?'<span class="nv110-alpha" title="Локальная метка пилотного профиля, не верификация">'+esc(c.alphaId)+'</span>':""}
function profile(){if(lab)return lobbySection("Тестовый участник",lobbyLink("alpha-lab","Сменить участника →"),'<p>'+esc(actor().name)+' · LAB</p>');return '<section class="panel"><h2>Мой аккаунт</h2><p>'+esc(account()?.email)+'</p><p>'+esc(actor()?.name)+' · '+esc(actor()?.role)+'</p>'+alphaLabel(actor())+'<div class="nv104-actions">'+button("Редактировать профиль","edit-profile",state.actor)+'<button data-auth-logout>Выйти</button></div><label class="nv110-import">Импорт персонального профиля<input id="nv110-profile-import" type="file" accept=".json,application/json"></label><p class="hint">Обновляет только имя, описание, регион, навыки и метку ALPHA. Проекты, деньги, Merit, склад, контакты и аккаунт сохраняются.</p></section>'}
function field(){
 const mine=state.shards.filter(s=>s.assignee===state.actor);
 const active=mine.filter(s=>s.status==="draft"),review=mine.filter(s=>s.status==="submitted"),done=mine.filter(s=>s.status==="accepted");
 const next=active[0]||review[0]||done[0],nextCase=next&&state.cases.find(c=>c.id===next.caseId);
 const hero='<section class="fieldhero"><div class="fieldheroimage" role="img" aria-label="PV-монтаж"></div><div class="fieldherocontent"><span class="fieldeyebrow">NVTSK / FIELD OPERATIONS</span><h1>Рабочее место монтажника</h1><p>Задания, материалы, инструкции и передача работ на приёмку.</p><div class="fieldherolinks"><button data-route="projects">Projects / Tasks</button><button data-route="lager">Lager</button></div></div></section>';
 const briefing=next?'<section class="panel fieldbrief"><div class="panelhead"><h2>Следующее задание</h2><span class="fieldstatus">'+esc(statusName[next.status])+'</span></div><div class="fieldbriefbody"><img src="art/roof.webp" alt="Иллюстрация PV-крыши"><div><strong>'+esc(next.title)+'</strong><small>'+esc(nextCase?.title||"Project")+' · '+esc(nextCase?.city||"")+'</small><p>'+esc(next.notes||"Откройте Project для просмотра материалов и инструкций.")+'</p><button data-route="case/'+esc(next.caseId)+'">Открыть →</button></div></div></section>':'<section class="panel fieldbrief"><h2>Нет назначенных заданий</h2><p>Капитан назначает исполнителя через Shard.</p></section>';
 const cards=mine.map(s=>{const c=state.cases.find(c=>c.id===s.caseId);return '<article class="fieldtask fieldtaskvisual"><img src="art/roof.webp" alt="Иллюстрация PV-монтажа" loading="lazy"><div class="fieldtaskcontent"><div class="fieldtaskhead"><div><strong>'+esc(s.title)+'</strong><small>'+esc(c?.title||"Project")+' · '+esc(c?.city||"")+'</small></div><span class="fieldstatus">'+esc(statusName[s.status])+'</span></div><p class="fieldtasknotes">'+esc(s.notes||"Подробности в карточке Project")+'</p><div class="fieldtaskbuttons"><button data-route="shard/'+esc(s.id)+'">Tasks →</button><button data-route="case/'+esc(s.caseId)+'">Открыть →</button>'+(s.status==="draft"?'<button data-action="submit" data-id="'+esc(s.id)+'">Передать на приёмку</button>':'')+'</div></div></article>'}).join("")||'<p>Назначенных заданий пока нет.</p>';
 const steps='<section class="panel fieldworkflow"><h2>Порядок работы</h2><div class="fieldsteps"><div><span>01</span>'+icon("layers")+'<strong>Открыть Project</strong><small>Объект и инструкции</small></div><div><span>02</span>'+icon("box")+'<strong>Получить материалы</strong><small>Выдача для Shard</small></div><div><span>03</span>'+icon("settings")+'<strong>Монтаж</strong><small>По проекту и технике безопасности</small></div><div><span>04</span>'+icon("check")+'<strong>Приёмка</strong><small>Передать результат</small></div></div></section>';
 return hero+'<div class="fieldsummary">'+stat(icon("clock"),"В работе",active.length,"")+stat(icon("check"),"На проверке",review.length,"")+stat(icon("layers"),"Принято",done.length,"")+'</div>'+briefing+panel("Мои задания · "+mine.length,"projects",cards)+steps+'<p class="fieldwarning">Иллюстрации не заменяют монтажный проект. Для работ на крыше обязательна защита от падения. AC-подключение выполняет уполномоченная Elektrofachkraft.</p>';
}
function pulse(){
 const total=state.cases.reduce((n,c)=>n+c.price,0);
 const allocated=state.shards.reduce((n,s)=>n+s.price,0);
 const accepted=state.shards.filter(s=>s.status==="accepted").reduce((n,s)=>n+s.price,0);
 const pending=state.shards.filter(s=>s.status==="submitted").length;
 return heading("Project Pulse")+
 '<div class="pulsemetrics">'+stat(icon("coins"),"Бюджет Projects",money(total)+" €","")+
 stat(icon("layers"),"Распределено по Shards",money(allocated)+" €","")+
 stat(icon("check"),"Принято",money(accepted)+" €","")+
 stat(icon("clock"),"Ожидают приёмки",pending,"")+'</div>'+
 panel("Готовность Projects","projects",state.cases.map(row).join("")||"<p>Projects пока нет</p>")+
 '<p class="pulsehint">В бесплатной модели Merit генерируются через Shards и разблокируются после приёмки и оплаты. Исторические Case v104 рассчитываются отдельно.</p>';
}
function settings(){if(lab)return alphaLabPage();return heading("Настройки")+'<section class="panel workspace-admin"><h2>Рабочее пространство</h2><p>Активное пространство: <strong>'+esc(activeWorkspace().name)+'</strong>. Case, участники и склад хранятся отдельно для каждой компании.</p>'+workspaceBadge()+'<div class="workspace-admin-actions"><button data-route="company">Открыть профиль компании →</button>'+(lead()?'<button data-action="new-crew">＋ Профиль участника</button>':'')+'</div><p class="hint">Участник создаётся внутри активной фирмы и относится только к ней. Приглашения по email требуют подключения сервера.</p></section>'+'<section class="panel company-identity-settings"><div><small>КОМПАНИЯ · ВНУТРЕННЕЕ ПРОСТРАНСТВО</small><strong>'+esc(activeWorkspace().name)+'</strong><p>Проекты, учёт и Teams этой компании · данные пока хранятся локально.</p></div><div><small>РАЗРАБОТЧИК И ПЛАТФОРМА</small><strong>'+esc(APP_BRAND.developer)+'</strong><p>Программное обеспечение NVTSK SYSTEM. Отдельная система учётных записей и синхронизации пока не подключена.</p></div></section>'+profile()+'<div class="panel tools"><button data-route="grid/people">Сообщество и роли</button>'+button(lab?"Вернуться к рабочим данным":"Открыть ALPHA LAB","sandbox")+button("Экспорт JSON","export")+(lead()?'<label>Импорт JSON<input id="import" type="file" accept=".json,application/json"></label>'+ (history.length?button("Time Machine · отменить последнюю операцию","undo"):""):"")+'</div><p>Профили действуют на этом устройстве. История хранит последние 10 операций.</p>'}

const SOCIAL_KEY=KEY===BASE?BASE+"_social":KEY+"_social";
function acceptedWorkEvents(memberId=null){
 return state.shards.filter(sh=>sh.status==="accepted"&&sh.assignee&&(memberId===null||sh.assignee===memberId)).slice().reverse().map(sh=>({
  sh,owner:state.crew.find(c=>c.id===sh.assignee),project:state.cases.find(c=>c.id===sh.caseId),
  completed:state.tasks.filter(t=>t.shardId===sh.id&&t.status==="done").length
 }));
}
function communityWorkFeed(events){
 return events.map(({sh,owner,project,completed})=>'<article class="community-work-event" data-workevent="'+esc(sh.id)+'"><div class="community-work-symbol">'+icon("check")+'</div><div class="community-work-copy"><span class="community-work-label">ПОДТВЕРЖДЁННЫЙ РЕЗУЛЬТАТ</span><strong>'+esc(owner?displayMemberName(owner):"Участник")+' · принят Shard</strong><p>'+esc(sh.title)+(completed?' · '+completed+' Tasks':"")+'</p><small>'+esc(project?.city||"")+' · приёмка завершена</small><div class="community-work-links"><button data-route="member/'+esc(sh.assignee)+'">Профиль</button><button data-route="shard/'+esc(sh.id)+'">Открыть Shard →</button></div></div></article>').join("");
}

/* NVTSK 0.6: approved visual reference, live Case/Shard/Lager data, one active workspace. */
function dashboardV66(){
 const visibleCases=[...new Map([...state.cases,...incomingCases()].map(c=>[c.id,c])).values()];
 const active=visibleCases.filter(c=>pct(c.id)!==100).length,review=state.shards.filter(x=>x.status==="submitted");
 const materials=state.garage.filter(x=>!["van","car","trailer"].includes(x.art));
 const assigned=state.shards.filter(x=>x.assignee===state.actor&&x.status!=="accepted");
 const tasks=lead()?review.concat(state.shards.filter(x=>x.status==="draft").slice(0,3)):assigned;
 const kpis=[["layers","Активные Case",active,"projects"],["team","Участники",state.crew.length,"team"],["box","Lager",materials.length+" позиций","lager"],["coins","К выплате",euroCents(NVModel.financialMember(state,state.actor).available),"finance"],["coins","Merit",money(NVModel.financialMember(state,state.actor).merit/100),"merit"]];
 const cards=state.cases.slice().reverse().slice(0,3).map((c,i)=>{
   const shards=state.shards.filter(x=>x.caseId===c.id),percent=pct(c.id);
   const status=percent===100?"Принято":shards.some(x=>x.status==="submitted")?"Приёмка":shards.length?"В работе":"Планирование";
   return '<button class="ref66-project" data-route="case/'+esc(c.id)+'"><span class="ref66-project-photo"><img src="art/'+(["tile0","tile1","tile2"][i]||"roof")+'.webp" loading="lazy" alt="PV-объект"><span class="ref66-status '+(percent===100?"done":status==="Приёмка"?"review":"")+'">'+status+'</span></span><span class="ref66-project-body"><small>Case · '+esc(c.id.slice(0,9))+'</small><strong>'+esc(c.city||c.title)+'</strong><span>'+esc(c.title)+'</span><span class="ref66-progress"><i style="width:'+percent+'%"></i></span><small>'+percent+'% выполнено</small></span></button>';
 }).join("")||'<p class="ref66-empty">Пока нет объектов. Создайте первый Case.</p>';
 const rows=tasks.slice(0,4).map(x=>'<button class="ref66-task" data-route="case/'+esc(x.caseId)+'"><span class="ref66-check '+(x.status==="submitted"?"review":"")+'"></span><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.status==="submitted"?"Ожидает приёмки":"В работе / назначение")+'</small></span><b>›</b></button>').join("")||'<p class="ref66-empty">Нет задач, требующих внимания</p>';
 const progress=visibleCases.length?Math.round(visibleCases.reduce((n,c)=>n+pct(c.id),0)/visibleCases.length):0;
 const commandStats=[["layers","Активные Case",active,"projects"],["team","Участники",state.crew.length,"team"],["layers","Shards в работе",state.shards.filter(x=>x.status==="draft"&&x.assignee).length,"projects"],["layers","На приёмке",review.length,"projects"]];
 const commandCards=commandStats.map(([ico,label,value,route])=>'<button class="nv89-stat" data-route="'+route+'"><span>'+icon(ico)+'</span><strong>'+value+'</strong><small>'+label+'</small></button>').join("");
 const quick=lead()?[["new-case","Новый Case","layers",true],["new-shard","Создать Shard","layers",true],["new-crew","Новый участник","team",true],["new-material","Новый материал","box",true]]:[];
 return '<div class="ref66"><section class="ref66-scene"><div class="ref72-ambient" aria-hidden="true"><span class="ref72-orbit"></span><span class="ref72-beam"></span></div><div class="ref66-toolbar">'+workspaceBadge()+'<button data-route="projects" aria-label="Проекты">'+icon("search")+'</button><button data-route="settings" aria-label="Настройки">'+icon("settings")+'</button><span class="ref66-date">'+new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"})+'</span></div></section><section class="nv89-command" aria-label="Command Center"><div class="nv89-heading"><span>COMMAND CENTER</span><small>LOCAL FIRST</small></div><div class="nv86-identity-rating"><div class="nv86-coin-slot">'+(activeWorkspace().id==="solan-plus"?'<div class="nv85-coin-wrap"><div class="nv85-coin">'+Array.from({length:13},(_,i)=>'<i class="nv89-edge" style="--z:'+(i-6)*0.65+'px"></i>').join("")+'<div class="nv85-coin-face nv85-front"><img src="art/solan-medallion-v85.svg" alt="Логотип SolAn Plus GmbH"></div><div class="nv85-coin-face nv85-back"><img src="art/solan-medallion-v85.svg" alt=""></div></div></div>':'<span class="nv86-workspace-mark">'+esc(activeWorkspace().symbol||activeWorkspace().name[0])+'</span>')+'</div><div class="nv86-rating"><div class="nv86-rating-top"><span>Рейтинг компании</span><strong>Нет оценки</strong></div><div class="nv86-rating-track" role="img" aria-label="Рейтинг ещё не рассчитан"><span></span></div><div class="nv86-rating-ticks"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div><small>Рейтинг появится после подтверждённых оценок Case.</small></div></div><div class="nv89-stats">'+commandCards+'</div><button class="nv89-progress" data-route="projects"><span>Общий прогресс Case <b>'+progress+'%</b></span><i><em style="width:'+progress+'%"></em></i></button></section><div class="ref83-quick-above-map"><section class="ref66-panel ref66-actions"><div class="ref66-panel-title"><h2>Быстрые действия</h2></div><div class="ref66-action-grid">'+quick.map(([route,name,ico,action])=>'<button '+(action?'data-action="'+route+'"':'data-route="'+route+'"')+'>'+icon(ico)+'<span>'+name+'</span></button>').join("")+'</div></section></div><div class="ref66-map-wide">'+caseMiniMap().replace('<button data-route="projects">Все →</button>','')+'</div><div class="ref66-metrics">'+kpis.map(([ico,name,value,route])=>'<button class="ref66-kpi" data-route="'+route+'"><span>'+icon(ico)+'</span><span><small>'+name+'</small><strong>'+esc(value)+'</strong></span></button>').join("")+'</div><div class="ref66-panels"><section class="ref66-panel ref66-projects"><div class="ref66-panel-title"><h2>Мои проекты</h2><button data-route="projects" aria-label="Все проекты">›</button></div><div class="ref66-project-grid">'+cards+'</div></section><section class="ref66-panel ref66-tasks"><div class="ref66-panel-title"><h2>Мои задачи</h2><button data-route="tasks" aria-label="Все задачи">›</button></div>'+rows+'</section></div><div class="ref66-bottom"><span>LOCAL FIRST · '+esc(activeWorkspace().name)+'</span></div></div>';
}


// Personal Command Lobby — actual local cash records separate from Merit and Case budgets.
const cashLabels={income:{customer:"Оплата заказчика",pay:"Оплата моей работы",refund:"Возврат средств",other:"Другое поступление"},expense:{materials:"Материалы",fuel:"Топливо",travel:"Транспорт / проживание",tools:"Инструменты",crew:"Оплата бригаде",other:"Прочие расходы"}};
function ownCash(caseId=null){return (state.cashLedger||[]).filter(e=>e.memberId===state.actor&&(caseId===null||e.caseId===caseId))}
function cashTotals(entries){let incoming=0,outgoing=0;for(const e of entries){if(e.voided)continue;if(e.direction==="income")incoming+=e.cents;else outgoing+=e.cents}return {incoming,outgoing,balance:incoming-outgoing}}
const euroCents=c=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(c/100);
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function cashTiles(t){return '<div class="nv103-cash-grid"><div><small>Поступления</small><strong class="nv103-in">'+euroCents(t.incoming)+'</strong></div><div><small>Расходы</small><strong class="nv103-out">'+euroCents(t.outgoing)+'</strong></div><div><small>Чистый поток</small><strong>'+euroCents(t.balance)+'</strong></div></div>'}
function cashActions(id=""){return '<div class="nv103-actions"><button data-action="new-cash-income" data-id="'+esc(id)+'">＋ Поступление</button><button data-action="new-cash-expense" data-id="'+esc(id)+'">− Расход</button></div>'}
function cashRows(entries){return entries.slice().reverse().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const p=state.cases.find(c=>c.id===e.caseId);return '<article class="nv103-entry'+(e.voided?' is-void':'')+'"><div><small>'+esc(e.date)+' · '+esc(cashLabels[e.direction][e.category])+'</small><strong>'+(p?esc(p.title):"Без объекта")+'</strong>'+(e.note?'<span>'+esc(e.note)+'</span>':'')+(p?'<button data-route="case/'+esc(p.id)+'">Открыть Case →</button>':'')+'</div><div class="nv103-entry-value"><b class="'+(e.direction==="income"?"nv103-in":"nv103-out")+'">'+(e.direction==="income"?"+":"−")+euroCents(e.cents)+'</b>'+(e.voided?'<small>Аннулирована</small>':'<button data-action="cash-void" data-id="'+esc(e.id)+'">Аннулировать</button>')+'</div></article>'}).join("")||'<p class="nv103-empty">Пока нет денежных операций.</p>'}
function lobbySection(title,link,body){return '<section class="panel nv103-panel"><div class="nv103-section-head"><h2>'+title+'</h2>'+link+'</div>'+body+'</section>'}
function lobbyLink(route,label){
  const outward=label.endsWith(" ↗");
  return '<button data-route="'+esc(route)+'">'+(outward?esc(label.slice(0,-2))+' <svg class="direction-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+iconPaths.open+'"/></svg>':esc(label))+'</button>';
}
function lobbyRow(route,title,sub,value,progress){return '<button class="nv103-project-row" data-route="'+esc(route)+'"><span><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small>'+(progress===undefined?"":'<span class="nv103-track"><i style="width:'+progress+'%"></i></span>')+'</span><b>'+esc(value)+'</b></button>'}

function finLine(label,value){return '<div class="nv104-line"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>'}
function meritFmt(n){return (n/100).toLocaleString("ru-RU",{maximumFractionDigits:2})+" M"}
function ownsCase(id){return NVModel.ownsCase(state,id)}
function managesRental(id){return NVModel.managesRental(state,id)}
function myRentalProfile(){return (state.rentalPartners||[]).find(p=>p.memberId===state.actor)}
function rentalProfileAction(){const p=myRentalProfile();return p?'<button data-route="rental-partner/'+esc(p.id)+'">Моя аренда →</button>':button("＋ Сдавать в аренду","new-rental-partner")}
function meritPassportPanel(id=state.actor,full=false){
 const p=NVModel.meritPassport(state,id),t=p.totals;
 const entries=full?p.entries:p.entries.filter(e=>e.status==="released").slice(0,4);
 const labels={released:"Начислено",locked:"Ожидает расчёта",historical:"Историческое"};
 const rows=entries.map(e=>'<article class="nv111-event"><div class="nv111-event-main"><small class="nv111-source">'+esc(e.direction)+' · '+esc(e.source)+'</small><strong>'+esc(e.title)+'</strong><span>'+esc(e.detail)+'</span><small>'+esc(e.date|| (e.status==="locked"?"Дата начисления ещё не определена":"Дата расчёта не записана"))+' · '+labels[e.status]+'</small></div><div class="nv111-event-side"><b class="nv111-'+e.status+'">'+(e.status==="released"?"+":"")+meritFmt(e.amount)+'</b>'+(e.shardId?lobbyLink("shard/"+e.shardId,"Shard →"):e.rentalId?lobbyLink("rental/"+e.rentalId,"Сделка →"):e.caseId?lobbyLink("case/"+e.caseId+"/finance","Case →"):"")+'</div></article>').join("");
 const breakdown=full?'<details class="nv111-breakdown"><summary>Сводка по направлениям</summary>'+Object.entries(p.directions).map(([k,x])=>finLine(k+" · "+NVModel.meritDirections[k],meritFmt(x.released)+" · ожидает "+meritFmt(x.locked)+(x.historical?" · исторические "+meritFmt(x.historical):""))).join("")+'</details>':"";
 const holder=state.crew.find(person=>person.id===id);
 const identity=full && holder ? '<div class="passport-id"><img src="art/nvtsk-approved.webp" alt=""><div><small>MERIT PASSPORT</small><strong>'+esc(displayMemberName(holder))+'</strong><span>'+esc(holder.company || (lab ? "ALPHA LAB" : activeWorkspace().name))+'</span></div></div>' : "";
 return lobbySection("Цифровой паспорт Merit",full?"":lobbyLink("merit","Все события →"),identity+'<div class="nv111-balance"><div><small>Подтверждённые Merit</small><b>'+meritFmt(t.released)+'</b></div><div><small>Ожидают расчёта</small><b>'+meritFmt(t.locked)+'</b></div></div>'+(t.historical?finLine("Исторические Merit · v104",meritFmt(t.historical)):"")+breakdown+'<div class="nv111-events">'+(rows||'<p class="hint">Подтверждённые события появятся после расчёта по Case или аренде.</p>')+'</div>'+(full?'<p class="hint">Паспорт формируется из финансовых записей. Направления — категории событий, не дополнительные токены. Черновики и незакрытые работы не дают доступных Merit. Исторические правила v104 показаны отдельно.</p>':""))
}
function finOwner(f){return f.ownerId===state.actor}
function finEditable(f){return finOwner(f)&&!f.settled&&f.receipts.length===0}
function finPlanEditable(f){return finEditable(f)&&!(f.policy==="free-v105"&&f.active)}
const finStatus={expected:"Ожидается",review:"На приёмке",confirmed:"Подтверждено",available:"К выплате",paid:"Выплачено",unassigned:"Не назначено"};
function finMemberPanel(id=state.actor){const f=NVModel.financialMember(state,id);return lobbySection("Мой заработок",lobbyLink("finance","Расчёты →"),'<div class="nv104-grid">'+[["Ожидается",f.expected],["На приёмке",f.review],["Подтверждено",f.confirmed],["К выплате",f.available],["Выплачено / оставлено",f.paid]].map(([k,v])=>'<div><small>'+k+'</small><b>'+euroCents(v)+'</b></div>').join("")+'</div>'+finLine("Merit · подтверждено",meritFmt(NVModel.meritPassport(state,id).totals.released))+finLine("Merit · ожидает расчёта",meritFmt(f.meritLocked))+lobbyLink("merit","Цифровой паспорт →")+'<p class="nv103-muted">Доли Merit включают замороженные начисления. Merit не удерживаются из заработка и не являются евро. Выплаты подтверждаются вручную.</p>'+f.cases.map(p=>{const c=state.cases.find(x=>x.id===p.caseId);return lobbyRow("case/"+c.id,c.title,"Заработок · "+euroCents(p.net)+" · "+meritFmt(p.merit)+" / заморожено "+meritFmt(p.meritLocked||0),euroCents(p.available)+" к выплате")}).join(""))}
function finCasePanel(id){const f=NVModel.financialCase(state,id),owner=finOwner(f),editable=finEditable(f),shards=state.shards.filter(s=>s.caseId===id);
const free=f.policy==="free-v105";const overview=finLine("Бюджет работ",euroCents(f.budget))+(free?finLine("Комиссии платформы","0,00 €")+finLine("Распределено по Shards",euroCents(f.allocated))+finLine("Осталось распределить",euroCents(f.remaining)):finLine("Историческая комиссия Case 1%",euroCents(f.caseFee))+finLine("Исторические комиссии Shards",euroCents(f.shardFees)))+finLine("К оплате заказчиком",euroCents(f.due))+finLine("Подтверждено поступлений",euroCents(f.received))+finLine("Осталось получить",euroCents(f.due-f.received))+finLine("Merit · эмиссия",meritFmt(f.meritMinted))+(free?finLine("Merit · заморожено",meritFmt(f.meritLocked))+finLine("Merit · разблокировано",meritFmt(f.meritReleased))+finLine("Merit · фонд платформы",meritFmt(f.meritPlatform+f.meritPlatformLocked)):"")+(f.settled&&!free?finLine("Резерв Merit · расчётное отчисление",euroCents(f.reserve))+finLine("Развитие",euroCents(f.development))+finLine("Операционные расходы",euroCents(f.operations)):"");
const rows=f.rows.map(r=>'<div class="nv104-line"><span>'+esc(r.memberId?member(r.memberId):"Не назначено")+' · '+esc(r.className)+'<small>'+esc(r.shardId?shards.find(s=>s.id===r.shardId)?.title:"Остаток Case")+' · '+esc(f.settled&&f.payouts.some(p=>p.memberId===r.memberId)?"Выплачено / оставлено":finStatus[r.status])+'</small></span><strong>'+euroCents(r.net)+'</strong></div>').join("");
const people=f.people.map(p=>'<div class="nv104-line"><span>'+esc(member(p.memberId))+'<small>Нетто '+euroCents(p.net)+' · комиссия '+euroCents(p.commission)+'</small></span><div><b>'+euroCents(p.paid||p.available)+'</b>'+(owner&&p.available>0?'<button data-action="new-finance-payout" data-id="'+esc(id)+'" data-member="'+esc(p.memberId)+'">'+(p.memberId===f.ownerId?"Подтвердить остаток":"Подтвердить выплату")+'</button>':"")+'</div></div>').join("");
let actions="";
if(owner&&!f.active&&f.ready)actions+=button("Активировать бесплатный план","finance-activate",id);
if(editable&&f.active)actions+=free?button("Вернуть план в редактирование","finance-deactivate",id):button("Перевести на бесплатную модель","finance-convert",id);
if(owner&&f.active&&!f.settled&&f.received<f.due)actions+=button("＋ Подтвердить поступление","new-finance-receipt",id);
if(owner&&f.active&&!f.settled&&f.fullyPaid&&f.allAccepted)actions+=button("Закрыть расчёт · разблокировать выплаты","finance-settle",id);
if(editable&&!f.active&&!shards.some(s=>s.status!=="draft"))actions+=button("Изменить бюджет Case","new-finance-case-budget",id);
if(editable&&!f.active&&!shards.length&&!(state.cashLedger||[]).some(e=>e.caseId===id)&&!(state.rentals||[]).some(r=>r.caseId===id)&&!(state.network?.deals||[]).some(d=>d.caseId===id))actions+=button("Отменить Case","finance-case-cancel",id);
return '<section class="panel nv103-panel nv104-fin"><div class="nv103-section-head"><h2>Финансовый расчёт Case</h2><span class="nv104-tag">'+(f.settled?"РАСЧЁТ ЗАКРЫТ":free?(f.active?"БЕСПЛАТНЫЙ · АКТИВЕН":"БЕСПЛАТНЫЙ · ПЛАН"):"ИСТОРИЧЕСКИЙ v104")+'</span></div>'+overview+(free&&!f.ready?'<p class="nv104-warn">Для активации нужны минимум один Shard, 100% бюджета и организатор с положительной долей работы в каждом Shard.</p>':"")+(!f.feeCovered?'<p class="nv104-warn">Оставьте в Case '+euroCents(f.shardFees)+' на комиссии Shards. Сейчас остаток '+euroCents(f.remaining)+'.</p>':"")+'<div class="nv104-actions">'+actions+'</div><h3>Доли участия · план / начисления</h3>'+rows+(free?'<h3>Merit участников</h3>'+f.people.map(p=>finLine(member(p.memberId),meritFmt(p.merit+p.meritLocked))).join('')+finLine('Фонд NVTSK',meritFmt(f.meritPlatform+f.meritPlatformLocked))+(f.unassignedMerit?finLine('Пока не назначено',meritFmt(f.unassignedMerit)):''):'')+(f.settled?'<h3>Расчёты с участниками</h3>'+people:"")+(f.receipts.length?'<h3>Подтверждённые поступления</h3>'+f.receipts.map(e=>finLine(e.date+" · "+e.ref,euroCents(e.cents))).join(""):"")+(f.payouts.length?'<h3>Подтверждённые выплаты / остаток</h3>'+f.payouts.map(e=>finLine(e.date+" · "+member(e.memberId)+" · "+e.ref,euroCents(e.cents))).join(""):"")+'<p class="nv103-muted">Ручное подтверждение фактических платежей. Это не перевод денег. Личный денежный журнал не суммируется с начислениями автоматически.</p></section>'}
function finShardPanel(sh){const f=NVModel.financialCase(state,sh.caseId),rows=NVModel.sharesFor(sh),free=f.policy==="free-v105",ms=free?NVModel.meritShard(sh):null,edit=finEditable(f)&&(!free||!f.active)&&sh.status==="draft";return lobbySection("Распределение Shard","",finLine("Бюджет",euroCents(NVModel.cents(sh.price)))+finLine("Комиссия",free?"0,00 €":euroCents(Math.floor((NVModel.cents(sh.price)+50)/100)))+(rows.map(r=>finLine(member(r.memberId)+" · "+r.className,euroCents(r.cents))).join("")||'<p>Назначьте ответственного исполнителя.</p>')+(ms?'<h3>Merit · '+(f.settled?"разблокировано":"заморожено")+'</h3>'+finLine("Эмиссия Shard",meritFmt(ms.total))+finLine("Участники · 80%",meritFmt(ms.work))+ms.workRows.map(x=>finLine(member(x.memberId),meritFmt(x.merit))).join("")+finLine("Организатор · 10% · "+(ms.organizerId?member(ms.organizerId):"не назначен"),meritFmt(ms.organize))+finLine("Создатель Case · 5% · "+member(f.ownerId),meritFmt(ms.caseReward))+finLine("NVTSK · 5%",meritFmt(ms.platform)):"")+(edit?'<div class="nv104-actions">'+button("Распределить доли","new-finance-shares",sh.id)+button("Изменить бюджет","new-finance-shard-budget",sh.id)+button("Отменить Shard","finance-shard-cancel",sh.id)+'</div>':"")+'<p class="nv103-muted">Деньги полностью распределяются между участниками. Merit — отдельные единицы; повторной эмиссии нет.</p>')}
function finReservePanel(){let minted=0,locked=0,released=0,platform=0,platformLocked=0,unassigned=0,legacyReserve=0,legacy=0,turnover=0;for(const c of state.cases){const f=NVModel.financialCase(state,c.id);if(f.policy==="free-v105"){minted+=f.meritMinted;locked+=f.meritLocked;released+=f.meritReleased;platform+=f.meritPlatform;platformLocked+=f.meritPlatformLocked;unassigned+=f.unassignedMerit;if(f.settled)turnover+=f.budget}else{legacy+=f.meritMinted;legacyReserve+=f.reserve}}return lobbySection("MERIT · бесплатная экономика","",finLine("Подтверждённый оборот",euroCents(turnover))+finLine("Эмиссия через Shards",meritFmt(minted))+finLine("Заморожено",meritFmt(locked))+finLine("Разблокировано",meritFmt(released))+finLine("Участники · разблокировано",meritFmt(released-platform))+finLine("NVTSK · фонд Merit",meritFmt(platform))+finLine("NVTSK · заморожено",meritFmt(platformLocked))+finLine("Не назначено · в составе замороженных",meritFmt(unassigned))+finLine("Денежные комиссии","0,00 €")+'<p class="nv103-muted">Фонд Merit — внутренние единицы, не денежная прибыль. Рекламный доход и денежное обеспечение будут отдельным модулем. Обмен на евро не подключён.</p>'+(legacy||legacyReserve?'<h3>Исторические расчёты v104</h3>'+finLine("Историческая эмиссия",meritFmt(legacy))+finLine("Исторический расчётный резерв",euroCents(legacyReserve)):""))}
function finAmountInput(label,value="",min="0.01"){return '<label>'+esc(label)+'<input name="amount" type="number" min="'+min+'" max="1000000000000" step="0.01" value="'+esc(value)+'" required inputmode="decimal"></label>'}
function finParse(value,allowZero=false){const s=String(value??"").trim();if(!/^\d+(?:\.\d{1,2})?$/.test(s))throw Error("Введите сумму с точностью до центов");const [w,f=""]=s.split("."),n=Number(w)*100+Number(f.padEnd(2,"0"));if(!Number.isSafeInteger(n)||n<0||(!allowZero&&n===0))throw Error("Проверьте сумму");return n}
function finForm(kind,id,memberId){const sh=state.shards.find(s=>s.id===id),c=state.cases.find(x=>x.id===id),f=NVModel.financialCase(state,sh?sh.caseId:id);if(!finOwner(f))throw Error("Действие доступно владельцу Case");
const ref='<label>Дата<input type="date" name="date" value="'+localDay()+'" required></label><label>Номер / ссылка на платёж<input name="ref" required maxlength="240" placeholder="Rechnung / банковская операция"></label>';
if(kind==="finance-receipt")return '<p>Остаток к получению: '+euroCents(f.due-f.received)+'</p>'+finAmountInput("Получено, €",(f.due-f.received)/100)+ref;
if(kind==="finance-payout"){const p=f.people.find(x=>x.memberId===memberId);if(!p||p.available<=0)throw Error("Нет суммы к выплате");return '<p>'+esc(member(memberId))+' · '+euroCents(p.available)+'</p><input type="hidden" name="memberId" value="'+esc(memberId)+'">'+ref+'<p>Подтвердите только фактическую выплату или оставленный организатором остаток.</p>'}
if(kind==="finance-case-budget"||kind==="finance-shard-budget")return finAmountInput("Новый бюджет, €",sh?sh.price:c.price,sh?"0":"0.01");
if(kind==="finance-shares"){if(!sh?.assignee)throw Error("Сначала назначьте ответственного");const rows=NVModel.sharesFor(sh);return '<p>Распределите '+euroCents(NVModel.cents(sh.price))+' между участниками. Ответственный и организатор должны иметь положительную долю. Организатор — фактический участник, а не оператор, создавший запись.</p>'+(f.policy==="free-v105"?select("organizerId","Организатор Shard",teamOptions(),NVModel.organizerOf(sh)):"")+state.crew.map(person=>{const x=rows.find(r=>r.memberId===person.id);return '<div class="nv104-share"><strong>'+esc(person.name)+'</strong><label>Сумма, €<input type="number" min="0" step=".01" name="share_'+esc(person.id)+'" value="'+(x?x.cents/100:0)+'"></label><label>Класс<select name="class_'+esc(person.id)+'">'+options(NVModel.classes.map(k=>[k,k]),x?.className||"PRO")+'</select></label></div>'}).join("")}throw Error("Неизвестная форма")}

function cashPanel(id){return lobbySection("Личные деньги по объекту",lobbyLink("finance/"+id,"Журнал →"),cashTiles(cashTotals(ownCash(id)))+cashActions(id))}
function personalFinance(id=null){const c=id&&state.cases.find(x=>x.id===id);if(id&&!c)return heading("Объект не найден");const entries=ownCash(id),t=cashTotals(entries);return '<div class="nv103-lobby">'+heading(c?"Деньги · "+c.title:"Мой денежный журнал")+(c?finCasePanel(c.id):finMemberPanel())+'<div class="nv103-actions">'+lobbyLink(c?"case/"+c.id+"/finance":"dashboard",c?"← Case":"← Лобби")+lobbyLink(c?"finance":"merit",c?"Все операции":"Merit отдельно →")+'</div>'+lobbySection("Движение денег","",cashTiles(t)+cashActions(id||"")+'<p class="nv103-muted">Чистый поток — поступления минус расходы, не остаток банковского счёта.</p>')+(!c?lobbySection("По объектам","",state.cases.map(p=>lobbyRow("finance/"+p.id,p.title,"Бюджет "+money(p.price)+" €",euroCents(cashTotals(ownCash(p.id)).balance))).join("")+'<p class="nv103-muted">Общие расходы можно записать без объекта.</p>'):'<p class="nv103-muted">Бюджет Case: '+money(c.price)+' €. Запись не подтверждает оплату заказчиком и не разрешает выплату.</p>')+lobbySection("История операций","",cashRows(entries))+'<p class="nv103-muted">Личный локальный журнал. Не банковская выписка, не бухгалтерский документ и не автоматическая выплата.</p></div>'}
function pulseSummary() {
  const counts = {accepted:0, submitted:0, draft:0};
  state.shards.forEach(s => { if (Object.hasOwn(counts,s.status)) counts[s.status]++; });
  const total = state.shards.length;
  const accepted = total ? counts.accepted*100/total : 0;
  const review = total ? counts.submitted*100/total : 0;
  const rows = [["accepted","Принято"],["submitted","На приёмке"],["draft","В работе"]];
  return '<section class="dna-pulse surface"><header class="module-head"><h2>Project Pulse</h2>'+lobbyLink("pulse","Открыть ↗")+'</header>'+
    '<div class="pulse-body"><div class="pulse-ring" aria-hidden="true" style="--accepted:'+accepted+'%;--review:'+(accepted+review)+'%"><div><b>'+total+'</b><small>Shard</small></div></div>'+
    '<dl>'+rows.map(([key,label])=>'<div><dt><i class="'+key+'"></i>'+label+'</dt><dd>'+counts[key]+'</dd></div>').join("")+'</dl></div></section>';
}
function personalLobby() {
  const c=actor(), st=communityStats(c), groups=state.teams.filter(t=>t.memberIds.includes(c.id));
  const ownShards=state.shards.filter(s=>NVModel.sharesFor(s).some(x=>x.memberId===c.id)||s.assignee===c.id||groups.some(t=>t.id===s.teamId));
  const myCases=state.cases.filter(p=>ownsCase(p.id)||ownShards.some(s=>s.caseId===p.id)||state.tasks.some(t=>t.assignee===c.id&&state.shards.some(s=>s.id===t.shardId&&s.caseId===p.id)));
  const active=myCases.filter(p=>pct(p.id)!==100);
  const openTasks=state.tasks.filter(t=>t.status!=="done"&&(t.assignee===c.id||(t.assignee===null&&ownShards.some(s=>s.id===t.shardId))));
  const merit=NVModel.meritPassport(state,c.id).totals.released/100, t=cashTotals(ownCash());
  const hero='<section class="command-hero"><div class="command-photo"></div><div class="command-surface"><div class="command-signals">'+
    '<button class="coin-link" data-route="merit"><span class="merit-coin" aria-hidden="true"><img src="art/nvtsk-approved.webp" alt=""></span><span><small>Merit Passport</small><b>'+money(merit)+' M</b></span></button>'+
    '<div class="reputation"><div><span>Репутация</span><b>'+st.xp+' XP</b></div><progress max="100" value="'+st.percent+'" aria-label="Прогресс репутации"></progress><small>'+esc(st.level)+'</small></div></div>'+
    '<div class="command-title"><h1>Центр</h1><p>'+esc(c.name)+(c.headline?' <i>·</i> '+esc(c.headline):'')+'</p></div></div></section>';
  const quick=(attributes,symbol,label,primary=false)=>'<button class="quick-action'+(primary?' primary':'')+'" '+attributes+'>'+icon(symbol)+'<span>'+label+'</span></button>';
  const photoCase=active.find(p=>ownsCase(p.id))||myCases.find(p=>ownsCase(p.id));
  const actions='<div class="command-actions" aria-label="Быстрые действия">'+quick('data-action="new-case"',"layers","Новый Case",true)+
    quick('data-action="new-shard"',"shard","Создать Shard")+
    (photoCase?quick('data-action="new-case-media" data-id="'+esc(photoCase.id)+'" title="'+esc(photoCase.title)+'"',"camera","Фото объекта"):quick('data-route="projects"',"folder","Мои проекты"))+
    quick('data-route="tasks"',"check","Приёмка")+'</div>';
  const projectRows=active.slice(0,4).map(p=>lobbyRow("case/"+p.id,p.title,p.address||p.city,money(p.price)+" €",pct(p.id))).join("");
  const taskRows=openTasks.slice(0,4).map(task=>{const sh=state.shards.find(s=>s.id===task.shardId);return lobbyRow("shard/"+sh.id,task.title,sh.title,task.status==="doing"?"В работе":"Ожидает")}).join("");
  const personal='<dl class="profile-facts">'+[["Специализация",c.headline],["Команда",groups.map(g=>g.name).join(", ")],["Навыки",(c.skills||[]).join(" · ")],["Регион",c.location]].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v||"Не указано")+'</dd></div>').join("")+'</dl>'+
    (c.bio?'<p>'+esc(c.bio)+'</p>':'')+'<div class="command-badges">'+alphaLabel(c)+st.badges.map(x=>'<span>'+esc(x[1])+'</span>').join("")+'</div>'+lobbyLink("member/"+c.id,"Полный профиль ↗");
  return '<div class="command">'+hero+actions+'<div class="command-board">'+caseMiniMap()+pulseSummary()+
    '<div class="command-projects">'+lobbySection("Активные проекты <span>"+active.length+"</span>",lobbyLink("projects","Все проекты ↗"),projectRows||'<p class="empty">У вас пока нет активных объектов.</p>')+'</div>'+
    '<div class="command-tasks">'+lobbySection("Мои задачи <span>"+openTasks.length+"</span>",lobbyLink("tasks","Все задачи ↗"),taskRows||'<p class="empty">Открытых личных задач сейчас нет.</p>')+'</div></div>'+
    '<div class="command-details">'+lobbySection("Активность в Grid",lobbyLink("grid","Открыть Grid ↗"),communityWorkFeed(acceptedWorkEvents(c.id).slice(0,3))||'<p class="empty">Здесь появятся принятые работы.</p>')+
    lobbySection("Ресурсы",lobbyLink("lager","Склад ↗"),'<div class="resource-links">'+lobbyLink("fuhrpark","Автопарк")+lobbyLink("grid/rental","Каталог аренды")+rentalProfileAction()+'</div>')+
    meritPassportPanel()+lobbySection("Мои деньги · "+euroCents(t.balance),lobbyLink("finance","Журнал ↗"),cashTiles(t)+cashActions())+
    finMemberPanel()+lobbySection("Профиль специалиста",button("Изменить","edit-profile",c.id),personal)+'</div></div>';
}

function financeWorkspace(){
 const sum=state.cases.reduce((n,c)=>n+Number(c.price||0),0);
 const rows=state.cases.map(c=>'<button class="ref66-finance-row" data-route="case/'+esc(c.id)+'"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city||"")+'</small></span><strong>'+money(c.price)+' €</strong><span class="ref66-finance-unknown">Оплата не подтверждена</span></button>').join("");
 return '<div class="ref66-section">'+heading("Финансы · "+APP_BRAND.workspace)+'<div class="ref66-section-tabs"><button data-route="finance">Обзор</button><button data-route="merit">Merit</button><button data-route="analytics">Аналитика</button></div><div class="ref66-finance-cards"><article class="panel"><small>Стоимость Case</small><h2>'+money(sum)+' €</h2></article><article class="panel"><small>Подтверждённые поступления</small><h2>Нет данных</h2></article><article class="panel"><small>Доступно к выплате</small><h2>Не определено</h2></article></div><section class="panel"><h2>Case и расчёты</h2><p class="ref66-finance-warning">Это бюджеты проектов, а не оплаченные счета. Реестр Rechnung, фактические Zahlungseingang и выплаты пока не реализованы. Выплата исполнителю допускается только после полной оплаты Case заказчиком.</p>'+rows+'</section></div>';
}
function meritWorkspace(){const cap=NVModel.rentalCapital(state),work=state.cases.map(c=>NVModel.financialCase(state,c.id)).filter(f=>f.policy==="free-v105"),released=work.reduce((n,f)=>n+f.meritReleased,0)+cap.merit;return '<div class="nv103-lobby">'+heading("Merit · "+(lab?"ALPHA LAB":activeWorkspace().name))+meritPassportPanel(state.actor,true)+finReservePanel()+lobbySection("Merit Capital · RENTAL",lobbyLink("grid","Grid →"),finLine("Эмиссия RENTAL",meritFmt(cap.merit))+finLine("Единая разблокированная эмиссия WORK + RENTAL",meritFmt(released))+finLine("Фонд из аренд · расчёт",euroCents(cap.fund))+finLine("Доход платформы",euroCents(cap.platformIncome))+finLine("Платформа · RENTAL",meritFmt(cap.platformMerit))+finLine("Условное обеспечение на M",released?(cap.fund/released).toFixed(5)+" €":"—")+'<p class="hint">Отношение расчётного фонда к разблокированным единицам нового формата, без замороженных и исторических Merit. Не рыночная цена.</p>')+'</div>'}
function analyticsWorkspace(){
 const done=state.shards.filter(x=>x.status==="accepted").length,waiting=state.shards.filter(x=>x.status==="submitted").length;
 return '<div class="ref66-section">'+heading("Аналитика · "+(lab ? actor().company || "ALPHA LAB" : activeWorkspace().name))+'<div class="ref66-finance-cards"><article class="panel"><small>Case</small><h2>'+state.cases.length+'</h2></article><article class="panel"><small>Shard принято</small><h2>'+done+'</h2></article><article class="panel"><small>Ожидают приёмки</small><h2>'+waiting+'</h2></article></div><section class="panel"><h2>Проекты и прогресс</h2>'+state.cases.map(c=>'<button class="ref66-finance-row" data-route="case/'+esc(c.id)+'"><span>'+esc(c.title)+'</span><strong>'+pct(c.id)+'%</strong></button>').join("")+'</section></div>';
}

/* Network — local-first professional feed, media and deal drafts. */
let networkUrls=[],networkEpoch=0;
const networkKey=()=>KEY+"_network_v1";
function legacyNetworkData(){const d=JSON.parse(localStorage.getItem(networkKey())||"null"),old=JSON.parse(localStorage.getItem(SOCIAL_KEY)||'{"posts":[]}');const posts=new Map((old.posts||[]).map(p=>[p.id,{...p,kind:"post"}]));for(const p of d?.posts||[])posts.set(p.id,p);return NVModel.normalizeNetwork(state,{posts:[...posts.values()],deals:d?.deals||[]})}
function networkData(){return JSON.parse(JSON.stringify(state.network||{posts:[],deals:[]}))}
async function networkSave(d){if(!await change(()=>apply(state,"network-save",{network:d})))throw Error("Не удалось сохранить запись Grid")}
async function migrateNetwork(){if(state.network!==undefined||damaged||!account())return;const n=legacyNetworkData();if(!await change(()=>apply(state,"network-save",{network:n})))throw Error("Не удалось перенести Network. Старые записи сохранены.")}
function networkDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open("nvtsk-network-media",1);req.onupgradeneeded=()=>req.result.createObjectStore("media");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error("Хранилище медиа недоступно"))})}
async function networkMedia(op,id,blob){const db=await networkDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction("media",op==="get"?"readonly":"readwrite"),store=tx.objectStore("media"),key=KEY+"/"+id,req=op==="get"?store.get(key):op==="put"?store.put(blob,key):store.delete(key);tx.oncomplete=()=>resolve(req.result);tx.onerror=tx.onabort=()=>reject(Error("Не удалось сохранить или прочитать медиа"))})}finally{db.close()}}
function networkRelease(){networkEpoch++;networkUrls.forEach(u=>URL.revokeObjectURL(u));networkUrls=[]}
async function networkHydrate(){const epoch=networkEpoch;for(const el of document.querySelectorAll("[data-network-media]")){try{const blob=await networkMedia("get",el.dataset.networkMedia);if(epoch!==networkEpoch||!el.isConnected)continue;if(!blob){el.replaceWith(document.createTextNode("Медиа недоступно на этом устройстве"));continue}const u=URL.createObjectURL(blob);networkUrls.push(u);el.src=u;el.hidden=false;const placeholder=el.parentElement.querySelector(".nt99-media-note");if(placeholder)placeholder.hidden=true}catch{if(el.isConnected){const p=el.parentElement.querySelector(".nt99-media-note");if(p)p.textContent="Медиа недоступно"}}}}
const networkKinds={post:"Публикация",video:"Видео",offer:"Предложение работы",available:"Бригада свободна"};
function networkPost(p,d,project){const person=state.crew.find(c=>c.id===p.author),name=person?displayMemberName(person):"Участник",likes=p.likes||[],comments=p.comments||[],kind=p.kind||"post",offer=["offer","available"].includes(kind);
const media=p.mediaKind?'<div class="nt99-media"><span class="nt99-media-note">Загрузка медиа…</span>'+(p.mediaKind==="video"?'<video hidden controls playsinline preload="metadata" data-network-media="'+esc(p.id)+'"></video>':'<img hidden alt="Фото публикации" data-network-media="'+esc(p.id)+'">')+'</div>':"";
return '<article class="nt99-post"><header class="nt99-author">'+(person?'<a class="grid-author" href="#member/'+esc(person.id)+'" aria-label="Профиль · '+esc(name)+'">'+memberAvatar(person)+'</a>':'<span class="nt99-avatar">?</span>')+'<div><strong>'+(person?'<a href="#member/'+esc(person.id)+'">'+esc(name)+'</a>':esc(name))+'</strong><small>'+esc(networkKinds[kind]||"Публикация")+' · '+esc(new Date(p.created).toLocaleDateString("ru-RU"))+'</small></div>'+(p.author===state.actor?'<button type="button" data-network="delete" data-id="'+esc(p.id)+'" aria-label="Удалить публикацию">×</button>':'')+'</header>'+(offer?'<div class="nt99-offer"><small>'+esc(p.region||"Регион не указан")+'</small><h3>'+esc(p.title||"Предложение")+'</h3><strong>'+money(p.budget)+' €</strong></div>':'')+'<p class="nt99-copy">'+esc(p.text)+'</p>'+media+(project?'<a class="nt99-link" href="#case/'+esc(project.id)+'">'+icon("layers")+'<span>Case · '+esc(project.title)+'</span></a>' :'')+'<div class="nt99-reactions"><button data-network="like" data-id="'+esc(p.id)+'" aria-pressed="'+likes.includes(state.actor)+'">'+(likes.includes(state.actor)?"♥":"♡")+' '+likes.length+'</button><span>'+comments.length+' комментариев</span>'+(offer?'<button class="grid-deal-link" data-network="draft" data-id="'+esc(p.id)+'">'+(d?(d.caseId?"Открыть сделку":"Открыть черновик"):"Подготовить условия")+'</button>':'')+'</div><div class="nt99-comments">'+comments.map(c=>'<p><strong>'+esc(state.crew.find(x=>x.id===c.author)?.name||"Участник")+'</strong> '+esc(c.text)+'</p>').join("")+'</div><form class="nt99-comment" data-id="'+esc(p.id)+'"><input name="text" maxlength="500" required aria-label="Комментарий к публикации" placeholder="Комментарий…"><button type="submit" aria-label="Отправить комментарий">→</button></form></article>'}
function networkDeal(d) {
  const project = state.cases.find(c=>c.id===d.caseId);
  const source = state.network?.posts.some(p=>p.id===d.postId)
    ? gridLink(gridPath("all",{post:d.postId}),icon("layers")+" Исходное предложение") : "";
  const content = project
    ? `<p class="grid-terms">${esc(d.terms)}</p><button class="nt99-primary" data-route="case/${esc(project.id)}">Открыть созданный Case →</button>`
    : `<form class="nt99-dealform" data-id="${esc(d.id)}">
        <label>Предмет и условия<textarea name="terms" maxlength="4000" required rows="3">${esc(d.terms)}</textarea></label>
        <label>Бюджет, €<input name="budget" type="number" min="0" max="1000000000000" step=".01" value="${esc(d.budget)}" required></label>
        <button type="submit">Сохранить условия</button></form>
        <button class="nt99-primary" data-network="case" data-id="${esc(d.id)}">Создать Case из черновика</button>`;
  return `<article class="nt99-post nt99-deal"><small>${project?"СДЕЛКА · CASE СОЗДАН":"ЧЕРНОВИК УСЛОВИЙ"}</small>
    <div class="grid-deal-head"><div><h3>${esc(d.title)}</h3><p>${esc(d.region)}</p></div><strong>${money(d.budget)} €</strong></div>
    ${content}<div class="grid-return-source">${source}</div></article>`;
}


const rentalStatuses={requested:"Заявка",confirmed:"Подтверждена",returned:"Возвращено",settled:"Расчёт закрыт",cancelled:"Отменена"};
function rentalPartnerCard(p){const cap=NVModel.rentalCapital(state),list=(state.rentalListings||[]).filter(l=>l.partnerId===p.id);return '<article class="nt99-post nr106-card"><small>PARTNER · VERMIETUNG</small><h3>'+esc(p.name)+'</h3><p>'+esc(p.region)+' · '+list.length+' предложений</p><p>'+meritFmt(cap.partners[p.id]||0)+' · RENTAL</p><button data-route="rental-partner/'+esc(p.id)+'">Профиль партнёра →</button></article>'}
function rentalListing(l){const p=(state.rentalPartners||[]).find(x=>x.id===l.partnerId);return '<article class="nt99-post nr106-card"><small>'+esc(l.kind)+'</small><h3>'+esc(l.title)+'</h3><strong class="nr106-price">'+euroCents(l.dailyCents)+' / сутки</strong><p>'+esc(p.name)+' · '+esc(p.region)+'</p><p>'+esc(l.notes||"")+'</p><div class="nv104-actions"><button data-route="rental-partner/'+esc(p.id)+'">Профиль</button>'+(p.memberId===state.actor?'<span class="hint">Моё оборудование</span>':button("Создать заявку","new-rental-request",l.id))+'</div></article>'}
function rentalPartnerProfile(id){const p=(state.rentalPartners||[]).find(x=>x.id===id);if(!p)return heading("Партнёр не найден");const list=(state.rentalListings||[]).filter(l=>l.partnerId===id);return '<div class="nt99-network"><button data-route="grid/partners">← Партнёры Grid</button><section class="nt99-hero"><small>PARTNER · RENTAL</small><h1>'+esc(p.name)+'</h1><p>'+esc(p.region)+'</p><p>'+esc(p.contact||"")+'</p><p>'+esc(p.notes||"")+'</p></section>'+lobbySection("Каталог аренды",managesRental(id)?button("＋ Оборудование","new-rental-listing",id):"",list.map(rentalListing).join("")||'<p>Предложений пока нет.</p>')+lobbySection("Merit · RENTAL","",finLine("Начислено партнёру",meritFmt(NVModel.rentalCapital(state).partners[id]||0))+'<p class="hint">Локальный профиль контрагента, не отдельная серверная учётная запись.</p>')+'</div>'}
function rentalRecord(id){const r=(state.rentals||[]).find(x=>x.id===id);if(!r||!(managesRental(r.partnerId)||r.renterId===state.actor||r.brokerId===state.actor))return heading("Сделка недоступна");return '<div class="nt99-network">'+lobbyLink("merit","← Паспорт Merit")+rentalDeal(r)+'</div>'}
function rentalDeal(r){const q=NVModel.rentalQuote(r),p=(state.rentalPartners||[]).find(x=>x.id===r.partnerId),l=(state.rentalListings||[]).find(x=>x.id===r.listingId),c=state.cases.find(x=>x.id===r.caseId);let actions="";
if(managesRental(r.partnerId)&&r.status==="requested")actions+=button("Подтвердить условия","rental-confirm",r.id);
if(managesRental(r.partnerId)&&r.status==="confirmed")actions+=button("Подтвердить возврат","rental-return",r.id);
if((managesRental(r.partnerId)&&["requested","confirmed"].includes(r.status))||(r.renterId===state.actor&&r.status==="requested"))actions+=button("Отменить","rental-cancel",r.id);
if(managesRental(r.partnerId)&&r.status==="returned")actions+=button("Закрыть оплаченный расчёт","new-rental-settle",r.id);
return '<article class="nt99-post nr106-card"><small>RENTAL · '+esc(rentalStatuses[r.status])+'</small><h3>'+esc(l.title)+'</h3><p>'+esc(p.name)+' · '+esc(r.start)+' — '+esc(r.end)+' · '+q.days+' сут.</p><p>Арендатор: '+esc(member(r.renterId))+'</p>'+finLine("Полная цена",euroCents(q.gross))+finLine("Владелец",euroCents(q.ownerCash))+finLine("Комиссия в цене · 10%",euroCents(q.fee))+(r.status==="settled"?finLine("Прямые расходы",euroCents(q.cost))+finLine("Денежный фонд · 80%",euroCents(q.fund))+finLine("Доход NVTSK · 20%",euroCents(q.platformIncome))+finLine("Эмиссия RENTAL",meritFmt(q.merit))+finLine("Владелец",meritFmt(q.providerMerit))+finLine("Арендатор",meritFmt(q.renterMerit))+(r.brokerId?finLine("Посредник · "+member(r.brokerId),meritFmt(q.brokerMerit)):"")+finLine("Платформа",meritFmt(q.platformMerit)):'<p class="hint">Merit и фонд рассчитываются только после подтверждения оплаты и расходов.</p>')+(c?'<button data-route="case/'+esc(c.id)+'">Case · '+esc(c.title)+' →</button>':"")+'<div class="nv104-actions">'+actions+'</div></article>'}
function caseRentalPanel(id){const rs=(state.rentals||[]).filter(r=>r.caseId===id);return lobbySection("Аренда для Case",lobbyLink("network/rental/"+id,"Каталог →"),rs.length?rs.map(rentalDeal).join(""):'<p class="hint">Свяжите заявку на аренду с этим Case при оформлении. Не создавайте отдельный Shard для той же аренды.</p>')}
function rentalNetwork(tab){const ps=state.rentalPartners||[],ls=state.rentalListings||[],rs=(state.rentals||[]).filter(r=>managesRental(r.partnerId)||r.renterId===state.actor||r.brokerId===state.actor),cap=NVModel.rentalCapital(state);if(tab==="partners")return '<div class="nr106-intro"><h2>Коммерческие партнёры</h2><p>Профили проката и поставщиков оборудования.</p>'+rentalProfileAction()+(lead()?button("＋ Внешний партнёр","new-rental-partner","external"):"")+'</div>'+ps.map(rentalPartnerCard).join("")+(ps.length?"":'<p class="nt99-empty">Добавьте первого реального партнёра.</p>');if(tab==="rental")return '<div class="nr106-intro"><h2>Rental</h2><p>Авто, прицепы, подъёмники, леса, инструмент. Комиссия 10% уже включена в цену.</p>'+(ps.some(p=>managesRental(p.id))?button("＋ Предложение аренды","new-rental-listing"):rentalProfileAction())+'</div>'+NVModel.rentalKinds.map(k=>{const items=ls.filter(l=>l.kind===k);return items.length?'<h3>'+esc(k)+'</h3>'+items.map(rentalListing).join(""):""}).join("")+(ls.length?"":'<p class="nt99-empty">Каталог пуст. Добавьте партнёра и его оборудование.</p>');return lobbySection("RENTAL · расчёты","",finLine("Оборот закрытых сделок",euroCents(cap.turnover))+finLine("Merit · RENTAL",meritFmt(cap.merit))+finLine("Расчётный денежный фонд",euroCents(cap.fund))+finLine("Доход NVTSK",euroCents(cap.platformIncome))+'<p class="hint">Локальный учёт; договор, наличие оборудования и реальная оплата подтверждаются вне приложения.</p>')+(rs.slice().reverse().map(rentalDeal).join("")||'<p class="nt99-empty">Нет заявок на аренду.</p>')}
function rentalForm(kind,id){const ps=state.rentalPartners||[],ls=state.rentalListings||[],r=(state.rentals||[]).find(x=>x.id===id);
if(kind==="rental-partner")return (id==="external"&&lead()?'<input type="hidden" name="external" value="yes"><p>Внешний контрагент без аккаунта.</p>':'<p>Направление аренды привязывается к вашему существующему профилю.</p>')+input("name","Название партнёра")+input("region","Город / регион")+'<label>Контакт<input name="contact" maxlength="240"></label><label>Описание<textarea name="notes" maxlength="1500"></textarea></label>';
if(kind==="rental-listing"){const own=ps.filter(p=>managesRental(p.id));if(!own.length)throw Error("Создайте своё направление аренды");return select("partnerId","Партнёр",own.map(p=>[p.id,p.name]),id)+input("title","Название оборудования")+select("kind","Категория",pairs(NVModel.rentalKinds))+finAmountInput("Цена за сутки, € · комиссия включена")+'<label>Условия<textarea name="notes" maxlength="1500"></textarea></label>'}
if(kind==="rental-request"){const l=ls.find(x=>x.id===id);if(!l)throw Error("Предложение не найдено");return '<p>'+esc(l.title)+' · '+euroCents(l.dailyCents)+' / сутки</p><label>С даты<input name="start" type="date" value="'+localDay()+'" required></label><label>По дату включительно<input name="end" type="date" value="'+localDay()+'" required></label><label>Связанный Case<select name="caseId"><option value="">Без Case</option>'+options(state.cases.map(c=>[c.id,c.title]),networkContext())+'</select></label><label>Посредник<select name="brokerId"><option value="">Без посредника</option>'+options(state.crew.filter(c=>c.id!==state.actor&&c.id!==NVModel.rentalProvider(state,l.partnerId)).map(c=>[c.id,c.name]))+'</select></label><p class="hint">Заявка локальная, не бронирование у поставщика. Срок считается по календарным дням включительно.</p>'}
if(kind==="rental-settle"){if(!r||r.status!=="returned")throw Error("Сначала подтвердите возврат");const q=NVModel.rentalQuote(r);return finAmountInput("Фактически оплачено, €",q.gross/100)+finAmountInput("Прямые расходы из комиссии, €",0,"0").replace('name="amount"','name="cost"')+'<label>Дата расчёта<input name="date" type="date" value="'+localDay()+'" required></label>'+input("ref","Уникальная ссылка на оплату")+'<p>Суммы без НДС; подтвердите фактическую оплату. Фонд и Merit начисляются один раз.</p>'}throw Error("Неизвестная форма Rental")}

/* Grid renders the existing workspace records. Its URL carries the active section and context. */
const gridSections = [
  {home:"all", label:"Поток", short:"Поток", icon:"grid", tabs:[["all","Всё"],["posts","Публикации"],["video","Видео"],["results","Принятые работы"]]},
  {home:"market", label:"Объекты и услуги", short:"Работа", icon:"layers", tabs:[["market","Предложения"],["projects","Объекты"],["rental","Аренда"],["partners","Партнёры"]]},
  {home:"people", label:"Люди и бригады", short:"Люди", icon:"team", tabs:[["people","Участники"],["teams","Бригады"],["achievements","Достижения"]]},
  {home:"deals", label:"Сделки", short:"Сделки", icon:"shard", tabs:[["deals","По работам"],["rental-deals","По аренде"]]}
];

function gridRoute(hash = location.hash.slice(1)) {
  const [path, query] = hash.split("?");
  const [root, tab, legacyId] = path.split("/");
  if (!["grid","network","team","social"].includes(root)) return null;
  const params = new URLSearchParams(query);
  let view = tab || "all";
  if (root === "team") view = tab === "feed" ? "posts" : tab || "people";
  if (root === "social") view = "all";
  if (tab === "case") view = "all";
  const section = gridSections.find(s => s.tabs.some(([key]) => key === view)) || gridSections[0];
  if (!section.tabs.some(([key]) => key === view)) view = section.home;
  const caseId = params.get("case") || legacyId;
  return {
    view, section, demo:root === "grid" && tab === "demo",
    caseId:caseId && state.cases.some(c => c.id === caseId) ? caseId : "",
    postId:params.get("post"), dealId:params.get("deal"),
    compose:tab === "case" || params.get("compose") === "1"
  };
}

function gridPath(view, options = {}) {
  const params = new URLSearchParams();
  const contextual = ["all","posts","video","results","market","deals"].includes(view);
  const context = options.case ?? (contextual ? gridRoute()?.caseId : "");
  if (context) params.set("case", context);
  for (const key of ["post","deal","compose"]) if (options[key]) params.set(key,options[key]);
  const suffix = params.toString();
  return (view === "all" ? "grid" : "grid/"+view) + (suffix ? "?"+suffix : "");
}

function openGrid(view, options) {
  const url = gridPath(view, options);
  if (location.hash.slice(1) === url) render();
  else location.hash = url;
}

function gridLink(path, body, active=false) {
  return `<a href="#${esc(path)}"${active?' aria-current="page"':""}>${body}</a>`;
}

function gridMasthead(route, counts) {
  const metrics = [
    ["people", "Люди", counts.people],
    ["projects", "Объекты", counts.projects],
    ["deals", "Сделки по работам", counts.deals]
  ];
  const stats = metrics.map(([view,label,count]) => gridLink(gridPath(view),`<b>${count}</b><span>${label}</span>`)).join("");
  if (route.view !== "all" || route.postId || route.compose) {
    return `<header class="grid-mast-compact">${gridLink(gridPath("all"),icon("grid")+" Grid")}<span>${esc(route.section.label)}</span></header>`;
  }
  return `<header class="grid-mast">
    <div class="grid-mast-body"><span class="grid-signature">МУЛЬТИВСЕЛЕННАЯ NVTSK</span><h1>Grid</h1>
    <p>Здесь встречаются люди,<br>объекты и сделки.</p></div>
    <div class="grid-metrics" aria-label="Связи рабочего пространства">${stats}${lab?'<a class="grid-demo-entry" href="#grid/demo" aria-label="Демо: история одной сделки"><span>Демо</span>'+icon("open")+'</a>':""}</div>
  </header>`;
}

function gridNav(route) {
  const main = gridSections.map(s => gridLink(gridPath(s.home),icon(s.icon)+
    `<span class="grid-label-wide">${s.label}</span><span class="grid-label-small">${s.short}</span>`,s === route.section)).join("");
  const sub = route.section.tabs.map(([key,text]) => gridLink(gridPath(key),text,key === route.view)).join("");
  return `<nav class="grid-nav" aria-label="Разделы Grid">${main}</nav>
    <nav class="grid-subnav" aria-label="${esc(route.section.label)}">${sub}</nav>`;
}

function gridComposer(route) {
  const kind=route.view==="market"?"offer":route.view==="video"?"video":"post";
  const market=kind==="offer";
  const cases = state.cases.map(c => `<option value="${esc(c.id)}"${route.caseId === c.id ? " selected" : ""}>${esc(c.title)}</option>`);
  return `<section class="nt99-composer" id="nt99-composer"${route.compose ? "" : " hidden"} aria-labelledby="grid-compose-title">
    <div class="grid-compose-head"><h2 id="grid-compose-title">Новая публикация</h2><button type="button" data-network="compose" aria-label="Закрыть форму">×</button></div>
    <form id="nt99-post-form">
    <label>Формат<select name="kind" id="nt99-kind">${Object.entries(networkKinds).map(([k,v])=>`<option value="${k}"${k===kind?" selected":""}>${v}</option>`).join("")}</select></label>
    <div id="nt99-market-fields"${market?"":" hidden"}><label>Название предложения<input name="title" maxlength="120" ${market?"required":"disabled"}></label><label>Регион или город<input name="region" maxlength="120" ${market?"required":"disabled"}></label><label>Бюджет, €<input name="budget" type="number" min="0" max="1000000000000" step=".01" ${market?"required":"disabled"}></label></div>
    <label>Описание<textarea name="text" rows="3" maxlength="1200" placeholder="Что сделано или какая работа предстоит?" required></textarea></label>
    <label>Фото или видео · до 30 МБ<input name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"></label>
    <label>Связанный объект<select name="caseId"><option value="">Без Case</option>${cases.join("")}</select></label>
    <button type="submit" class="nt99-primary">Опубликовать</button><p id="nt99-error" role="alert"></p></form></section>`;
}

function gridEmpty(title, text="") {
  return `<div class="grid-empty"><strong>${esc(title)}</strong>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
}

function gridSearch(kind) {
  const market = kind === "market";
  const labels={market:["Поиск предложений","Работа, бригада или город"],projects:["Поиск объектов","Название или адрес объекта"],teams:["Поиск бригад","Бригада, участник или город"],people:["Поиск участников","Имя, специализация или город"]};
  const [label,placeholder]=labels[kind];
  return `<div class="grid-search"><label>${icon("search")}<input type="search" data-grid-search autocomplete="off" aria-label="${label}" placeholder="${placeholder}"></label>
    ${market?'<select data-grid-kind-filter aria-label="Тип предложения"><option value="">Все типы</option><option value="offer">Предложения работ</option><option value="available">Свободные бригады</option></select>':""}</div>`;
}

function gridFilter() {
  const field = document.querySelector("[data-grid-search]");
  if (!field) return;
  const kind = document.querySelector("[data-grid-kind-filter]")?.value;
  const words = field.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const el of document.querySelectorAll("[data-grid-entry]")) {
    el.hidden = Boolean((kind && el.dataset.gridKind !== kind) || words.some(w => !el.dataset.gridEntry.includes(w)));
    if (!el.hidden) shown++;
  }
  document.getElementById("grid-no-matches").hidden = shown > 0;
}
document.addEventListener("input",e => { if (e.target.matches("[data-grid-search]")) gridFilter(); });
document.addEventListener("change",e => { if (e.target.matches("[data-grid-kind-filter]")) gridFilter(); });

function gridSearchList(view, rows) {
  return gridSearch(view)+rows+'<p id="grid-no-matches" role="status" hidden>Совпадений нет. Попробуйте другой город или название.</p>';
}

function gridProjects(projects) {
  if (!projects.length) return gridEmpty("Доступных объектов пока нет","Созданные и переданные вам Case появятся здесь.");
  const rows = projects.map(({c,percent,status}) =>
    `<a class="grid-project" href="#case/${esc(c.id)}" data-grid-entry="${esc([c.title,c.city,c.address].filter(Boolean).join(" ").toLocaleLowerCase())}">
      <span class="grid-project-symbol">${icon("layers")}</span><span><strong>${esc(c.title)}</strong><small>${esc(c.address||c.city||"Адрес не указан")}</small></span>
      <span class="grid-project-state"><b>${percent}%</b><small>${esc(projectHubStatusLabel[status]||"Планирование")}</small></span></a>`
  ).join("");
  return gridSearchList("projects",rows);
}

function gridConnections(data, visibleProjects) {
  const posts = new Map(data.posts.map(p => [p.id,p]));
  // Only draw a relationship when both endpoints are present in this workspace.
  const deal = data.deals.slice().reverse().find(d => posts.has(d.postId) && visibleProjects.has(d.caseId)) ||
    data.deals.slice().reverse().find(d => posts.has(d.postId));
  if (!deal) return "";
  const post = posts.get(deal.postId);
  const author = state.crew.find(c => c.id === post.author);
  const project = visibleProjects.get(deal.caseId);
  const links = [];
  if (author) links.push(["team","Автор","member/"+author.id,displayMemberName(author)]);
  links.push(["layers",networkKinds[post.kind]||"Предложение",gridPath("all",{post:post.id}),post.region||post.title||post.text]);
  links.push(["shard",project?"Условия сделки":"Черновик сделки",gridPath("deals",{deal:deal.id}),money(deal.budget)+" €"]);
  if (project) links.push(["folder","Созданный Case","case/"+project.id,project.title]);
  return `<aside class="grid-thread"><details${matchMedia("(min-width:860px)").matches?" open":""}><summary><span class="grid-section-icon">${icon("grid")}</span>Цепочка сделки</summary>
    <ol>${links.map(([symbol,label,path,title])=>`<li><a href="#${esc(path)}"><i>${icon(symbol)}</i><span><small>${label}</small><strong>${esc(title)}</strong></span>${icon("open")}</a></li>`).join("")}</ol></details></aside>`;
}

function gridView(route, data, projects, projectMap) {
  const {view} = route;
  if (view === "projects") return gridProjects(projects);
  if (["teams","people","achievements"].includes(view)) return gridPeopleContent(view);
  if (["partners","rental","rental-deals"].includes(view)) return rentalNetwork(view);
  if (view === "deals") {
    const deals = data.deals.slice().reverse().filter(d=>!route.dealId||d.id===route.dealId);
    return deals.map(networkDeal).join("") || gridEmpty(route.dealId?"Сделка недоступна":"Сделок пока нет","В предложении работы выберите «Подготовить условия», чтобы создать черновик.");
  }
  const workEvents = () => acceptedWorkEvents().filter(({sh})=>!route.caseId || sh.caseId === route.caseId);
  if (view === "results") return communityWorkFeed(workEvents()) || gridEmpty("Принятых работ пока нет","Здесь появятся Shard, которые прошли приёмку.");
  const posts = data.posts.slice().reverse();
  const dealsByPost = new Map(data.deals.map(d=>[d.postId,d]));
  const postCard = p => networkPost(p,dealsByPost.get(p.id),projectMap.get(p.caseId));
  if (view === "market") {
    const offers = posts.filter(p=>["available","offer"].includes(p.kind));
    if (!offers.length) return gridEmpty("Пока нет предложений","Опубликуйте работу или укажите, где свободна ваша бригада.");
    const rows = offers.map(p=>{
      const terms = [p.title,p.text,p.region,networkKinds[p.kind]].join(" ").toLocaleLowerCase();
      return `<div data-grid-entry="${esc(terms)}" data-grid-kind="${esc(p.kind)}">${postCard(p)}</div>`;
    }).join("");
    return gridSearchList(view,rows);
  }
  const records = posts.filter(p=>(!route.postId||p.id===route.postId) && (view !== "video" || p.mediaKind === "video"));
  const work = view==="all" && !route.postId ? workEvents() : [];
  const cards=records.map(postCard);
  if(work.length) cards.splice(Math.min(1,cards.length),0,communityWorkFeed(work.slice(0,1)));
  return cards.join("")+communityWorkFeed(work.slice(1)) || gridEmpty(route.postId?"Публикация недоступна":view==="video"?"Видео пока нет":"Поток пока пуст",
    route.postId?"":view==="video"?"Прикрепите видео к публикации с объекта.":"Поделитесь работой с объекта или опубликуйте предложение для бригады.");
}

function gridDemoPage() {
  const heading = '<header class="grid-story-head"><a href="#grid">← Grid</a><h1>История одной сделки</h1></header>';
  if (!lab) return '<div class="grid-world grid-story">'+heading+
    '<p>Откройте учебный объект и проследите, кто предложил работу, какая бригада её выполнила и какой участок прошёл приёмку.</p><button class="nt99-primary" data-action="sandbox" data-grid-demo>Открыть в ALPHA LAB</button> '+gridFilmLink()+'</div>';
  const data = state.network || {posts:[],deals:[]};
  const projects = new Set(visibleProjectHub().map(({c})=>c.id));
  const posts = new Map(data.posts.map(post=>[post.id,post]));
  const accepted = acceptedWorkEvents();
  const deal = data.deals.find(d=>projects.has(d.caseId) && posts.has(d.postId) && accepted.some(({sh})=>sh.caseId===d.caseId));
  if (!deal) return '<div class="grid-world grid-story">'+heading+gridEmpty("У этого участника пока нет полной цепочки","Для показа нужны связанные предложение, Case и принятый Shard.")+gridLink("alpha-lab","Выбрать участника →")+gridFilmLink()+'</div>';
  const offer=posts.get(deal.postId), work=accepted.find(({sh})=>sh.caseId===deal.caseId);
  const team=state.teams.find(t=>t.id===work.sh.teamId);
  const source=state.crew.find(c=>c.id===offer.author);
  const steps=[
    ["Предложение",offer.title||offer.text,source?displayMemberName(source):"Автор публикации",gridPath("all",{post:offer.id}),"layers"],
    ["Условия сделки",money(deal.budget)+" €",deal.region||deal.title,gridPath("deals",{deal:deal.id}),"shard"],
    ["Работа бригады",team?.name||work.project.title,work.project.title,"case/"+deal.caseId+"/work","team"],
    ["Приёмка",work.sh.title,"Принято"+(work.owner?" · "+displayMemberName(work.owner):""),"shard/"+work.sh.id,"check"]
  ];
  return '<div class="grid-world grid-story">'+heading+'<p>От предложения до принятого участка на одном объекте. Каждый этап открывает запись в ALPHA LAB.</p><ol class="grid-story-path">'+steps.map(([label,title,detail,path,glyph])=>
    `<li><a href="#${esc(path)}"><i>${icon(glyph)}</i><span><small>${label}</small><strong>${esc(title)}</strong><em>${esc(detail)}</em></span>${icon("open")}</a></li>`).join("")+'</ol>'+gridFilmLink()+'</div>';
}

function gridPage(route) {
  if (route.demo) return gridDemoPage();
  let data = state.network || {posts:[],deals:[]};
  if (route.caseId) {
    const deals=data.deals.filter(d=>d.caseId===route.caseId);
    const offerIds=new Set(deals.map(d=>d.postId));
    const posts=data.posts.filter(p=>p.caseId===route.caseId || offerIds.has(p.id));
    const related=new Set(posts.map(p=>p.id));
    data={posts,deals:data.deals.filter(d=>d.caseId===route.caseId || (!d.caseId && related.has(d.postId)))};
  }
  const projects = visibleProjectHub();
  const projectMap = new Map(projects.map(({c})=>[c.id,c]));
  const viewName = route.section.tabs.find(([key])=>key===route.view)[1];
  const title = route.postId?"Публикация":route.dealId?"Сделка":route.view==="all"?"Поток событий":route.view==="deals"?"Сделки по работам":route.view==="rental-deals"?"Сделки по аренде":viewName;
  const context = route.caseId ? state.cases.find(c=>c.id===route.caseId) : null;
  const publishLabel=route.view==="market"?"Предложение":route.view==="video"?"Видео":"Публикация";
  const toolbar = ["all","posts","video","market"].includes(route.view) ? `<button type="button" class="nt99-primary grid-publish" data-network="compose" aria-controls="nt99-composer" aria-expanded="${route.compose}"><b aria-hidden="true">＋</b> ${publishLabel}</button>` : "";
  const thread = route.view==="all" && !route.postId ? gridConnections(data,projectMap) : "";
  const heading = route.view==="all" && !route.postId && !route.compose ? "h2" : "h1";
  return `<div class="grid-world nt99-network">
    ${context?`<a class="grid-context" href="#case/${esc(context.id)}/network">← ${esc(context.title)}</a>`:""}
    ${gridMasthead(route,{people:state.crew.length,projects:projects.length,deals:data.deals.length})}
    ${gridNav(route)}
    <div class="grid-content${thread?" has-thread":""}"><div class="grid-main">
    ${route.dealId||route.postId?gridLink(gridPath(route.view),route.dealId?"← Все сделки":"← Весь поток"):""}
    <div class="grid-heading"><${heading}>${esc(title)}</${heading}>${toolbar}</div>
    ${toolbar?gridComposer(route):""}
    <p class="grid-save-status" id="grid-save-status" role="status"></p>
    <section class="nt99-feed" aria-label="${esc(title)}">${gridView(route,data,projects,projectMap)}</section>
    </div>${thread}</div>
    <footer class="grid-local"><i aria-hidden="true"></i>Локальное пространство · записи на этом устройстве</footer></div>`;
}

function networkContext(){return gridRoute()?.caseId || null}
document.addEventListener("change",e=>{if(e.target.id!=="nt99-kind")return;const market=["offer","available"].includes(e.target.value),fields=$("#nt99-market-fields");fields.hidden=!market;fields.querySelectorAll("input").forEach(x=>{x.disabled=!market;x.required=market})});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-network]");if(!b||!account())return;const action=b.dataset.network,id=b.dataset.id;try{if(action==="compose"){
  const el=$("#nt99-composer");
  el.hidden=!el.hidden;
  const trigger=$(".grid-publish");trigger?.setAttribute("aria-expanded",String(!el.hidden));
  if(el.hidden){trigger?.focus();return}
  el.querySelector("select").focus();el.scrollIntoView({block:"nearest"});return
 }const d=networkData(),p=d.posts.find(x=>x.id===id);if(action==="like"&&p){p.likes=p.likes||[];p.likes=p.likes.includes(state.actor)?p.likes.filter(x=>x!==state.actor):[...p.likes,state.actor];await networkSave(d)}else if(action==="delete"&&p&&p.author===state.actor){if(d.deals.some(x=>x.postId===id))throw Error("Публикация связана со сделкой");if(!confirm("Удалить публикацию?"))return;d.posts=d.posts.filter(x=>x.id!==id);await networkSave(d);/* Media bytes retained for local undo/history. */}else if(action==="draft"&&p&&["offer","available"].includes(p.kind)){if(!d.deals.some(x=>x.postId===id)){d.deals.push({id:crypto.randomUUID(),postId:id,title:p.title,region:p.region,budget:p.budget,terms:p.text,caseId:null});await networkSave(d)}openGrid("deals",{deal:d.deals.find(x=>x.postId===id).id});return}else if(action==="case"){const deal=d.deals.find(x=>x.id===id);if(!deal)return;if(deal.caseId){location.hash="case/"+deal.caseId;return}if(!confirm("Создать Case из сделки? Данные будут связаны в одном реестре."))return;b.disabled=true;try{if(await change(()=>apply(state,"network-case",{dealId:id})))location.hash="case/network-"+id}finally{b.disabled=false}return}else return;render()}catch(err){alert(err.message)}});
document.addEventListener("submit",async e=>{const form=e.target;if(form.id!=="nt99-post-form"&&!form.matches(".nt99-comment,.nt99-dealform"))return;e.preventDefault();if(!account())return;const btn=form.querySelector('button[type="submit"]');btn.disabled=true;let mediaId=null;try{const p=Object.fromEntries(new FormData(form)),d=networkData();if(form.id==="nt99-post-form"){const kind=p.kind,text=String(p.text||"").trim(),file=form.elements.media.files[0],market=["offer","available"].includes(kind),budget=Number(p.budget);if(!Object.hasOwn(networkKinds,kind)||!text||text.length>1200)throw Error("Заполните описание");if(market&&(!p.title.trim()||!p.region.trim()||!p.budget||!Number.isFinite(budget)||budget<0||budget>1e12))throw Error("Укажите название, регион и бюджет");const id=crypto.randomUUID();let mediaKind=null;if(file){if(file.size>30000000||!["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"].includes(file.type))throw Error("Допустимы фото и видео до 30 МБ");mediaKind=file.type.startsWith("video/")?"video":"image";if(kind==="video"&&mediaKind!=="video")throw Error("Выберите видео");await networkMedia("put",id,file);mediaId=id}else if(kind==="video")throw Error("Выберите видео");const current=networkData();current.posts.push({id,kind,text,author:state.actor,created:new Date().toISOString(),caseId:state.cases.some(c=>c.id===p.caseId)?p.caseId:null,likes:[],comments:[],mediaKind,...(market?{title:p.title.trim(),region:p.region.trim(),budget}:{})});await networkSave(current);mediaId=null;openGrid(kind==="video"?"video":market?"market":"all");return}else if(form.matches(".nt99-comment")){const post=d.posts.find(x=>x.id===form.dataset.id),text=String(p.text||"").trim();if(!post||!text||text.length>500)throw Error("Введите комментарий");post.comments=post.comments||[];post.comments.push({id:crypto.randomUUID(),author:state.actor,text});await networkSave(d)}else{const deal=d.deals.find(x=>x.id===form.dataset.id),terms=String(p.terms||"").trim(),budget=Number(p.budget);if(!deal||deal.caseId||!terms||terms.length>4000||!Number.isFinite(budget)||budget<0||budget>1e12)throw Error("Проверьте условия и бюджет");deal.terms=terms;deal.budget=budget;await networkSave(d);const status=$("#grid-save-status");if(status)status.textContent="Условия сохранены на устройстве."}}catch(err){if(mediaId)await networkMedia("delete",mediaId).catch(()=>{});const el=$("#nt99-error");if(form.id==="nt99-post-form"&&el)el.textContent=err.message;else alert(err.message);btn.disabled=false}});

const pages={start:()=>heading("Открыть свою компанию")+'<section class="panel"><p>Сейчас открыто пространство «'+esc(activeWorkspace().name)+'». Для приглашения создаётся отдельный локальный аккаунт.</p><button data-auth-logout>Выйти и открыть приглашение</button><button data-route="dashboard">К рабочему пространству</button></section>',"alpha-lab":alphaLabPage,company:companyProfile,finance:personalFinance,merit:meritWorkspace,analytics:analyticsWorkspace,dashboard:personalLobby,projects,garage,tasks,settings,pulse,lager:()=>garage("material"),fuhrpark:()=>garage("fuhrpark")};
function alphaLabPage(){
 if(!lab)return heading("Nvtsk System")+lobbySection("ALPHA LAB · Изолированная среда","",'<p>Тестовые участники, проекты и финансы хранятся отдельно от рабочего аккаунта.</p>'+button("Запустить лабораторию","sandbox"));
 const report=state.labReport||{operations:0,checks:[],groups:[]},fs=state.cases.map(c=>NVModel.financialCase(state,c.id));
 const metrics=[["Участники",state.crew.length],["Бригады",state.teams.length],["Активные Case",fs.filter(f=>!f.settled).length],["Закрытые Case",fs.filter(f=>f.settled).length],["Shards",state.shards.length],["Аренды",(state.rentals||[]).length]];
 return '<div class="nv103-lobby"><section class="panel nv112-labhero"><small>ALPHA LAB · Тестовая среда</small><h1>Nvtsk System</h1><p>Без реальных денег, пользователей и начислений. Меняйте тестового участника, проверяйте его задания и расчёты.</p><div class="nv104-grid">'+metrics.map(([k,v])=>'<div><small>'+k+'</small><b>'+v+'</b></div>').join("")+'</div><label>Смотреть от имени участника<select id="nv112-lab-actor">'+state.crew.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===state.actor?"selected":"")+'>'+esc(c.name+" · "+(c.company||""))+'</option>').join("")+'</select></label><div class="nv104-actions">'+lobbyLink("dashboard","Главная")+lobbyLink("projects","Проекты")+lobbyLink("merit","Паспорт Merit")+lobbyLink("member/"+state.actor,"Профиль")+lobbyLink("grid/demo","История сделки в Grid")+lobbyLink("grid","Grid")+lobbyLink("lager","Склад")+'</div></section>'+lobbySection("Автоматический прогон · "+report.operations+" операций",button("Сбросить и прогнать снова","lab-reset"),'<p class="hint">Отчёт первоначального сценария, не непрерывный мониторинг. После ручных изменений нажмите сброс для повторного прогона.</p>'+report.checks.map(x=>'<div class="taskrow"><strong>'+esc(x.name)+'</strong><span class="nv112-ok">'+(x.ok?"✓":"Ошибка")+'</span></div>').join(""))+lobbySection("Совместные проекты · прототип Alliance","",report.groups.map(g=>{const c=state.cases.find(x=>x.id===g.caseId);return c?lobbyRow("case/"+c.id,c.title,g.teamIds.map(id=>state.teams.find(t=>t.id===id)?.name||id).join(" + "),"Открыть"):""}).join("")+'<p class="hint">Схема нескольких бригад внутри Case. Самостоятельные компании и межфирменные соглашения пока не реализованы.</p>')+meritPassportPanel(state.actor)+'</div>';
}
function render(){
 networkRelease();
 if(!account()){
   const register=location.hash==="#register" || (location.hash!=="#login" && accounts().length===0);
   loginScreen(register);return;
 }
 if(["#register","#login"].includes(location.hash))window.history.replaceState(null,"","#dashboard");
 stopGoogleResize();document.body.classList.remove("nv90-auth");$("#nav").hidden=false;$(".top").hidden=false;
 let r=location.hash.slice(1)||"dashboard";if(r==="field"){r="projects";location.hash="projects"}
 const grid=gridRoute(r);
 $(".local").textContent="Local First";
 const sectionName=r.startsWith("partner/")?"Контрагент":r.startsWith("member/")?"Профиль участника":r.startsWith("team/")?"Сообщество":r.startsWith("shard/")?"Shard":r.startsWith("case/")?"Project":({company:"Профиль фирмы",finance:"Финансы",merit:"Merit",analytics:"Аналитика",projects:"Projects",tasks:"Приёмка",team:"Сообщество",network:"Grid",lager:"Склад",garage:"Garage",fuhrpark:"Автопарк",pulse:"Финансы и Merit",social:"Уведомления",settings:"Настройки","alpha-lab":"ALPHA LAB"})[r]||"Рабочее пространство";
 const sectionTitle=grid?"Grid":r==="dashboard"?"Центр":r.startsWith("rental/")?"Сделка · Rental":r.startsWith("rental-partner/")?"Партнёр · Rental":sectionName;const company=lab && (r==="dashboard" || r==="alpha-lab") ? "Nvtsk System" : lab ? actor().company||"ALPHA LAB" : activeWorkspace().name;
 const context=$("#nv108-context");if(context)context.textContent=company;
 document.body.dataset.section=r.split("/")[0];
 const workbar='<header class="nv108-workbar"><div class="workspace-ident"><span class="company-mark" aria-hidden="true">'+icon("layers")+'</span><div><b>'+esc(company)+'</b><small>Nvtsk_System</small></div></div><span class="section-location">'+esc(sectionTitle)+'</span></header>';
 $("#app").innerHTML=(lab?'<div class="labnotice nv112-labbar"><strong>ALPHA LAB · тестовые данные</strong><button data-route="alpha-lab">Участники</button><button data-action="sandbox">Выйти</button></div>':"")+(damaged?'<p role="alert">Ошибка чтения. Для восстановления откройте настройки и импортируйте копию.</p>':'')+workbar+(grid?gridPage(grid):r.startsWith("case/")?detail(...r.slice(5).split("/")):r.startsWith("shard/")?shardDetail(r.slice(6)):r.startsWith("lager/")?garage("material",r.slice(6)):r.startsWith("member/")?memberProfile(r.slice(7)):r.startsWith("rental/")?rentalRecord(r.slice(7)):r.startsWith("rental-partner/")?rentalPartnerProfile(r.slice(15)):r.startsWith("partner/")?counterpartyProfile(r.slice(8)):r.startsWith("finance/")?personalFinance(r.slice(8)):Object.hasOwn(pages,r)?pages[r]():personalLobby());
 document.querySelectorAll("#nav button[data-route]").forEach(b=>{
   const base=grid?"grid":r.split("/")[0];
   const parent={case:"projects",shard:"projects",partner:"projects",garage:"lager",fuhrpark:"lager",member:"grid",rental:"grid","rental-partner":"grid"};
   const current=b.dataset.route===(parent[base]||base);
   b.classList.toggle("active",current);
   if(current)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 });
 const more=$("#nv108-more");if(more)more.setAttribute("aria-expanded",String(document.body.classList.contains?.("nv108-more")||false));
 if(r==="projects")filterProjectHub();if(grid||r.startsWith("case/"))networkHydrate();
}
const input=(name,text,type="text")=>'<label>'+text+'<input required name="'+name+'" type="'+type+'" '+(type==="number"?'min="0" max="1000000000000" step=".01"':'maxlength="120"')+'></label>';
const select=(name,text,items,value)=>'<label>'+text+'<select required name="'+name+'">'+options(items,value)+'</select></label>';
const pairs=items=>items.map(x=>[x,x]);
let pending;
function fileLinks(files){return (files||[]).map(a=>'<a href="'+a.data+'" download="'+esc(a.name)+'" target="_blank" rel="noopener noreferrer">'+esc(a.name)+'</a>').join(" · ")}
function edit(kind,id,memberId){
 const s=state.shards.find(x=>x.id===id);
 const titles={"rental-partner":"Новый партнёр","rental-listing":"Предложение аренды","rental-request":"Заявка на аренду","rental-settle":"Расчёт аренды","finance-receipt":"Подтвердить поступление","finance-payout":"Подтвердить расчёт","finance-case-budget":"Бюджет Case","finance-shard-budget":"Бюджет Shard","finance-shares":"Распределение Shard","cash-income":"Записать поступление","cash-expense":"Записать расход","case-media":"Добавить фото / PDF","pv-tech":"PV · Паспорт объекта","pv-zone":"Новая Modulfläche","pv-string":"Новый DC String","pv-cut":"Раскрой шины","pv-material":"Материал для монтажа","pv-document":"Документ проекта",electrical:"Электромонтаж · New Project",case:"New Project",shard:"New Shard",task:"New Task","link-counterparty":"Заказчик Project",team:"Новая Team", "team-update":"Настроить Team", "assign-team":"Назначить Team",profile:"Редактировать профиль",material:"Новая позиция",crew:"Новый участник",assign:"Назначение",move:"Движение материала"};

 let fields=["case","electrical","shard","task","material","crew"].includes(kind)?input("title",kind==="crew"?"Имя":"Название"):"";
 if(kind.startsWith("rental-")){try{fields=rentalForm(kind,id)}catch(err){alert(err.message);return}}
 if(kind.startsWith("finance-")){try{fields=finForm(kind,id,memberId)}catch(err){alert(err.message);return}}
 if(kind==="cash-income"||kind==="cash-expense"){const direction=kind==="cash-income"?"income":"expense";fields='<label>Объект / Case<select name="caseId"><option value="">Общие средства · без объекта</option>'+options(state.cases.map(c=>[c.id,c.title+" · "+c.city]),id)+'</select></label><label>Дата<input type="date" name="date" value="'+localDay()+'" required></label><label>Сумма, €<input name="amount" type="number" inputmode="decimal" min="0.01" max="1000000000" step="0.01" required></label>'+select("category","Категория",Object.entries(cashLabels[direction]))+'<label>Комментарий<textarea name="note" maxlength="500" rows="2" placeholder="За что получены / потрачены деньги"></textarea></label><p class="hint">Только фактическое движение денег. Запись не меняет бюджет и Merit.</p>';}
 if(kind==="case-media"){if(!ownsCase(id)||!state.cases.some(c=>c.id===id))return;fields='<p class="hint">Медиа сохраняются локально. До 8 файлов на Case, изображения до 5 МБ (автоматическое сжатие), PDF до 650 КБ.</p>';}

 if(["pv-tech","pv-zone","pv-string","pv-cut","pv-material","pv-document"].includes(kind)){
   if(!ownsCase(id))return;
   const project=state.cases.find(c=>c.id===id);
   if(!project)return;
   fields=PVProjectCard.form(kind,project);
 }
 if(kind==="case"||kind==="electrical")fields+='<label>Адрес объекта<input name="address" maxlength="300" required placeholder="Straße, Hausnummer, PLZ, Ort"></label>'+input("price","Бюджет, €","number")+counterpartySelector(kind==="case"?id:null);
 if(kind==="electrical")fields+='<p>Этапы: разметка и штробы; кабельные трассы; подрозетники, розетки и освещение; сборка щита; измерения и приёмка. Подключение и ввод в эксплуатацию — только уполномоченным электроспециалистом (Elektrofachkraft).</p>';
 if(kind==="shard"&&!id){const owned=state.cases.filter(c=>ownsCase(c.id)&&finPlanEditable(NVModel.financialCase(state,c.id)));if(!owned.length)return alert("Сначала создайте собственный Case или верните план в редактирование");fields+=select("caseId","Case",owned.map(c=>[c.id,c.title+" · "+(c.address||c.city||"")]))}
 if(kind==="shard")fields+=select("kind","Этап",pairs(["Projektierung","DC","AC","Anmeldung","Elektro · Rohbau","Elektro · Kabel","Elektro · Installation","Elektro · Verteiler","Elektro · Prüfung","Другое"]))+input("price","Бюджет Shard, €","number");
 if(kind==="shard"||kind==="assign")fields+=select("assignee","Исполнитель",teamOptions(),s?.assignee||state.crew.find(c=>c.role===roles[1])?.id);
  if(kind==="task")fields+='<p class="hint">Task входит в выбранный Shard. Бюджет и Merit не изменяются.</p><label>Исполнитель<select name="assignee"><option value="">Исполнитель Shard</option>'+options(teamOptions())+'</select></label><label>Описание<textarea name="notes" maxlength="2000" rows="3" placeholder="Что нужно сделать и как проверить результат"></textarea></label>';
 if(kind==="material")fields+=`<label>Артикул / Artikelnummer<input required name="sku" maxlength="80" placeholder="2004260"></label><label>Производитель<input name="brand" maxlength="100" placeholder="K2 Systems / novotegra"></label>`;
 if(kind==="crew")fields+=select("role","Роль",roles.map(r=>[r,r===roles[0]?"Капитан":r]),roles[1]);
 if(kind==="link-counterparty"){
   if(!ownsCase(id))return;
   const project=state.cases.find(c=>c.id===id);
   if(!project)return;
   fields='<p class="hint">Выберите подтверждённого заказчика этого объекта. Существующий бюджет и Merit не изменятся.</p>'+counterpartySelector(project.counterpartyId||"");
 }
 if(kind==="team"||kind==="team-update"){
   if(!lead())return;
   const old=kind==="team-update"?state.teams.find(t=>t.id===id):null;
   const selected=new Set(old?.memberIds||[]);
   fields='<label>Название Team<input name="title" required maxlength="120" value="'+esc(old?.name||"")+'" placeholder="DC Team Bodensee"></label>'+
    '<label>Капитан бригады<select name="captainId" required>'+options(teamOptions(),old?.captainId||state.crew.find(c=>c.id!==state.actor)?.id||state.actor)+'</select></label>'+
    '<label>Описание<textarea name="description" maxlength="500" rows="3" placeholder="Специализация, регион, оборудование">'+esc(old?.description||"")+'</textarea></label>'+
    '<fieldset class="company-team-picker"><legend>Участники Team</legend>'+
    state.crew.map(c=>'<label><input type="checkbox" name="memberIds" value="'+esc(c.id)+'" '+(selected.has(c.id)?"checked":"")+'><span>'+esc(displayMemberName(c))+' · '+esc(displayRole(c))+'</span></label>').join("")+'</fieldset>'+
    '<p class="hint">Выбранный капитан автоматически включается в Team. При назначении Team на Shard капитан становится ответственным за сдачу работ.</p>';
 }
 if(kind==="assign-team"){
   if(!lead()||!state.teams.length)return;
   fields='<p class="hint">Team будет привязана к Shard. Капитан бригады станет ответственным за сдачу работ.</p>'+
     select("teamId","Выберите Team",state.teams.filter(t=>t.captainId!==state.actor).map(t=>[t.id,t.name+" · "+member(t.captainId)]));
 }
 if(kind==="profile"){
  const member=state.crew.find(c=>c.id===id);
  if(!member||member.id!==state.actor)return;
  fields='<p class="hint">Профиль сохраняется локально. Редактировать можно только свой.</p>'+
   '<label>Специализация / должность<input name="headline" maxlength="120" placeholder="DC Montage · Team Lead" value="'+esc(member.headline||"")+'"></label>'+
   '<label>Город / регион<input name="location" maxlength="100" placeholder="Stockach · Bodensee" value="'+esc(member.location||"")+'"></label>'+
   '<label>Адрес компании / профиль<input name="address" maxlength="240" placeholder="Hauptstraße 29, 88662 Überlingen" value="'+esc(member.address||"")+'"></label>'+
   '<label>Телефон<input name="phone" maxlength="50" placeholder="+49 160 ..." value="'+esc(member.phone||"")+'"></label>'+
   '<label>Email<input name="email" type="email" maxlength="160" placeholder="name@company.de" value="'+esc(member.email||"")+'"></label>'+
   '<label>Сайт компании<input name="website" type="url" maxlength="180" placeholder="https://www.example.de" value="'+esc(member.website||"")+'"></label>'+
   '<label>Навыки (через запятую, до 8)<input name="skillsText" maxlength="320" placeholder="PV, DC, K2, novotegra" value="'+esc((member.skills||[]).join(", "))+'"></label>'+
   '<label>О себе<textarea name="bio" maxlength="700" rows="4" placeholder="Опыт, специализация, интересы">'+esc(member.bio||"")+'</textarea></label>'+
   '<label>Фото профиля (PNG, JPEG, WebP · до 150 КБ)<input type="file" name="avatarFile" accept="image/png,image/jpeg,image/webp"></label>'+
   (member.avatar?'<label class="community-avatar-remove"><input type="checkbox" name="removeAvatar"> Удалить фото профиля</label>':"");
 }
 if(kind==="move"){const ctx=location.hash.startsWith("#lager/")?location.hash.slice(7):null,open=state.shards.filter(s=>s.status==="draft"&&(!ctx||s.caseId===ctx));fields+=select("type","Операция",open.length?[["issue","Выдача"],["return","Возврат"],["receive","Приход"],["writeoff","Списание"]]:[["receive","Приход"],["writeoff","Списание"]]);fields+='<div id="move-shard-wrap" hidden>'+select("shardId","Case / Shard",open.map(s=>[s.id,(state.cases.find(c=>c.id===s.caseId)?.title||"Case")+" / "+s.title]))+select("recipientId","Кому выдать / от кого вернуть",state.crew.map(c=>[c.id,c.name+" · "+c.role]))+'<p class="hint">Выберите участника, который фактически получает или возвращает материал. Оформляющий операцию записывается отдельно.</p></div>';}
 if(kind==="move")fields+=`<label>Причина списания<input name="reason" maxlength="300" placeholder="Брак, потеря, инвентаризация"></label>`;
 if(kind==="material"||kind==="move")fields+=input("qty","Количество, шт.","number").replace('step=".01"','step="1"').replace('min="0"','min="1"');
 if(["case","electrical","shard"].includes(kind))fields+='<label>Описание и инструкции<textarea name="notes" maxlength="4000" rows="3" placeholder="Объём работ, доступ, особенности объекта"></textarea></label><label>Фото / PDF (до 8 файлов, изображения до 5 МБ с автоматическим сжатием, PDF до 650 КБ)<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple></label><p class="hint">Файлы сохраняются локально вместе с Project и Shard и входят в JSON-экспорт. Не загружайте конфиденциальные документы на чужом устройстве.</p>';
 if(kind==="case-media")fields+='<label>Выбрать фото / PDF<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple required></label>';
 pending={kind,id};$("#dialogTitle").textContent=kind==="case-media"?titles[kind]+" · "+state.cases.find(c=>c.id===id).title:titles[kind];$("#fields").innerHTML=fields;if(kind==="move")syncMoveFields();$("#dialog").showModal();
}
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&document.body.classList.contains("nv108-more")){
   document.body.classList.remove("nv108-more");
   const more=$("#nv108-more");more.setAttribute("aria-expanded","false");more.focus();
 }
});
document.addEventListener("click",e=>{const more=e.target.closest("[data-shell-more]");if(more){const opened=document.body.classList.toggle("nv108-more");more.setAttribute("aria-expanded",String(opened));return}if(e.target.closest("[data-route]")||!e.target.closest("#nav")){document.body.classList.remove("nv108-more");$("#nv108-more")?.setAttribute("aria-expanded","false")}});
document.addEventListener("click",async e=>{
 const accept=e.target.closest('[data-action="case-accept"]');if(accept){acceptCase(accept.dataset.id);return}
 const handoff=e.target.closest('[data-action="case-transfer"]');if(handoff){transferCase(handoff.dataset.id,handoff.dataset.target);return}

 const select=e.target.closest('[data-action="project-select"]');
 if(select){
  projectHubSelectedCase=select.dataset.id;
  render();
  if(matchMedia("(max-width:760px)").matches){
   const inspector=document.getElementById("project-inspector");
   inspector?.focus({preventScroll:true});
   inspector?.scrollIntoView({block:"start"});
  }
  return;
 }
 if(e.target.closest("[data-project-list]")){
  const search=document.getElementById("project-hub-search");
  search?.focus({preventScroll:true});search?.scrollIntoView({block:"center"});return;
 }
 const phTab=e.target.closest('[data-action="project-tab"]');
 if(phTab){projectHubTab=phTab.dataset.tab;projectHubFilter="all";projectHubQuery="";projectHubCity="all";projectHubKind="all";render();return}
 const phSave=e.target.closest('[data-action="project-save"]');
 if(phSave){
   const id=phSave.dataset.id;
   if(!state.cases.some(c=>c.id===id))return;
   const saved=projectHubSaved();
   saved.has(id)?saved.delete(id):saved.add(id);
   try{localStorage.setItem(projectHubSavedKey(),JSON.stringify([...saved]));render()}catch(err){alert("Не удалось сохранить закладку: "+err.message)}
   return;
 }
 const phFilter=e.target.closest('[data-action="project-filter"]');
 if(phFilter){projectHubFilter=phFilter.dataset.filter;render();return}

 const jump=e.target.closest("[data-pv-target]");
 if(jump){
   const target=document.getElementById(jump.dataset.pvTarget);
   if(target)target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth",block:"start"});
   return;
 }
 const b=e.target.closest("[data-route],[data-action]");if(!b)return;
 if(b.dataset.route){location.hash=b.dataset.route;return}
 const a=b.dataset.action,id=b.dataset.id;
 if(["finance-activate","finance-deactivate","finance-convert","finance-settle","finance-case-cancel","finance-shard-cancel","finance-self-accept"].includes(a)){const msg={"finance-activate":"Активировать бесплатный план? Бюджет распределён полностью; комиссий нет.","finance-deactivate":"Вернуть план в редактирование? До первого платежа можно менять распределение.","finance-convert":"Перевести исторический план на бесплатную модель? Подтверждённых платежей ещё нет.","finance-settle":"Подтвердить окончательный расчёт? Будут разблокированы выплаты и Merit согласно правилам Case.","finance-case-cancel":"Отменить Case?","finance-shard-cancel":"Отменить Shard?","finance-self-accept":"Подтвердить собственную работу? Это не независимая приёмка."}[a];if(confirm(msg)){if(await change(()=>apply(state,a,{caseId:id,shardId:id,date:localDay()}))&&a.endsWith("-cancel"))location.hash="#projects"}return}
 if(["rental-confirm","rental-return","rental-cancel"].includes(a)){if(confirm("Подтвердить действие с арендой? Запись локальная."))await change(()=>apply(state,a,{id,date:localDay()}));return}
 if(a==="cash-void"){if(confirm("Аннулировать запись? Она останется в истории, но не будет учитываться в итогах."))await change(()=>apply(state,"cash-void",{id}));return}
 if(a==="lab-reset"){if(!lab||!confirm("Сбросить только тестовые данные ALPHA LAB?"))return;try{const data=NVModel.alphaLab();const record=JSON.stringify({format:1,data,history:[]});await projectWrite(KEY,raw,record);raw=record;state=data;history=[];damaged=false;render()}catch(err){alert(err.message)}return}
 if(a==="sandbox"){
   try{
     if(!lab){const key=workspaceKey(activeWorkspace().id)+"_alpha_lab_v1";const prior=await projectLoad(key);if(prior===null){const data=NVModel.alphaLab();await projectWrite(key,null,JSON.stringify({format:1,data,history:[]}))}sessionStorage.setItem(BASE+"_mode","alpha");location.hash=b.hasAttribute("data-grid-demo")?"grid/demo":"alpha-lab"}
     else {sessionStorage.removeItem(BASE+"_mode");location.hash="dashboard"}
     location.reload();
   }catch(error){alert(error.message)}
   return;
 }
 if(["pv-tech","pv-zone","pv-string","pv-cut","pv-material","pv-document"].includes(a)){edit(a,id);return}
 if(a==="pv-check"){
   const key=b.dataset.check;
   const current=Boolean(state.cases.find(c=>c.id===id)?.pvPlan?.checks?.[key]);
   await change(()=>apply(state,"pv-check",{caseId:id,key,value:!current}));
   return;
 }
 if(a==="pv-remove"){
   if(!confirm("Удалить эту запись из Project?"))return;
   await change(()=>apply(state,"pv-remove",{caseId:id,list:b.dataset.list,rowId:b.dataset.row}));
   return;
 }
 if(a==="edit-profile"){edit("profile",id);return}
 if(a==="link-counterparty"){edit("link-counterparty",id);return}
 if(a==="new-case-partner"){edit("case",id);return}
 if(a==="team-edit"){edit("team-update",id);return}
 if(a==="assign-team"){edit("assign-team",id);return}
 if(a.startsWith("new-")||a==="assign"||a==="move"){edit(a.replace("new-",""),id,b.dataset.member);return}
 if(["accept","submit","revise"].includes(a))await change(()=>apply(state,a,{shardId:id}));
  if(a==="task-next"){const t=state.tasks.find(t=>t.id===id);if(t)await change(()=>apply(state,"task-status",{taskId:id,status:t.status==="todo"?"doing":t.status==="doing"?"done":"todo"}));}
 if(a==="undo"&&lead()&&history.length&&confirm("Вернуть предыдущий снимок данных?"))await change(()=>history.at(-1),true);
 if(a==="export"){
 const url=URL.createObjectURL(new Blob([damaged?raw:JSON.stringify(state,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download=lab?"NVTSK-ALPHA-LAB.json":"nvtsk-05.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
});
function syncMoveFields(){const type=$("#fields [name=type]")?.value;const wrap=$("#move-shard-wrap");if(!wrap)return;const linked=type==="issue"||type==="return";wrap.hidden=!linked;const picker=wrap.querySelector("select");if(picker)picker.required=linked;const recipient=wrap.querySelector('select[name="recipientId"]');if(recipient){recipient.required=linked;const sh=state.shards.find(s=>s.id===picker?.value);if(linked&&sh){const ids=type==="return"?new Set(NVModel.caseRelations(state,sh.caseId).stock.filter(x=>x.shardId===sh.id&&x.itemId===pending.id&&x.qty>0).map(x=>x.recipientId)):new Set(NVModel.caseRelations(state,sh.caseId).memberIds);const selected=recipient.value;recipient.innerHTML=options(state.crew.filter(c=>ids.has(c.id)).map(c=>[c.id,c.name]),selected)}}const reason=$("#fields [name=reason]");if(reason)reason.required=type==="writeoff";}
document.addEventListener("change",async e=>{
 if(e.target.id==="nv112-lab-actor"){if(lab&&state.crew.some(c=>c.id===e.target.value))await change(()=>({...state,actor:e.target.value}));return}

 if(e.target.id==="nv110-profile-import"&&e.target.files?.length){if(lab){alert("Персональный профиль импортируется только в рабочем режиме");e.target.value="";return}try{const file=e.target.files[0];if(file.size>16000)throw Error("Файл профиля слишком большой");const profile=JSON.parse(await file.text());apply(state,"profile-import",{profile});if(confirm("Обновить ваш профиль: "+profile.name+"? Проекты, деньги и Merit останутся без изменений.")){if(await change(()=>apply(state,"profile-import",{profile})))location.hash="member/"+state.actor}}catch(err){alert(err.message)}finally{e.target.value=""}return}

 if(e.target.id==="company-logo-upload"&&e.target.files?.length){if(lab){alert("Логотип рабочего аккаунта не меняется в ALPHA LAB");e.target.value="";return}try{const file=e.target.files[0];if(!file.type.startsWith("image/")||file.size>5000000)throw Error("Нужен JPG, PNG или WebP до 5 МБ");const bitmap=await createImageBitmap(file),canvas=document.createElement("canvas"),scale=Math.min(1,720/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const logoData=canvas.toDataURL("image/webp",0.72);if(logoData.length>400000)throw Error("Изображение слишком большое");const r=workspaceRegistry();localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,items:r.items.map(w=>w.id===activeWorkspace().id?{...w,logoData}:w)}));render()}catch(err){alert(err.message)}return}

 if(e.target.id==="ph-city"){projectHubCity=e.target.value;filterProjectHub();return}
 if(e.target.id==="ph-kind"){projectHubKind=e.target.value;filterProjectHub();return}
 if(["type","shardId"].includes(e.target.name)&&pending?.kind==="move")syncMoveFields();

 if(e.target.id==="import"&&lead()&&e.target.files.length){try{
 const file=e.target.files[0];if(file.size>100000000)throw Error("JSON-файл больше 100 МБ");
 const data=validate(migrate(JSON.parse(await file.text())));
 if(confirm("Заменить локальные данные данными из файла?"))await change(()=>data,false,true);
 }catch(err){alert(err.message)}finally{e.target.value=""}}
});
document.addEventListener("input",e=>{if(e.target.id==="project-hub-search"){projectHubQuery=e.target.value;filterProjectHub()}if(e.target.id==="stock-search")document.querySelectorAll("[data-stock]").forEach(el=>el.hidden=!el.dataset.stock.includes(e.target.value.toLowerCase()))});
$("#cancel").onclick=()=>$("#dialog").close();
function projectSavedNotice(){document.getElementById("nv102-save-notice")?.remove();const el=document.createElement("div");el.id="nv102-save-notice";el.setAttribute("role","status");el.textContent=lab?"Проект сохранён в тестовой копии":"✓ Проект сохранён на устройстве";el.style.cssText="position:fixed;z-index:9999;left:50%;transform:translateX(-50%);bottom:calc(90px + env(safe-area-inset-bottom,0px));max-width:90vw;padding:12px 18px;border:1px solid #648d98;border-radius:16px;background:#172d38;color:#eaf7fa;font:600 14px system-ui;box-shadow:0 5px 20px #0008;text-align:center;pointer-events:none";document.body.append(el);setTimeout(()=>el.remove(),4200)}
$("#editor").onsubmit=async e=>{
 e.preventDefault();const {kind,id}=pending,p=Object.fromEntries(new FormData(e.target));
 const selected=e.target.elements.media?.files;
 const avatarFile=e.target.elements.avatarFile?.files?.[0];
 if(kind==="pv-tech"||kind==="case-media")p.caseId=id;
 if(["pv-zone","pv-string","pv-cut","pv-material","pv-document"].includes(kind)){
   p.caseId=id;
   p.list={"pv-zone":"zones","pv-string":"strings","pv-cut":"cuts","pv-material":"materials","pv-document":"documents"}[kind];
 }
 if(kind==="team"||kind==="team-update"){
   p.memberIds=new FormData(e.target).getAll("memberIds");
   if(kind==="team-update")p.teamId=id;
 }
 if(kind==="assign-team")p.shardId=id;
 if(kind==="profile"){
  p.memberId=id;
  p.skills=String(p.skillsText||"").split(",").map(x=>x.trim()).filter(Boolean);
  delete p.skillsText;
  const remove=Boolean(p.removeAvatar);
  delete p.removeAvatar;
  delete p.avatarFile;
  if(remove)p.avatar="";
 }
 delete p.media;
 for(const k of ["title","city"])if(k in p)p[k]=p[k].trim();
 if(kind==="case"||kind==="electrical"){p.address=String(p.address||"").trim();if(!p.address)throw Error("Укажите адрес объекта");const segments=p.address.split(",").map(x=>x.trim()).filter(Boolean);p.city=(segments[segments.length-1]||p.address).replace(/^\d{4,5}\s+/,"").slice(0,120);}

 for(const k of ["price","qty"])if(k in p)p[k]=Number(p[k]);
 p.id=crypto.randomUUID();if(kind==="link-counterparty")p.caseId=id;if(kind==="shard")p.caseId=id||p.caseId;if(kind==="task")p.shardId=id;if(kind==="assign")p.shardId=id;if(kind==="move"){p.itemId=id;if(p.type==="receive"||p.type==="writeoff")p.shardId=null;}
 const submit=e.target.querySelector('[type="submit"]');submit.disabled=true;
 try{
   if(kind==="profile"&&avatarFile){
     if(avatarFile.size>150000)throw Error("Фото должно быть не больше 150 КБ");
     if(!["image/png","image/jpeg","image/webp"].includes(avatarFile.type))throw Error("Допустимы PNG, JPEG или WebP");
     p.avatar=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("Не удалось прочитать фото"));reader.readAsDataURL(avatarFile)});
   }
   if(selected&&selected.length){
     if(selected.length>8)throw Error("Максимум 8 файлов за раз");
     p.files=await Promise.all(Array.from(selected,async file=>{
       const imageTypes=["image/png","image/jpeg","image/webp","image/gif"];
       if(imageTypes.includes(file.type)){
         if(file.size>5000000)throw Error("Изображение "+file.name+" больше 5 МБ");
         const bitmap=await createImageBitmap(file);
         try{
           let width=bitmap.width,height=bitmap.height;
           const maxSide=1600,scale=Math.min(1,maxSide/Math.max(width,height));
           const canvas=document.createElement("canvas");
           canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
           canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
           let data="";
           for(const quality of [0.8,0.65,0.5,0.35]){
             data=canvas.toDataURL("image/webp",quality);
             if(data.length<=680000)break;
           }
           if(data.length>680000)throw Error("Не удалось сжать "+file.name+" для локального хранения");
           return {id:crypto.randomUUID(),name:file.name.slice(0,180),data};
         }finally{bitmap.close()}
       }
       if(file.type!=="application/pdf")throw Error("Недопустимый тип файла");
       if(file.size>650000)throw Error("PDF "+file.name+" больше 650 КБ");
       const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("Ошибка чтения файла"));reader.readAsDataURL(file)});
       return {id:crypto.randomUUID(),name:file.name.slice(0,180),data};
     }));
   }
   const operation=()=>{
     if(kind==="rental-partner")return apply(state,kind,{...p,external:p.external==="yes"});
     if(kind==="rental-listing")return apply(state,kind,{...p,dailyCents:finParse(p.amount)});
     if(kind==="rental-request")return apply(state,kind,{...p,listingId:id});
     if(kind==="rental-settle")return apply(state,kind,{id,paidCents:finParse(p.amount),costCents:finParse(p.cost||"0",true),date:p.date,ref:p.ref});
     if(kind==="finance-receipt")return apply(state,kind,{caseId:id,id:p.id,cents:finParse(p.amount),date:p.date,ref:p.ref});
     if(kind==="finance-payout")return apply(state,kind,{caseId:id,memberId:p.memberId,date:p.date,ref:p.ref});
     if(kind==="finance-case-budget"||kind==="finance-shard-budget")return apply(state,kind,{caseId:id,shardId:id,price:finParse(p.amount,kind==="finance-shard-budget")/100});
     if(kind==="finance-shares")return apply(state,kind,{shardId:id,organizerId:p.organizerId,shares:state.crew.map(c=>({memberId:c.id,cents:finParse(p["share_"+c.id]||"0",true),className:p["class_"+c.id]})).filter(x=>x.cents>0)});
     if(kind==="cash-income"||kind==="cash-expense"){const value=String(p.amount||"");if(!/^\d+(?:\.\d{1,2})?$/.test(value))throw Error("Введите сумму с точностью до центов");const [whole,frac=""]=value.split(".");const cents=Number(whole)*100+Number(frac.padEnd(2,"0"));return apply(state,"cash-add",{id:p.id,caseId:p.caseId||null,direction:kind==="cash-income"?"income":"expense",category:p.category,cents,date:p.date,note:p.note||""})}
     if(kind!=="electrical")return apply(state,["pv-zone","pv-string","pv-cut","pv-material","pv-document"].includes(kind)?"pv-add":kind==="team"?"team-create":kind==="assign-team"?"team-assign":kind,p.counterpartyId===""?{...p,counterpartyId:null}:p);
     const caseId=p.id;
     let next=apply(state,"case",{id:caseId,title:p.title,city:p.city,price:p.price,address:p.address,notes:p.notes,files:p.files,counterpartyId:p.counterpartyId||null});
     const steps=[
       ["Разметка, штробы и подготовка трасс","Elektro · Rohbau",20],
       ["Прокладка кабелей и крепление трасс","Elektro · Kabel",25],
       ["Подрозетники, розетки, выключатели и световые точки","Elektro · Installation",20],
       ["Монтаж и сборка распределительного щита","Elektro · Verteiler",25],
       ["Измерения, проверка и приёмка Elektrofachkraft","Elektro · Prüfung",10]
     ];
     let allocated=0;
     steps.forEach(([title,kindName,percent],i)=>{
       const price=i===steps.length-1?Math.round((p.price-allocated)*100)/100:Math.round(p.price*percent)/100;
       allocated+=price;
       next=apply(next,"shard",{id:crypto.randomUUID(),caseId,title,kind:kindName,price,assignee:null});
     });
     return next;
   };
   if(await change(operation)){$("#dialog").close();if(kind.startsWith("rental-")){openGrid(kind==="rental-partner"?"partners":kind==="rental-listing"?"rental":"rental-deals")}else if(kind==="case"||kind==="electrical"){location.hash="case/"+p.id;projectSavedNotice()}else if(kind==="team"||kind==="team-update")location.hash="grid/teams"}
 }catch(error){alert(error.message||"Ошибка вложения")}
 finally{submit.disabled=false}
};
// v109: navigation is authored in the shell; no obsolete Field controls.
const navIconNames={"alpha-lab":"lab",tasks:"check",grid:"grid",dashboard:"home",projects:"layers",team:"team",lager:"box",finance:"coins",merit:"passport",analytics:"pulse",pulse:"pulse",field:"field",social:"bell",settings:"settings"};
document.querySelectorAll("#nav button[data-route]").forEach(b=>{const holder=b.querySelector(".nav-glyph");if(holder&&!holder.querySelector("svg"))holder.innerHTML=icon(navIconNames[b.dataset.route]||"box")});
addEventListener("hashchange",()=>{if(projectReady){render();scrollTo(0,0)}});
async function refreshProjectRecords(key){if(!projectReady||!projectKeys().includes(key))return;try{await projectLoad(key);if(key===KEY){if((projectRecords.get(KEY)??null)===raw)return;readProjectState();if($("#dialog").open){$("#dialog").close();alert("Проект изменён в другой вкладке. Откройте форму снова.")}}render()}catch(error){console.warn("NVTSK storage refresh",error)}}
addEventListener("storage",e=>{if(e.key===SESSION_KEY||e.key===ACCOUNT_KEY||e.key===null){sessionStorage.removeItem(SESSION_KEY);if((account()?.id||"")!==bootAccountId){projectReady=false;location.reload();return}}if(e.key&&projectKeys().includes(e.key))refreshProjectRecords(e.key)});
async function bootProjects(){
 $("#nav").hidden=true;$(".top").hidden=true;
 try{await loadProjectRecords();await ensureWorkspace(activeWorkspace().id);readProjectState();if(typeof BroadcastChannel==="function"){projectChannel=new BroadcastChannel("nvtsk-workspaces");projectChannel.onmessage=e=>refreshProjectRecords(e.data?.key)}projectReady=true;await migrateNetwork();render()}
 catch(error){projectReady=false;$("#app").innerHTML='<section class="panel"><h2>Хранилище временно недоступно</h2><p>'+esc(projectError(error))+'</p><p>Существующие данные не удалены. Не очищайте данные сайта.</p><button id="nv101-retry-store">Повторить</button></section>';$("#nv101-retry-store").onclick=bootProjects}
}
bootProjects();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
