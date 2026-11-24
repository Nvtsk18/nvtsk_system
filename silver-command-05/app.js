(()=>{"use strict";
const BASE="nvtsk05_independent";
// NVTSK owns the product identity; SolAn Plus GmbH is the initial internal-company workspace.
const APP_BRAND=Object.freeze({developer:"NVTSK SYSTEM",workspace:"SolAn Plus GmbH",workspaceId:"solan-plus",scope:"Первый рабочий профиль"});
// Stage 1: platform identity and explicit workspace boundary; no fictitious multi-profile support.
const WORKSPACES_KEY=BASE+"_workspaces_v1";
function workspaceRegistry(){try{const r=JSON.parse(localStorage.getItem(WORKSPACES_KEY)||"null");if(r&&Array.isArray(r.items)&&r.items.length){if(!r.items.some(x=>x.id==="sunpaur"))return {...r,items:[...r.items,{id:"sunpaur",name:"Sunpaur GmbH",symbol:"☀",kind:"auftraggeber"}]};return r}}catch{}return {active:"solan-plus",items:[{id:"solan-plus",name:"SolAn Plus GmbH",symbol:"S"},{id:"sunpaur",name:"Sunpaur GmbH",symbol:"☀",kind:"auftraggeber"}]}}
function activeWorkspace(){const r=workspaceRegistry();return r.items.find(w=>w.id===r.active)||r.items[0]}
function workspaceBadge(){return '<span class="nv91-company-name" style="display:block;min-width:0;font-weight:700;font-size:14px;overflow-wrap:anywhere">'+esc(activeWorkspace().name)+'</span>'}
function workspaceKey(id){return id==="solan-plus"?BASE:BASE+"_company_"+id}
function ensureWorkspace(id){if(id==="solan-plus"||localStorage.getItem(workspaceKey(id)))return;const seed=migrate({version:1,cases:[],shards:[],tasks:[],garage:[],crew:[],actor:"lead"});const company=id==="sunpaur"?"Sunpaur GmbH":activeWorkspace().name;const data=validate({...seed,crew:[{id:"lead",name:"Администратор · "+company,role:roles[0],company}],counterparties:[]});localStorage.setItem(workspaceKey(id),JSON.stringify({format:1,data,history:[]}))}
const SHARED_CASES_KEY=BASE+"_case_access_v1";
function caseAccessRegistry(){try{const r=JSON.parse(localStorage.getItem(SHARED_CASES_KEY)||"{}");return r&&typeof r==="object"?r:{}}catch{return {}}}
function sharedCase(id){const entry=caseAccessRegistry()[id];if(!entry||entry.status!=="accepted"||entry.executorId!==activeWorkspace().id)return null;const ownerRaw=localStorage.getItem(workspaceKey(entry.ownerId));if(!ownerRaw)return null;try{const rec=JSON.parse(ownerRaw),data=validate(migrate(rec.format===1?rec.data:rec));return data.cases.find(c=>c.id===id)||null}catch{return null}}
function incomingCases(){const entries=Object.entries(caseAccessRegistry()).filter(([id,x])=>x.status==="accepted"&&x.executorId===activeWorkspace().id);return entries.map(([id])=>sharedCase(id)).filter(Boolean)}
function transferCase(caseId,targetId){if(!lead()||lab)return;const owner=activeWorkspace(),target=workspaceRegistry().items.find(w=>w.id===targetId),c=state.cases.find(x=>x.id===caseId);if(!target||!c||target.id===owner.id)return;if(!confirm("Открыть доступ к Case «"+c.title+"» для "+target.name+"? Карточка останется единственной."))return;const reg=caseAccessRegistry();reg[caseId]={ownerId:owner.id,executorId:target.id,status:"offered",offeredAt:new Date().toISOString()};localStorage.setItem(SHARED_CASES_KEY,JSON.stringify(reg));render()}
function acceptCase(id){const reg=caseAccessRegistry(),entry=reg[id];if(!entry||entry.executorId!==activeWorkspace().id||entry.status!=="offered")return;reg[id]={...entry,status:"accepted",acceptedAt:new Date().toISOString()};localStorage.setItem(SHARED_CASES_KEY,JSON.stringify(reg));render()}
function offeredCases(){return Object.entries(caseAccessRegistry()).filter(([id,e])=>e.executorId===activeWorkspace().id&&e.status==="offered").map(([id,e])=>{try{const record=JSON.parse(localStorage.getItem(workspaceKey(e.ownerId))||"null");if(!record)return null;const data=validate(migrate(record.format===1?record.data:record));return {id,case:data.cases.find(c=>c.id===id),ownerId:e.ownerId}}catch{return null}}).filter(x=>x&&x.case)}
function sharedCaseReadOnly(id){return !state.cases.some(c=>c.id===id)&&!!sharedCase(id)}
function companyProfile(){const w=activeWorkspace(),sun=w.id==="sunpaur";const emblem=w.logoData?'<img class="cp78-custom-logo" src="'+w.logoData+'" alt="Логотип компании">':sun?'<div class="cp78-sun-logo"><div class="cp78-sun">☀</div><div class="cp78-mountain">⌁</div><div class="cp78-panels">▱▱▱▱▱</div></div>':'<div class="cp78-monogram">'+esc(w.symbol||w.name[0])+'</div>';const rows=sun?state.cases.map(c=>'<div class="cp78-handoff-row"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city||c.address||"Объект")+'</small></span><button data-action="case-transfer" data-id="'+esc(c.id)+'" data-target="solan-plus">Открыть доступ SolAn Plus →</button></div>').join(""):"";return '<div class="cp78-company"><div class="cp78-hero"><div class="cp78-art">'+emblem+'</div><div class="cp78-title"><small>ПРОФИЛЬ КОМПАНИИ · '+(sun?"ЗАКАЗЧИК / AUFTRAGGEBER":"ИСПОЛНИТЕЛЬ / AUFTRAGNEHMER")+'</small><h1>'+esc(w.name)+'</h1><p>'+(sun?"Создание проектов и передача исполнителю":"Монтаж PV и управление работами")+'</p></div></div><div class="cp78-logo-tools"><label>Логотип компании <input id="company-logo-upload" type="file" accept="image/png,image/jpeg,image/webp"></label><small>Загрузите изображение с визитки · хранение на этом устройстве.</small></div><div class="cp78-stats"><div><strong>'+state.cases.length+'</strong><small>Case</small></div><div><strong>'+state.crew.length+'</strong><small>Участники</small></div><div><strong>'+state.shards.length+'</strong><small>Shards</small></div></div><section class="panel"><h2>Рабочее пространство</h2><div class="cp78-buttons"><button data-route="projects">Проекты</button><button data-route="team">Участники</button>'+(lead()?'<button data-action="new-case">＋ Создать Case</button>':'')+'</div></section>'+'<section class="panel"><h2>Приглашения к Case</h2>'+((offeredCases().map(x=>'<div class="cp78-handoff-row"><strong>'+esc(x.case.title)+'</strong><button data-action="case-accept" data-id="'+esc(x.id)+'">Принять Case</button></div>').join(""))||'<p>Новых приглашений нет.</p>')+'</section>'+(sun?'<section class="panel"><h2>Передача Case → SolAn Plus</h2><p>Создайте и заполните Case, затем передайте его исполнителю. Открывается доступ к единой карточке, включая паспорт и медиа. Исполнитель должен принять Case.</p>'+(rows||'<p>Пока нет Case для передачи.</p>')+'</section>':'<section class="panel"><h2>Полученные Case</h2><p>Принятые Case отображаются в разделе Projects.</p></section>')+'</div>'}
const ACCOUNT_KEY=BASE+"_accounts_v1", SESSION_KEY=BASE+"_session_v1";
function accounts(){try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||"[]")}catch{return []}}
function account(){return accounts().find(a=>a.id===sessionStorage.getItem(SESSION_KEY))}
async function passwordHash(password,salt){const enc=new TextEncoder(),key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:210000,hash:"SHA-256"},key,256))).map(x=>x.toString(16).padStart(2,"0")).join("")}
function enterAccount(a){const r=workspaceRegistry();localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,active:a.workspaceId}));sessionStorage.setItem(SESSION_KEY,a.id);sessionStorage.removeItem(BASE+"_mode");location.hash="#dashboard";location.reload()}
function authIcon(name){const paths={email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',company:'<path d="M3 21h18M5 21V7l10-4v18m0-11h4v11M8 10h1m2-1h1m-4 5h1m2-1h1m-4 5h1m2-1h1"/>',eye:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',eyeOff:'<path d="m3 3 18 18M10 6.2c.7-.2 1.3-.2 2-.2 6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.1 7.7A19 19 0 0 0 2 12s3.6 6 10 6c1.1 0 2.2-.2 3.2-.5"/>'};return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>'}
// Google identity for the local-first MVP. No Google token is stored.
const GOOGLE_CLIENT_ID=(document.querySelector('meta[name="nvtsk-google-client-id"]')?.content||"").trim();
let googleSdkPromise,googleAttempt=0,googlePending=null;
function googleError(message){const el=$("#nv95-google-status");if(el)el.textContent=message}
function googleScript(){if(window.google?.accounts?.id)return Promise.resolve();if(!googleSdkPromise)googleSdkPromise=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.onload=()=>window.google?.accounts?.id?resolve():reject(Error("Google недоступен"));s.onerror=()=>reject(Error("Не удалось загрузить Google"));document.head.append(s)}).catch(e=>{googleSdkPromise=null;throw e});return googleSdkPromise}
function googleBytes(s){return Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(s.length/4)*4,"=")),c=>c.charCodeAt(0))}
async function verifyGoogleCredential(token,nonce){const p=String(token||"").split(".");if(p.length!==3)throw Error("Некорректный ответ Google");const decode=s=>JSON.parse(new TextDecoder().decode(googleBytes(s))),h=decode(p[0]),v=decode(p[1]),now=Math.floor(Date.now()/1000);if(h.alg!=="RS256"||!h.kid||!["accounts.google.com","https://accounts.google.com"].includes(v.iss)||v.aud!==GOOGLE_CLIENT_ID||(v.azp&&v.azp!==GOOGLE_CLIENT_ID)||!Number.isFinite(v.exp)||v.exp<=now||!Number.isFinite(v.iat)||v.iat>now+60||v.nonce!==nonce||typeof v.sub!=="string"||!v.sub||v.email_verified!==true||typeof v.email!=="string"||!v.email)throw Error("Google не подтвердил аккаунт");const res=await fetch("https://www.googleapis.com/oauth2/v3/certs",{cache:"no-store",credentials:"omit"});if(!res.ok)throw Error("Не удалось проверить подпись Google");const jwks=await res.json(),jwk=jwks.keys?.find(k=>k.kid===h.kid&&k.kty==="RSA"&&(!k.alg||k.alg==="RS256"));if(!jwk)throw Error("Ключ Google не найден");const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,googleBytes(p[2]),new TextEncoder().encode(p[0]+"."+p[1])))throw Error("Подпись Google недействительна");return {sub:v.sub,email:v.email.trim().toLowerCase(),name:typeof v.name==="string"?v.name.slice(0,100):"",exp:v.exp}}
function createPersonalAccount({email,nickname,provider="password",salt,hash,googleSub}){const name=String(nickname||"").trim();if(!name||name.length>100)throw Error("Укажите никнейм (до 100 символов)");const list=accounts();if(list.some(x=>x.email===email||(googleSub&&x.googleSub===googleSub)))throw Error("Аккаунт уже существует");const r=workspaceRegistry(),id="account-"+crypto.randomUUID(),a={id:crypto.randomUUID(),email,nickname:name,kind:"individual",workspaceId:id,actorId:"lead",provider,...(provider==="google"?{googleSub}:{salt,hash})},item={id,name,symbol:Array.from(name)[0].toUpperCase(),kind:"individual"};const data=validate({version:2,personalProfile:true,cases:[],shards:[],tasks:[],garage:[],crew:[{id:"lead",name,role:roles[0],company:""}],actor:"lead",moves:[],teams:[],counterparties:[]});localStorage.setItem(workspaceKey(id),JSON.stringify({format:1,data,history:[]}));localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,items:[...r.items,item]}));localStorage.setItem(ACCOUNT_KEY,JSON.stringify([...list,a]));return a}
function googleOnboarding(identity){googlePending=identity;const glass=$(".nv94-glass");if(!glass)return;$(".nv94-brand h2").textContent="Добро пожаловать!";glass.innerHTML='<div class="nv95-onboarding"><p class="nv95-confirmed">Google · '+esc(identity.email)+'</p><form id="nv95-google-onboarding"><label for="nv95-name">Никнейм</label><div class="nv94-field"><span class="nv95-name-icon">'+authIcon("user")+'</span><input id="nv95-name" name="nickname" maxlength="100" autocomplete="nickname" placeholder="Как тебя называть?" required></div><button class="nv94-submit" type="submit">Продолжить</button><p id="nv95-google-status" role="status"></p></form><button type="button" class="nv94-switch" data-auth-toggle="true">Назад</button></div>'}
async function googleResult(response,nonce,attempt){try{if(attempt!==googleAttempt)return;googleError("Проверяем аккаунт Google…");const identity=await verifyGoogleCredential(response.credential,nonce);if(attempt!==googleAttempt)return;const list=accounts(),a=list.find(x=>x.googleSub===identity.sub&&x.provider==="google");if(a){enterAccount(a);return}if(list.some(x=>x.email===identity.email))throw Error("Этот email уже используется. Войдите прежним способом. Автоматическое объединение отключено.");googleOnboarding(identity)}catch(e){if(attempt===googleAttempt)googleError(e.message||"Не удалось войти через Google")}}
async function mountGoogle(){const attempt=++googleAttempt,host=$("#nv95-google-button");if(!host)return;googlePending=null;if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID)){googleError("Google-вход ожидает настройки OAuth.");return}try{await googleScript();if(attempt!==googleAttempt||!host.isConnected)return;const nonce=crypto.randomUUID();window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:r=>googleResult(r,nonce,attempt),nonce,auto_select:false,ux_mode:"popup"});host.replaceChildren();window.google.accounts.id.renderButton(host,{type:"standard",theme:"filled_black",size:"large",text:"continue_with",shape:"pill",logo_alignment:"left",width:Math.min(400,Math.max(200,Math.floor(host.getBoundingClientRect().width))),locale:"ru"});googleError("")}catch(e){if(attempt===googleAttempt)googleError(e.message||"Google недоступен")}}

document.addEventListener("submit",e=>{if(e.target.id!=="nv95-google-onboarding")return;e.preventDefault();const form=e.target,btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{const i=googlePending,p=Object.fromEntries(new FormData(form));if(!i||i.exp<=Date.now()/1000)throw Error("Сессия Google истекла. Повторите вход.");const a=createPersonalAccount({email:i.email,nickname:p.nickname,provider:"google",googleSub:i.sub});googlePending=null;enterAccount(a)}catch(err){googleError(err.message);btn.disabled=false}});
function loginScreen(register=false){document.body.classList.add("nv90-auth");$("#nav").hidden=true;$(".top").hidden=true;$("#app").innerHTML='<div class="nv94-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i></div><section class="nv90-login nv94-login"><div class="nv94-brand"><img class="nv92-auth-logo" src="art/nvtsk-approved.webp" alt="NVTSK SYSTEM" width="160" height="144"><h1>NVTSK SYSTEM</h1><div class="nv94-divider" aria-hidden="true"></div><h2>'+(register?"Добро пожаловать!":"С возвращением!")+'</h2></div><div class="nv94-glass"><form id="nv90-auth-form" data-register="'+register+'"><div class="nv97-auth-fields" id="nv97-credentials"><label for="nv94-email">Email</label><div class="nv94-field">'+authIcon("email")+'<input id="nv94-email" name="email" type="email" autocomplete="email" required></div><label for="nv94-password">Пароль</label><div class="nv94-field nv94-password">'+authIcon("lock")+'<input id="nv94-password" name="password" type="password" minlength="8" autocomplete="'+(register?"new-password":"current-password")+'" required><button type="button" class="nv94-eye" data-auth-password aria-label="Показать пароль" aria-pressed="false">'+authIcon("eye")+'</button></div></div>'+(register?'<div class="nv97-auth-fields" id="nv97-profile"><label for="nv94-name">Никнейм</label><div class="nv94-field"><span class="nv94-name-icon">'+authIcon("user")+'</span><input id="nv94-name" name="nickname" maxlength="100" autocomplete="nickname" placeholder="Как тебя называть?" required></div></div>':'')+'<button class="nv94-submit" type="submit">'+(register?"Создать аккаунт":"Войти")+'</button><p id="nv90-auth-error" role="alert"></p></form><div id="nv97-alternatives"><div class="nv95-or"><span>или</span></div><div id="nv95-google-button"><button type="button" class="nv95-google-placeholder" disabled><svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9h12.94c-.58 3-2.24 5.54-4.76 7.25l7.73 6C44.42 38.08 46.98 31.89 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.27-3.13.79-4.59l-7.98-6.19A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.75l-7.73-6A14.5 14.5 0 0 1 10.53 28.59l-7.97 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>Продолжить с Google</button></div><p id="nv95-google-status" role="status"></p><button class="nv94-switch" type="button" data-auth-toggle="'+(!register)+'">'+(register?'Уже есть аккаунт? <strong>Войти</strong>':'<strong>Создать аккаунт</strong>')+'</button></div></div><small class="nv94-local">LOCAL FIRST <span>·</span> Аккаунт хранится на этом устройстве.<br>Email с паролем не подтверждается сервером.</small></section>';mountGoogle()}
document.addEventListener("click",e=>{const t=e.target.closest("[data-auth-password]");if(!t)return;const p=$("#nv94-password");if(!p)return;const show=p.type==="password";p.type=show?"text":"password";t.setAttribute("aria-label",show?"Скрыть пароль":"Показать пароль");t.setAttribute("aria-pressed",String(show));t.innerHTML=authIcon(show?"eyeOff":"eye")});
document.addEventListener("click",e=>{const t=e.target.closest("[data-auth-toggle]");if(t)loginScreen(t.dataset.authToggle==="true");if(e.target.closest("[data-auth-logout]")){sessionStorage.removeItem(SESSION_KEY);location.reload()}});

document.addEventListener("submit",async e=>{if(e.target.id!=="nv90-auth-form")return;e.preventDefault();const form=e.target,p=Object.fromEntries(new FormData(form)),email=String(p.email||"").trim().toLowerCase(),btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{let a=accounts().find(x=>x.email===email);if(form.dataset.register==="true"){if(a)throw Error("Email уже зарегистрирован");if(!String(p.nickname||"").trim())throw Error("Укажите никнейм");if(String(p.password||"").length<8)throw Error("Пароль должен содержать минимум 8 символов");const salt=crypto.randomUUID(),hash=await passwordHash(p.password,salt);a=createPersonalAccount({email,nickname:p.nickname,salt,hash})}else{if(!a||a.provider==="google"||!a.hash||await passwordHash(p.password,a.salt)!==a.hash)throw Error("Неверный email или пароль")}enterAccount(a)}catch(err){$("#nv90-auth-error").textContent=err.message;btn.disabled=false}});
let lab=sessionStorage.getItem(BASE+"_mode")==="lab";
let KEY=activeWorkspace().id==="solan-plus"?(lab?BASE+"_lab":BASE):BASE+"_company_"+activeWorkspace().id+(lab?"_lab":"");
const  $=s=>document.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial=()=>({version:1,cases:[{id:"demo-1",title:"PV Dachmontage · Demo",city:"Stockach",price:12500},{id:"demo-2",title:"Solarprojekt · Demo",city:"Singen",price:8300},{id:"demo-3",title:"Anmeldung · Demo",city:"Überlingen",price:3900},{id:"demo-4",title:"PV Anlage · Demo",city:"Konstanz",price:6400}],shards:[{id:"sample-dc",title:"Монтаж DC · Demo",kind:"DC",caseId:"demo-1",price:800,assignee:"member-0",status:"draft"},{id:"sample-ac",title:"Подключение AC · Demo",kind:"AC",caseId:"demo-2",price:1400,assignee:null,status:"draft"},{id:"sample-plan",title:"Проектирование · Demo",kind:"Projektierung",caseId:"demo-4",price:640,assignee:null,status:"draft"}],garage:[{id:"rail",title:"Einlegeschiene 5,90 м",qty:24,art:"rail"},{id:"clamp",title:"Mittelklemme 1,8 см",qty:48,art:"clamp"},{id:"module",title:"PV-модуль",qty:18,art:"module"},{id:"vertical",title:"CN37 · вертикаль",qty:36,art:"vertical"},{id:"van",title:"Sprinter 313 · Demo",qty:1,art:"van"},{id:"car",title:"Seat Leon · Demo",qty:1,art:"car"},{id:"trailer",title:"Anhänger · Demo",qty:1,art:"trailer"}],crew:[{name:"Demo Monteur",role:"Monteur"}],tasks:[]});
const {roles,migrate,validate,apply}=NVModel;
const actor=()=>state.crew.find(c=>c.id===(account()?.actorId||state.actor));
const lead=()=>actor().role===roles[0], warehouse=()=>lead()||actor().role===roles[2];
let state, raw, history=[], damaged=false;
function readStore(){
  raw=localStorage.getItem(KEY);
  const record=raw?JSON.parse(raw):initial();
  state=validate(migrate(record.format===1?record.data:record));
  history=record.format===1?record.history.map(item=>validate(migrate(item))):[];
  if(account()&&state.crew.some(c=>c.id===account().actorId))state={...state,actor:account().actorId};
  damaged=false;
}
try{ensureWorkspace(activeWorkspace().id);readStore()}catch{damaged=true;state=validate(migrate(initial()));history=[]}
async function change(operation,undo=false,recovery=false){
  const write=()=>{
    if(damaged&&!recovery)throw Error("Повреждённые данные. Откройте настройки для восстановления.");
    if(localStorage.getItem(KEY)!==raw)throw Error("Данные изменились в другой вкладке. Обновите страницу.");
    const next=validate({...operation(),actor:account()?.actorId||state.actor}), past=undo?history.slice(0,-1):[...history,state].slice(-10);
    const record=JSON.stringify({format:1,data:next,history:past});
    if(damaged&&raw!==null)localStorage.setItem(KEY+"_damaged",raw);
    localStorage.setItem(KEY,record);raw=record;state=next;history=past;damaged=false;render();
  };
  try{if(navigator.locks)await navigator.locks.request(KEY,write);else write();return true}
  catch(error){alert(error.message);return false}
}
const money=n=>Number(n||0).toLocaleString("de-DE",{maximumFractionDigits:2});
const shardCount=n=>n+" Shard"+(n===1?"":"s");
const pct=id=>{const s=state.shards.filter(x=>x.caseId===id);return s.length?Math.round(100*s.filter(x=>x.status==="accepted").length/s.length):0};
const button=(label,action,id)=>'<button data-action="'+action+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+label+'</button>';
const panel=(title,route,body)=>'<section class="panel"><div class="panelhead"><h2>'+title+'</h2><button data-route="'+route+'">Открыть →</button></div>'+body+'</section>';
const stat=(symbol,label,value,detail)=>'<div class="stat"><span class="symbol">'+symbol+'</span><div><strong>'+esc(value)+'</strong><label>'+label+'</label><small>'+detail+'</small></div></div>';
const row=c=>'<button class="case" data-route="case/'+esc(c.id)+'"><span class="thumb"><img src="art/roof.webp" alt="" loading="lazy"></span><span class="casebody"><strong>'+esc(c.title)+'</strong><small>⌖ '+esc(c.city)+'</small><span class="progress"><i style="width:'+pct(c.id)+'%"></i></span></span><span class="casemeta"><b>'+pct(c.id)+'%</b><small>'+money(c.price)+' €</small></span></button>';
const shard=s=>'<button class="shard" data-route="case/'+esc(s.caseId)+'"><span class="ring" style="--p:'+(s.status==="accepted"?100:0)+'%"><b>'+(s.status==="accepted"?"100%":"0%")+'</b></span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(statusName[s.status])+'</small></span><b>›</b></button>';
const iconPaths={
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
const demoCaseLocations={Stockach:[47.851,9.012],Singen:[47.760,8.841],"Überlingen":[47.769,9.171],Konstanz:[47.660,9.175]};
function caseMiniMap(){
  // Schematic Bodensee region; project pins use grounded demo city coordinates.
  // Unknown real-world addresses are never silently geocoded.
  const bounds={west:8.68,east:9.37,south:47.52,north:47.98};
  const placed=state.cases.map(c=>({c,coord:c.id.startsWith("demo-")?demoCaseLocations[c.city]:null})).filter(x=>x.coord);
  const pins=placed.map(({c,coord})=>{
    const x=100*(coord[1]-bounds.west)/(bounds.east-bounds.west);
    const y=100*(bounds.north-coord[0])/(bounds.north-bounds.south);
    return '<button class="mapcasepin" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" data-route="case/'+esc(c.id)+'" title="'+esc(c.title+' · '+c.city)+'" aria-label="Open Project '+esc(c.title)+'"><span></span></button>';
  }).join("");
  const schematic=[
    '<div class="casemap-schematic" role="img" aria-label="Схематическая карта Боденского озера: Stockach, Singen, Überlingen, Konstanz">',
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">',
    '<defs><linearGradient id="lake-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#205a77"/><stop offset="1" stop-color="#157b93"/></linearGradient>',
    '<linearGradient id="map-ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2b5260"/><stop offset="1" stop-color="#183a4d"/></linearGradient></defs>',
    '<rect width="100" height="100" fill="url(#map-ground)"/>',
    '<g stroke="#5b8a89" stroke-width=".35" opacity=".31" fill="none">',
    '<path d="M-6 14 Q25 8 44 17 T109 13"/><path d="M-10 35 Q25 26 51 35 T108 27"/><path d="M-9 55 Q22 46 47 56 T109 49"/><path d="M-7 82 Q22 75 41 86 T105 78"/>',
    '<path d="M10 -8 Q2 32 14 61 T12 112"/><path d="M41 -8 Q30 24 39 57 T30 109"/><path d="M76 -8 Q69 23 78 56 T69 112"/></g>',
    '<g stroke="#9baaa3" stroke-width=".86" stroke-linecap="round" opacity=".51" fill="none">',
    '<path d="M-5 32 C15 26 22 43 34 38 S55 28 71 44 S91 35 106 42"/>',
    '<path d="M2 63 C21 48 29 50 47 33 S71 26 103 19"/>',
    '<path d="M12 101 Q23 76 43 68 T72 70 Q87 84 112 68"/>',
    '<path d="M39 -5 Q50 20 46 32 T71 72"/></g>',
    '<path d="M61 41 C68 40 70 43 76 43 C83 42 86 45 103 43 L105 73 C93 77 86 69 80 64 C74 60 68 60 64 64 C62 61 58 56 58 50 Z" fill="url(#lake-gradient)" stroke="#75bbc7" stroke-width=".48"/>',
    '<path d="M67 64 C59 64 56 72 50 71 C43 68 39 75 38 82 C47 83 52 79 56 78 C61 78 67 77 72 72 Z" fill="#246f86" stroke="#75bbc7" stroke-width=".4"/>',

    '<g transform="translate(6 8)" stroke="#c9eaed" fill="none" stroke-width=".6"><path d="M0 7 L0 0 M-2.3 4 L0 0 L2.3 4"/></g>',
    '</svg><div class="casemap-places" aria-hidden="true"><span class="place-stockach">Stockach</span><span class="place-singen">Singen</span><span class="place-ueberlingen">Überlingen</span><span class="place-konstanz">Konstanz</span><span class="place-bodensee">Bodensee</span><span class="place-north">N</span></div></div>'
  ].join("");
  return '<section class="panel casemap"><div class="panelhead"><h2>На карте</h2><small>'+placed.length+' с отметками · '+state.cases.length+' всего</small></div><div class="casemapviewport">'+schematic+'<div class="casemappins">'+pins+'</div><span class="casemapcredit">СХЕМА РЕГИОНА</span></div><div class="casemaplegend"><span><i></i> Демо-объекты</span><button data-route="projects">Все →</button></div><p class="casemapnote">Карта схематическая. Отмечены только объекты с известными координатами.</p></section>';
}
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
 const metrics=[["Projects",state.cases.length,"projects","layers"],["Shards",state.shards.length,"tasks","box"],["Участники",state.crew.length,"team","team"],["Garage",state.garage.length,"garage","van"],["Field Mode",active.length,"field","field"],["Приёмка",review.length,"tasks","check"],["Merit",money(total),"pulse","coins"]];
 const cases=state.cases.slice(0,3).map((c,i)=>'<button class="command-case-row" data-route="case/'+esc(c.id)+'"><img class="command-case-photo" src="art/'+(["roof","tile0","tile1"][i]||"roof")+'.webp" alt="" loading="lazy"><span class="command-case-id">P-'+esc(String(i+1).padStart(3,"0"))+'</span><span class="command-case-name">'+esc(c.title)+'</span><span class="command-progress"><i style="width:'+pct(c.id)+'%"></i></span><b>'+pct(c.id)+'%</b></button>').join("")||'<p class="command-empty">Создайте первый Project</p>';
 const resources=[["Оборудование",materials.reduce((n,x)=>n+Number(x.qty||0),0)+" ед."],["Позиций на складе",materials.length],["Транспорт",fleet.length+" ед."],["Принято Shards",accepted]].map(([name,value])=>'<div class="command-info-row"><span>⌁</span><span>'+esc(name)+'</span><b>'+esc(value)+'</b></div>').join("");
 const team=[["Участники",state.crew.length],["Назначено Shards",state.shards.filter(s=>s.assignee).length],["На приёмке",review.length],["Свободно Shards",state.shards.filter(s=>!s.assignee).length]].map(([name,value],i)=>'<div class="command-info-row"><span class="command-dot dot-'+i+'">●</span><span>'+esc(name)+'</span><b>'+value+'</b></div>').join("");
 const ownNext=state.shards.find(s=>s.assignee===state.actor&&s.status==="draft");
 const nextShard=(lead()&&review[0])||ownNext||active[0];
 const nextCase=nextShard&&state.cases.find(c=>c.id===nextShard.caseId);
 const nextAction=nextShard
  ?'<section class="command-mission" aria-label="Следующий шаг"><img src="art/roof.webp" alt="" loading="lazy"><div class="command-mission-copy"><small>СЛЕДУЮЩИЙ ШАГ · '+esc(nextShard.status==="submitted"?"НА ПРИЁМКЕ":"В РАБОТЕ")+'</small><strong>'+esc(nextShard.title)+'</strong><span>'+esc(nextCase?.title||"Project")+' · '+esc(nextCase?.city||"")+'</span></div><button data-route="case/'+esc(nextShard.caseId)+'">Продолжить '+icon("layers")+'</button></section>'
  :'<section class="command-mission" aria-label="Следующий шаг"><img src="art/roof.webp" alt="" loading="lazy"><div class="command-mission-copy"><small>НАЧАЛО РАБОТЫ</small><strong>Создайте первый Project</strong><span>Новый объект, команда и рабочие этапы</span></div><button data-route="projects">Projects '+icon("layers")+'</button></section>';
 const dock=[["Projects","Объекты","projects","layers"],["Shards","Рабочие блоки","tasks","box"],["Garage","Техника и склад","garage","van"],["Сообщество","Люди, профили и достижения","team","team"],["Field Mode","Полевые работы","field","field"]];
 return '<div class="command-center"><header class="command-top"><div class="command-brand"><img class="command-brand-logo" src="art/nvtsk-approved.webp" alt="NVTSK" width="56" height="56"><span class="nvtsk-brand-caption"><strong>NVTSK SYSTEM</strong><small>ПЛАТФОРМА УПРАВЛЕНИЯ</small></span>'+workspaceBadge()+'</div><div class="command-status"><span>● Локальный режим</span><span>▤ Данные на устройстве</span><span>↻ Синхронизация: выкл.</span></div><div class="command-topbuttons"><button data-route="social" aria-label="Уведомления">♧</button><button data-route="projects" aria-label="Открыть Projects">⌕</button><button data-route="settings" aria-label="Настройки">⚙</button></div></header><section class="command-stage"><div class="command-stage-head"><div class="command-home-hero"><div class="command-home-actions" aria-label="Основные действия"><button class="command-home-action is-create" data-action="new-case"><span class="command-home-action-icon">'+icon("box")+'</span><span>+ Project</span></button></div><div class="command-home-map">'+caseMiniMap()+'</div></div><div class="command-stage-meta"><div class="command-health"><small>PV · ГОТОВНОСТЬ</small><strong>'+completion+'%</strong><span>'+state.cases.length+' объектов · '+accepted+' принято</span><svg class="command-trend" viewBox="0 0 200 36" aria-hidden="true"><path d="M0 29Q28 34 52 22T100 19T154 8T200 3"/></svg></div><div class="command-clock"><strong>'+new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"})+'</strong><span>'+state.moves.length+' движений · Local First</span></div></div></div><div class="command-metrics">'+metrics.map(([label,value,route,glyph])=>'<button data-route="'+route+'" class="command-metric"><span class="command-metric-glyph">'+icon(glyph)+'</span><span>'+label+'</span><strong>'+esc(value)+'</strong></button>').join("")+'</div><div class="command-globe-scene" aria-hidden="true"><div class="command-globe"><span>N</span></div><div class="command-globe-base"></div></div>'+myProjects()+nextAction+'<div class="command-panels"><section class="command-panel command-panel-resources"><h2>'+icon("van")+' Ресурсы и техника <button data-route="garage" aria-label="Открыть Garage">›</button></h2><img class="command-panel-banner" src="art/store.webp" alt="" loading="lazy">'+resources+'</section><section class="command-panel command-panel-team"><h2>'+icon("team")+' Сообщество <button data-route="team" aria-label="Открыть сообщество">›</button></h2><img class="command-panel-banner" src="art/hero.webp" alt="" loading="lazy">'+team+'</section></div></section><nav class="command-dock" aria-label="Основные разделы">'+dock.map(([name,subtitle,route,glyph],i)=>'<button class="'+(i===0?"is-primary":"")+'" data-route="'+route+'"><span>'+icon(glyph)+'</span><strong>'+name+'</strong><small>'+subtitle+'</small></button>').join("")+'</nav></div>';
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
 const ownShard=shards.some(sh=>sh.assignee===state.actor);
 const ownTask=tasks.some(t=>t.assignee===state.actor);
 const ownStock=state.moves.some(m=>m.actor===state.actor&&ids.has(m.shardId));
 const ownTeam=shards.some(sh=>state.teams.some(t=>t.id===sh.teamId&&t.memberIds.includes(state.actor)));
 const participation=[...(ownShard?["Shard"]:[]),...(ownTask?["Task"]:[]),...(ownTeam?["Team"]:[]),...(ownStock?["Склад"]:[])];
 const status=shards.some(sh=>sh.status==="submitted")?"review":shards.some(sh=>sh.status==="draft")?"active":shards.length?"accepted":"planning";
 return {c,shards,tasks,participation,joined:participation.length>0,managed:lead(),status,percent:pct(c.id)};
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
function projects(){
 const all=[...state.cases,...incomingCases().filter(c=>!state.cases.some(x=>x.id===c.id))].map(projectHubMembership);
 const own=lead()?all:all.filter(x=>x.joined||sharedCaseReadOnly(x.c.id));
 const list=own.slice().sort((a,b)=>(projectHubStatusOrder[a.status]??9)-(projectHubStatusOrder[b.status]??9));
 const current=list.find(x=>x.c.id===projectHubSelectedCase)||list[0];
 const mediaFor=c=>(c.files||[]).filter(f=>f.data&&f.data.startsWith("data:image/"));
 const photo=c=>mediaFor(c)[0]?.data||"art/roof.webp";
 const status=x=>projectHubStatusLabel[x.status]||"Планирование";
 const originLabel=c=>c.origin?'<small class="cp78-origin">Получено от '+esc(c.origin.workspaceName)+'</small>':"";
 const cards=list.map(x=>'<button class="sc75-project'+(current&&current.c.id===x.c.id?' is-current':'')+'" data-action="project-select" data-id="'+esc(x.c.id)+'" data-hubsearch="'+esc(projectHubMeta(x).search)+'"><img src="'+photo(x.c)+'" alt=""><span class="sc75-card-info"><strong>'+esc(x.c.title)+'</strong>'+originLabel(x.c)+'<small>'+esc(x.c.city||x.c.address||"Объект")+'</small><span>'+x.shards.length+' Shards · '+x.tasks.length+' Tasks</span><span class="sc75-track"><i style="width:'+x.percent+'%"></i></span></span><span class="sc75-card-end"><em>'+status(x)+'</em><b>'+x.percent+'%</b></span></button>').join("");
 let pane='<section class="sc75-empty">Выберите Case, чтобы открыть паспорт, медиа и задачи.</section>';
 if(current){
  const x=current,c=x.c,p=c.pvPlan||{},images=mediaFor(c);
  const facts=[["Мощность",p.declaredKwp?esc(String(p.declaredKwp))+" kWp":"—"],["Модули",p.declaredModules?esc(String(p.declaredModules))+" шт.":"—"],["Инвертор",esc(p.inverter||p.inverterType||"—")],["Крыша",esc(p.roofType||"—")],["Крепление",esc(p.mounting||"—")],["Уклон",p.slopeDeg!=null&&p.slopeDeg!==""?esc(String(p.slopeDeg))+"°":"—"]];
  const files=(c.files||[]).slice(0,6).map(f=>'<a class="sc75-file" href="'+f.data+'" download="'+esc(f.name)+'">'+(f.data.startsWith("data:image/")?'<img src="'+f.data+'" alt="'+esc(f.name)+'">':'<span>PDF</span>')+'</a>').join("");
  const stages=[["Подготовка",x.shards.length>0],["Монтаж",x.percent>0],["AC",x.shards.some(sh=>sh.kind==="AC"&&sh.status==="accepted")],["Приёмка",x.status==="review"||x.status==="accepted"],["Закрытие",x.status==="accepted"]];
  pane='<section class="sc75-detail"><div class="sc75-detail-head"><div><h2>'+esc(c.title)+'</h2><p>'+esc([c.address,c.city].filter(Boolean).join(" · "))+'</p></div><span class="sc75-status">'+status(x)+'</span></div>'+
   '<div class="sc75-case-top"><div class="sc75-cover"><img src="'+photo(c)+'" alt="Фото объекта"></div><div class="sc75-passport"><div class="sc75-section-head"><h3>Паспорт объекта</h3><button data-route="case/'+esc(c.id)+'">Открыть Case ↗</button></div><div class="sc75-facts">'+facts.map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join("")+'</div></div></div>'+
   '<div class="sc75-actions"><button data-route="case/'+esc(c.id)+'">Обзор и Shards</button><button data-route="case/'+esc(c.id)+'">Задачи</button><button data-route="case/'+esc(c.id)+'">Документы</button><button data-route="case/'+esc(c.id)+'">Команда</button></div>'+
   '<div class="sc75-progress"><div><strong>Прогресс проекта</strong><b>'+x.percent+'%</b></div><span class="sc75-track"><i style="width:'+x.percent+'%"></i></span><div class="sc75-stages">'+stages.map(([label,done])=>'<span class="'+(done?'done':'')+'">'+(done?'●':'○')+' '+label+'</span>').join("")+'</div></div>'+
   '<div class="sc75-media"><div class="sc75-section-head"><h3>Медиа объекта <small>('+(c.files||[]).length+')</small></h3>'+(lead()?'<button data-action="case-media" data-id="'+esc(c.id)+'">＋ Фото / PDF</button>':'')+'</div><div class="sc75-media-items">'+(files||'<p>Пока нет медиа. Добавьте фото крыши, монтажных работ или проектные PDF.</p>')+'</div></div>'+
   '<div class="sc75-footer"><button data-route="case/'+esc(c.id)+'">Открыть полный паспорт и работы →</button></div></section>';
 }
 return '<div class="sc75-shell"><header class="sc75-header"><div><h1>Проекты</h1><p>Объекты, Case и задачи рабочего пространства</p></div>'+(lead()?'<button data-action="new-case">＋ Новый Case</button>':'')+'</header><div class="sc75-layout"><aside class="sc75-list"><label class="sc75-search">⌕ <input id="project-hub-search" type="search" placeholder="Название, адрес, клиент…" aria-label="Поиск проектов" value="'+esc(projectHubQuery)+'"></label><div class="sc75-cards">'+(cards||'<p>Проектов пока нет</p>')+'</div><p id="ph-no-match" hidden>Нет совпадений</p></aside>'+pane+'</div></div>';
}
const statusName={draft:"В работе",submitted:"На проверке",accepted:"Принято"};
const taskStatusName={todo:"К выполнению",doing:"В работе",done:"Готово"};
const tasksForShard=id=>state.tasks.filter(t=>t.shardId===id);
const taskProgress=id=>{const work=tasksForShard(id);return work.length?Math.round(work.filter(t=>t.status==="done").length/work.length*100):0};
const mayEditTask=(t,sh)=>sh.status==="draft"&&(lead()||t.assignee===state.actor||(t.assignee===null&&sh.assignee===state.actor));
function taskRows(sh){
 const list=tasksForShard(sh.id);
 const out=list.map(t=>{
  const who=t.assignee||sh.assignee;
  const action=mayEditTask(t,sh)?'<button class="task-status-btn" data-action="task-next" data-id="'+esc(t.id)+'">'+(t.status==="todo"?"Начать":t.status==="doing"?"Завершить":"Вернуть в работу")+'</button>':"";
  return '<div class="shard-task-row '+(t.status==="done"?"is-done":"")+'"><span class="task-state">'+(t.status==="done"?"✓":t.status==="doing"?"◉":"○")+'</span><div><strong>'+esc(t.title)+'</strong><small>'+esc(taskStatusName[t.status])+' · '+esc(member(who))+'</small>'+(t.notes?'<p>'+esc(t.notes)+'</p>':"")+'</div>'+action+'</div>';
 }).join("");
 return '<div class="shard-task-list"><div class="shard-task-title"><strong>Tasks · '+list.filter(t=>t.status==="done").length+' / '+list.length+'</strong><span>Готово '+taskProgress(sh.id)+'%</span></div>'+(out||'<p class="hint">Tasks ещё не добавлены.</p>')+(sh.status==="draft"&&(lead()||sh.assignee===state.actor)?button("＋ Task","new-task",sh.id):"")+'</div>';
}
const displayMemberName=c=>c?(c.id==="lead"&&c.name==="Координатор"?"Капитан":c.name):"Без назначения";
const displayRole=c=>c.role===roles[0]?"Капитан":c.role;
const member=id=>displayMemberName(state.crew.find(c=>c.id===id));
const options=(items,value)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join("");
const teamOptions=()=>state.crew.map(c=>[c.id,displayMemberName(c)+" · "+displayRole(c)]);
function shardRow(s){
  let actions="";
  if(s.status==="draft" && lead())actions+=button("Назначить","assign",s.id)+(state.teams.length?button("Назначить Team","assign-team",s.id):"");
  if(s.status==="draft" && state.actor===s.assignee)actions+=button("На проверку","submit",s.id);
  if(s.status==="submitted" && lead() && state.actor!==s.assignee)actions+=button("Принять","accept",s.id)+button("На доработку","revise",s.id);
  return '<article class="taskrow shard-work-card"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.kind)+' · '+esc(member(s.assignee))+' · '+statusName[s.status]+(s.teamId?' · Team: '+esc(state.teams.find(t=>t.id===s.teamId)?.name||''):'')+'</small><p>'+esc(s.notes||'')+'</p><div>'+fileLinks(s.files)+'</div></div><div><button data-route="shard/'+esc(s.id)+'">Открыть Shard →</button>'+actions+'</div>'+taskRows(s)+'</article>';
}
function shardDetail(id){
 const sh=state.shards.find(x=>x.id===id);
 if(!sh)return heading("Shard не найден");
 const project=state.cases.find(c=>c.id===sh.caseId);
 return '<button class="back" data-route="case/'+esc(project.id)+'">← '+esc(project.title)+'</button><section class="panel shard-workspace"><div class="shard-workspace-heading"><div><small>PROJECT / SHARD / TASKS</small><h1>'+esc(sh.title)+'</h1><p>'+esc(project.title)+' · '+esc(sh.kind)+' · '+esc(member(sh.assignee))+'</p><span class="fieldstatus">'+esc(statusName[sh.status])+'</span></div><img src="art/roof.webp" alt="PV-монтаж" loading="lazy"></div><p>'+esc(sh.notes||"")+'</p><div class="shard-work-progress"><span>Выполнено '+taskProgress(sh.id)+'%</span><div class="progress"><i style="width:'+taskProgress(sh.id)+'%"></i></div></div>'+taskRows(sh)+'<div class="shard-work-actions">'+(sh.status==="draft"&&sh.assignee===state.actor?button("Передать на приёмку","submit",sh.id):"")+(sh.status==="submitted"&&lead()&&state.actor!==sh.assignee?button("Принять Shard","accept",sh.id)+button("На доработку","revise",sh.id):"")+'</div></section>';
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
  return '<div class="taskrow"><div><strong>'+esc(kind)+' · '+esc(item?.title||"Материал")+' · '+esc(m.qty)+'</strong><small>'+esc(shard?.title||"Shard")+' · '+esc(operator?.name||"Участник")+'</small></div></div>';
 }).join("");
}
function caseTeam(id){
 const linked=state.shards.filter(s=>s.caseId===id);
 const ids=new Set(linked.map(s=>s.assignee).filter(Boolean));
 const rows=state.crew.filter(c=>ids.has(c.id)||c.role===roles[0]).map(c=>{
 const assigned=linked.filter(s=>s.assignee===c.id);
 return '<article class="taskrow"><div><strong>'+esc(displayMemberName(c))+'</strong><small>'+esc(displayRole(c))+' · '+(assigned.length?assigned.map(x=>esc(x.title)).join(", "):"Управление объектом")+'</small></div><div>'+(lead()?'<button data-route="team">Участники →</button>':'')+'</div></article>';
 }).join("");
 const unassigned=linked.filter(s=>!s.assignee);
 return '<section class="panel"><div class="panelhead"><h2>Команда объекта</h2>'+(lead()?'<button data-route="team">Управление участниками →</button>':'')+'</div>'+(rows||'<p>Участники пока не назначены</p>')+(unassigned.length?'<p class="hint">Без исполнителя: '+unassigned.map(x=>esc(x.title)).join(", ")+'</p>':'')+'<p class="hint">Приглашения между устройствами пока недоступны. Назначения сохраняются локально; доступ не синхронизируется.</p></section>';
}
function detail(id){
  const c=state.cases.find(x=>x.id===id)||sharedCase(id);
  if(!c)return heading("Project не найден");
  const shards=state.shards.filter(s=>s.caseId===id);
  const partner=counterpartyForProject(c);
  const partnerInfo='<section class="panel cp-case-link"><div class="panelhead"><h2>Заказчик / Auftraggeber</h2>'+(lead()?button("Связать контрагента","link-counterparty",id):"")+'</div>'+
    (partner?'<button data-route="partner/'+esc(partner.id)+'" class="cp-case-partner"><strong>'+esc(partner.name)+'</strong><span>DC-монтаж · SolAn Plus · AC — электрики заказчика</span><small>Открыть профиль →</small></button>':'<p>Контрагент не назначен. Исторические проекты сохраняются без автоматически установленного заказчика.</p>')+'</section>';
  const mediaItems=(c.files||[]).map(a=>'<a class="case-media-item" href="'+a.data+'" download="'+esc(a.name)+'" target="_blank" rel="noopener noreferrer">'+(a.data.startsWith("data:image/")?'<img src="'+a.data+'" alt="'+esc(a.name)+'">':'<span class="case-media-pdf">PDF</span>')+'<small>'+esc(a.name)+'</small></a>').join("");
  const mediaPanel='<section class="panel case-media-panel"><div class="panelhead"><h2>Медиа объекта · '+(c.files||[]).length+'/8</h2>'+(lead()?'<button data-action="case-media" data-id="'+esc(id)+'">＋ Фото / PDF</button>':'')+'</div><div class="case-media-grid">'+(mediaItems||'<p class="hint">Фото крыши, чертежи, Stringplan и документы объекта.</p>')+'</div></section>';
  return '<button class="back" data-route="projects">← Projects</button><section class="panel casehead"><img src="art/roof.webp" alt=""><div><h1>'+esc(c.title)+'</h1><p>'+esc(c.city)+'</p><p>'+esc(c.address||'')+'</p><p>'+esc(c.notes||'')+'</p><div>'+fileLinks(c.files)+'</div><span class="progress"><i style="width:'+pct(id)+'%"></i></span><small>Готовность '+pct(id)+'%</small></div></section><div class="details">'+stat("▤","Shards",shards.length,"Рабочие блоки")+stat("€","Бюджет",money(c.price),"EUR")+stat("◇","Merit",money(c.price),"Эмиссия Project")+'</div>'+mediaPanel+PVProjectCard.render(c,state,lead())+'<section class="panel"><div class="panelhead"><h2>Shards</h2><button data-route="lager">Lager</button></div>'+shards.map(shardRow).join("")+(lead()?button("＋ Shard","new-shard",id):"")+'</section>'+partnerInfo+caseTeam(id)+'<section class="panel"><h2>Материалы объекта · история</h2>'+caseMaterialHistory(id)+'</section>';
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
function garage(view="material"){
 const moves=state.moves.slice().reverse();
 const stockPhoto=m=>{const t=m.title.toLowerCase();if(m.sku==="2004260"&&/singlerail/.test(t))return warehousePhotos[2];return null};
 const inventory=state.garage.filter(m=>view==="fuhrpark"?["van","car","trailer"].includes(m.art):!["van","car","trailer"].includes(m.art)).map(m=>{const photo=stockPhoto(m),fallback=['rail','clamp','module','vertical','van','car','trailer'].includes(m.art)?'art/'+m.art+'.webp':null;
  return '<article class="panel item stockitem" data-stock="'+esc((m.title+" "+(m.sku||"")+" "+(m.brand||"")).toLowerCase())+'"><div class="stockmedia">'+(photo?'<img loading="lazy" src="'+esc(photo.image)+'" alt="'+esc(photo.name)+'" onerror="this.onerror=null;this.src=\''+(fallback||'art/rail.webp')+'\'">':fallback?'<img loading="lazy" src="'+fallback+'" alt="Схематичная иллюстрация; точный артикул не подтверждён">':'<span class="stocknoimage">Нет фото</span>')+'</div><div class="stockdetails">'+(photo?'<small class="stockbrand">'+esc(photo.brand)+'</small>':'<small class="stockbrand">Артикул / фото не верифицированы</small>')+'<h2>'+esc(m.title)+'</h2>'+(m.sku?'<small>ART. '+esc(m.sku)+'</small>':'<small>Артикул не указан</small>')+'<p>Остаток <strong>'+esc(m.qty)+'</strong> '+esc(m.unit||'шт.')+'</p>'+(photo?'<a class="stocksource" href="'+esc(photo.url)+'" target="_blank" rel="noopener noreferrer">Каталог производителя ↗</a>':'')+shopLinks(m.sku)+'</div>'+(warehouse()?button("Операции","move",m.id):"")+'</article>'}).join("");
 const catalogue=warehousePhotos.map(p=>'<article class="stockcataloguecard"><img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.name)+'"><div><small>'+esc(p.brand)+' · '+esc(p.kind)+'</small><strong>'+esc(p.name)+'</strong><a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">Официальный каталог ↗</a></div></article>').join("");
 const specs=systemReferences.map(r=>'<article class="taskrow"><div><strong>'+esc(r.title)+'</strong><small>'+esc(r.article)+' · '+esc(r.detail)+'</small><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Инструкция / каталог производителя ↗</a></div></article>').join('');
 return '<div class="warehouse">'+heading("Lager //",warehouse()?button("＋ Добавить позицию","new-material"):"")+'<div class="lagertabs"><button data-route="lager" class="'+(view==="material"?"active":"")+'">Material · Склад</button><button data-route="fuhrpark" class="'+(view==="fuhrpark"?"active":"")+'">Fuhrpark · Автопарк</button></div>'+'</div><div class="stocksummary"><span>ПОЗИЦИЙ <b>'+state.garage.length+'</b></span><span>ЕДИНИЦ <b>'+state.garage.reduce((sum,m)=>sum+m.qty,0)+'</b></span><span>ДВИЖЕНИЙ <b>'+state.moves.length+'</b></span></div><div class="columns stock"><section class="panel stockinventory"><div class="panelhead"><h2>Материалы и оборудование</h2><small>'+state.garage.length+' позиций</small></div><label class="stocksearch">Поиск по складу<input id="stock-search" type="search" placeholder="Название, профиль, производитель"></label><div class="cards">'+inventory+'</div></section><section class="panel"><div class="panelhead"><h2>История движений</h2></div>'+moves.map(m=>'<div class="taskrow"><div>'+esc(state.garage.find(i=>i.id===m.itemId)?.title||"Удалённая позиция")+' · '+esc(m.qty)+'<small>'+({issue:"Выдача",return:"Возврат",receive:"Приход",writeoff:"Списание"})[m.type]+' · '+esc(state.shards.find(s=>s.id===m.shardId)?.title||"Склад")+(m.type==="issue"||m.type==="return"?" · "+(m.recipientId?"Получатель: "+esc(state.crew.find(c=>c.id===m.recipientId)?.name||"Удалённый участник"):"Получатель не указан (старая запись)"):"")+'</small></div></div>').join("")+(!moves.length?"<p>Движений пока нет</p>":"")+'</section></div><section class="panel stockreferences"><div class="panelhead"><h2>Каталог производителей</h2><small>novotegra: фото производителя · K2: иллюстрация</small></div><p class="stockhint">Изображения novotegra требуют проверки соответствия конкретному артикулу; K2 SingleRail показан локальной иллюстрацией до проверки точного фото. Каталог не отражает остатки.</p><div class="stockcatalogue">'+catalogue+'</div><h2>Проверенные технические источники</h2><p class="stockhint">Не заменяет проектную статику, монтажную инструкцию и подбор крепежа под крышу. Не смешивать системы разных производителей без подтверждения совместимости.</p>'+specs+'</section>';
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

function teamsWorkspace(){
 const list=state.teams.map(t=>{
  const memberCards=t.memberIds.map(id=>{const c=state.crew.find(x=>x.id===id);return c?'<button data-route="member/'+esc(c.id)+'" class="company-team-member">'+memberAvatar(c)+'<span><strong>'+esc(displayMemberName(c))+'</strong><small>'+(id===t.captainId?"Капитан Team":esc(c.headline||displayRole(c)))+'</small></span></button>':""}).join("");
  const linked=state.shards.filter(sh=>sh.teamId===t.id);
  const projectCount=new Set(linked.map(sh=>sh.caseId)).size;
  return '<article class="company-team-card"><div class="company-team-heading"><div><small>NVTSK · TEAM</small><h3>'+esc(t.name)+'</h3><p>'+esc(t.description||"Рабочая бригада компании")+'</p></div>'+(lead()?button("Настроить","team-edit",t.id):"")+'</div>'+
   '<div class="company-team-facts"><span>'+t.memberIds.length+' участников</span><span>'+linked.length+' Shards</span><span>'+projectCount+' Projects</span></div>'+
   '<div class="company-team-members">'+memberCards+'</div>'+
   (linked.length?'<div class="company-team-work"><h4>Назначенные Shards</h4>'+linked.map(sh=>'<button data-route="shard/'+esc(sh.id)+'">'+esc(sh.title)+' <span>'+esc(statusName[sh.status])+' ›</span></button>').join("")+'</div>':"")+'</article>';
 }).join("");
 return '<section class="community-section company-teams"><div class="community-section-head"><div><h2>Teams SolAn Plus GmbH</h2><small>Сформируйте бригады, назначьте капитанов и участников</small></div>'+(lead()?button("＋ Team","new-team"):"")+'</div>'+
 '<p class="community-muted">Teams — внутренние рабочие бригады. Капитан компании может назначить Team на Shard; капитан Team отвечает за передачу выполненных работ на приёмку.</p><button class="company-team-owner-link" data-route="member/lead">Профиль капитана SolAn Plus GmbH →</button>'+
 '<div class="company-teams-list">'+(list||'<div class="company-teams-empty"><strong>Пока нет сформированных Teams</strong><p>Создайте первую бригаду, выберите капитана и участников.</p>'+(lead()?button("＋ Создать Team","new-team"):"")+'</div>')+'</div>'+
 '<p class="community-disclaimer">Данные Teams хранятся локально. Общее управление бригадами с разных телефонов требует авторизации и синхронизации.</p></section>';
}
function communityTabs(active){
  const tabs=[["people","Люди","team"],["teams","Teams","team/teams"],["feed","Лента","team/feed"],["achievements","Награды","team/achievements"]];
  return '<nav class="community-tabs" aria-label="Разделы сообщества">'+tabs.map(([id,label,route])=>'<button class="'+(active===id?"is-active":"")+'" data-route="'+route+'">'+esc(label)+'</button>').join("")+'</nav>';
}
function communityShell(active,body){
  const c=actor(),stats=communityStats(c);
  return '<div class="community">'+
    '<section class="community-hero"><img src="art/hero.webp" alt="Фотография солнечных панелей" loading="eager"><div class="community-hero-inner"><span class="community-kicker">SOLAN PLUS · PEOPLE & TEAMS</span><h1>Сообщество</h1><p>Люди, опыт, результаты и достижения.</p><div class="community-hero-stats"><span><b>'+state.crew.length+'</b> участников</span><span><b>'+state.shards.filter(sh=>sh.status==="accepted").length+'</b> принятых Shards</span><span><b>'+state.tasks.filter(t=>t.status==="done").length+'</b> выполнено Tasks</span></div></div></section>'+
    companyMainCaptain()+'<div class="community-identity">'+memberAvatar(c)+'<div class="community-identity-copy"><small>Ваш профиль · LOCAL FIRST</small><strong>'+esc(displayMemberName(c))+'</strong><span>'+esc(stats.level)+' · '+stats.xp+' XP</span></div><button data-route="member/'+esc(c.id)+'">Мой профиль</button>'+(lead()?button("＋ Участник","new-crew"):"")+'</div>'+
    '<div class="community-profile-switch">'+profile()+'</div>'+
    communityTabs(active)+body+
    '<p class="community-disclaimer">Пилот социальной системы: профили, публикации и достижения хранятся локально на этом устройстве. Это не общая сеть между телефонами; XP не является Merit и не влияет на оплату.</p></div>';
}
function team(){
  const route=location.hash.slice(1),view=route==="team/feed"?"feed":route==="team/teams"?"teams":route==="team/achievements"?"achievements":"people";
  if(view==="teams")return communityShell(view,teamsWorkspace());
  if(view==="feed")return communityShell(view,social());
  if(view==="achievements"){
    const members=state.crew.map(c=>({c,stats:communityStats(c)})).sort((a,b)=>b.stats.xp-a.stats.xp);
    const body='<section class="community-section"><div class="community-section-head"><h2>Путь мастерства</h2><small>Проверяемые результаты работ</small></div><p class="community-muted">XP — отдельная пилотная оценка прогресса. 60 XP за принятый Shard и 15 XP за выполненную Task внутри принятого Shard. Финансовые Merit не затрагиваются.</p><div class="community-levels"><span>Новичок</span><span>Практик</span><span>Специалист</span><span>Эксперт</span></div><div class="community-rank-list">'+members.map((entry,i)=>'<button data-route="member/'+esc(entry.c.id)+'" class="community-rank-row"><b>#'+(i+1)+'</b>'+memberAvatar(entry.c)+'<span><strong>'+esc(displayMemberName(entry.c))+'</strong><small>'+esc(entry.stats.level)+' · '+entry.stats.accepted+' Shards принято</small></span><strong>'+entry.stats.xp+' XP</strong></button>').join("")+'</div></section>';
    return communityShell(view,body);
  }
  const roster=state.crew.map(c=>{
    const st=communityStats(c),skills=(c.skills||[]).slice(0,3);
    return '<button class="community-person" data-route="member/'+esc(c.id)+'" data-membersearch="'+esc((displayMemberName(c)+" "+displayRole(c)+" "+skills.join(" ")+" "+(c.location||"")).toLowerCase())+'"><span class="community-person-cover"></span><span class="community-person-main">'+memberAvatar(c,true)+'<span class="community-person-info"><strong>'+esc(displayMemberName(c))+'</strong><small>'+esc(c.headline||displayRole(c))+'</small><small>'+esc(c.location||"NVTSK Crew")+'</small></span></span><span class="community-person-skills">'+(skills.length?skills.map(k=>'<em>'+esc(k)+'</em>').join(""):'<em>'+esc(displayRole(c))+'</em>')+'</span><span class="community-person-footer"><span><b>'+st.accepted+'</b> Shards принято</span><span><b>'+st.done+'</b> Tasks</span><span class="community-person-level">'+esc(st.level)+'</span></span></button>';
  }).join("");
  const posts=socialData().posts.slice(-3).reverse();
  const preview=posts.map(p=>{const c=state.crew.find(x=>x.id===p.author);return '<div class="community-update">'+memberAvatar(c||{name:"?"})+'<div><strong>'+esc(c?displayMemberName(c):"Участник")+'</strong><small>'+esc(new Date(p.created).toLocaleDateString("ru-RU"))+'</small><p>'+esc(p.text)+'</p></div></div>'}).join("")||'<div class="community-empty-feed">Пока нет публикаций. Начните общение с командой.</div>';
  const content='<div class="community-grid"><section class="community-section"><div class="community-section-head"><div><h2>Участники</h2><small>Профили и специализации</small></div><span>'+state.crew.length+' человек</span></div><label class="community-search">Поиск участников<input id="member-search" type="search" placeholder="Имя, специализация, город…" autocomplete="off"></label><div class="community-people">'+roster+'</div></section><aside class="community-aside"><section class="community-section"><div class="community-section-head"><h2>Мой прогресс</h2><button data-route="team/achievements">Подробнее →</button></div><div class="community-progress"><strong>'+communityStats(actor()).xp+' XP</strong><span>'+esc(communityStats(actor()).level)+'</span><div class="community-progress-rail"><i style="width:'+communityStats(actor()).percent+'%"></i></div><small>Следующий уровень · '+communityStats(actor()).next+' XP</small></div><div class="community-badges">'+(communityStats(actor()).badges.map(([iconName,b])=>'<span>'+esc(b)+'</span>').join("")||'<p>Достижения появятся после выполненных и принятых работ.</p>')+'</div></section><section class="community-section"><div class="community-section-head"><h2>Лента сообщества</h2><button data-route="team/feed">Открыть →</button></div>'+preview+'<button class="community-write-link" data-route="team/feed">＋ Новая публикация</button></section></aside></div>';
  return communityShell(view,content);
}

function companyMainCaptain(){
  const manager=state.crew.find(c=>c.id==="lead"&&c.role===roles[0]);
  if(!manager)return "";
  return '<section class="company-captain-entry" aria-label="Главный управляющий профиль">'+
    '<div class="company-captain-overline"><span>SolAn Plus GmbH</span><small>Центр управления</small></div>'+
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
 const membership=allTeams.map(t=>'<button class="company-network-link" data-route="team/teams"><span>TEAM</span><strong>'+esc(t.name)+'</strong><small>'+t.memberIds.length+' участников</small></button>').join("");
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
  '<div class="company-network-people"><div class="company-network-people-header"><small>УЧАСТНИКИ · '+people.length+'</small><button data-route="team">Все профили →</button></div>'+
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
 const projectIds=captain?state.cases.map(p=>p.id):[...new Set(shardList.map(sh=>sh.caseId))];
 const projectLinks=projectIds.map(pid=>{
  const p=state.cases.find(x=>x.id===pid);
  if(!p)return "";
  return '<button data-route="case/'+esc(pid)+'" class="community-profile-project"><img src="art/roof.webp" alt=""><span><strong>'+esc(p.title)+'</strong><small>'+esc(p.city)+' · '+shardCount(state.shards.filter(sh=>sh.caseId===pid).length)+'</small></span><b>›</b></button>';
 }).join("");
 const badges=st.badges.map(([kind,name])=>'<span class="community-earned-badge">'+esc(name)+'</span>').join("")||'<p class="community-muted">Достижения появятся после приёмки Shards и выполненных Tasks.</p>';
 const leadLabel="";
 const captainNote="";
 return '<div class="community community-profile"><button class="back" data-route="team">← Сообщество</button>'+
 '<section class="community-profile-hero"><div class="community-profile-cover"><img src="art/hero.webp" alt="PV-панели" loading="lazy"></div>'+
 '<div class="community-profile-summary">'+memberAvatar(c,true)+
 '<div><small>'+(captain?esc(activeWorkspace().name)+' · COMPANY PROFILE':'NVTSK MEMBER · '+esc(st.level))+'</small><h1>'+esc(displayMemberName(c))+'</h1><p>'+esc(c.headline||displayRole(c))+'</p><span>'+esc(c.location||"Город не указан")+'</span>'+leadLabel+'</div>'+
 (own?button("Редактировать профиль","edit-profile",c.id):"")+'</div></section>'+
 '<div class="community-profile-stats"><div><b>'+projectIds.length+'</b><small>Projects</small></div><div><b>'+st.assigned+'</b><small>Shards</small></div><div><b>'+st.done+'</b><small>Tasks готово</small></div><div><b>'+st.xp+'</b><small>XP</small></div></div>'+
 captainNote+memberContacts(c)+captainRelations(c)+
 '<div class="community-profile-grid"><section class="community-section"><h2>О себе</h2><p class="community-about">'+esc(c.bio||"Описание профиля пока не заполнено.")+'</p>'+
 '<h3>Специализация</h3><div class="community-person-skills">'+((c.skills||[]).map(k=>'<em>'+esc(k)+'</em>').join("")||'<span class="community-muted">Навыки пока не указаны</span>')+'</div>'+
 '<h3>'+(captain?"Projects компании":"Участие в Projects")+'</h3>'+(projectLinks||'<p class="community-muted">Пока нет назначений</p>')+'</section>'+
 '<aside class="community-section"><h2>Путь мастерства</h2><div class="community-progress"><strong>'+st.xp+' XP</strong><span>'+esc(st.level)+'</span><div class="community-progress-rail"><i style="width:'+st.percent+'%"></i></div><small>Следующий порог · '+st.next+' XP</small></div>'+
 '<h3>Достижения</h3><div class="community-badges">'+badges+'</div><small class="community-muted">XP не связан с Merit или выплатами.</small></aside></div>'+
 '<section class="community-section community-profile-activity"><div class="community-section-head"><div><h2>Подтверждённые работы</h2><small>История принятых Shards</small></div></div><div class="community-work-log">'+
 (communityWorkFeed(acceptedWorkEvents(c.id))||'<p class="community-muted">Принятых работ пока нет.</p>')+'</div></section></div>';
}
function profile(){return '<section class="panel"><h2>Мой аккаунт</h2><p>'+esc(account()?.email)+'</p><p>'+esc(actor()?.name)+' · '+esc(actor()?.role)+'</p><button data-auth-logout>Выйти</button></section>'}
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
 '<p class="pulsehint">Merit создаётся только при создании Project. Shard распределяет существующий Merit, не создавая новый.</p>';
}
function settings(){return heading("Настройки")+'<section class="panel workspace-admin"><h2>Рабочее пространство</h2><p>Активное пространство: <strong>'+esc(activeWorkspace().name)+'</strong>. Case, участники и склад хранятся отдельно для каждой компании.</p>'+workspaceBadge()+'<div class="workspace-admin-actions"><button data-route="company">Открыть профиль компании →</button>'+(lead()?'<button data-action="new-crew">＋ Профиль участника</button>':'')+'</div><p class="hint">Участник создаётся внутри активной фирмы и относится только к ней. Приглашения по email требуют подключения сервера.</p></section>'+'<section class="panel company-identity-settings"><div><small>КОМПАНИЯ · ВНУТРЕННЕЕ ПРОСТРАНСТВО</small><strong>'+esc(activeWorkspace().name)+'</strong><p>Проекты, учёт и Teams этой компании · данные пока хранятся локально.</p></div><div><small>РАЗРАБОТЧИК И ПЛАТФОРМА</small><strong>'+esc(APP_BRAND.developer)+'</strong><p>Программное обеспечение NVTSK SYSTEM. Отдельная система учётных записей и синхронизации пока не подключена.</p></div></section>'+profile()+'<div class="panel tools"><button data-route="team">Сообщество и роли</button>'+button(lab?"Вернуться к рабочим данным":"Тестовая копия","sandbox")+button("Экспорт JSON","export")+(lead()?'<label>Импорт JSON<input id="import" type="file" accept=".json,application/json"></label>'+ (history.length?button("Time Machine · отменить последнюю операцию","undo"):""):"")+'</div><p>Профили действуют на этом устройстве. История хранит последние 10 операций.</p>'}

const SOCIAL_KEY=BASE+"_social";
let communityFeedView="all";
function acceptedWorkEvents(memberId=null){
 return state.shards.filter(sh=>sh.status==="accepted"&&sh.assignee&&(memberId===null||sh.assignee===memberId)).slice().reverse().map(sh=>({
  sh,owner:state.crew.find(c=>c.id===sh.assignee),project:state.cases.find(c=>c.id===sh.caseId),
  completed:state.tasks.filter(t=>t.shardId===sh.id&&t.status==="done").length
 }));
}
function communityWorkFeed(events){
 return events.map(({sh,owner,project,completed})=>'<article class="community-work-event" data-workevent="'+esc(sh.id)+'"><div class="community-work-symbol">'+icon("check")+'</div><div class="community-work-copy"><span class="community-work-label">ПОДТВЕРЖДЁННЫЙ РЕЗУЛЬТАТ</span><strong>'+esc(owner?displayMemberName(owner):"Участник")+' · принят Shard</strong><p>'+esc(sh.title)+(completed?' · '+completed+' Tasks':"")+'</p><small>'+esc(project?.city||"")+' · приёмка завершена</small><div class="community-work-links"><button data-route="member/'+esc(sh.assignee)+'">Профиль</button><button data-route="shard/'+esc(sh.id)+'">Открыть Shard →</button></div></div></article>').join("");
}

function socialData(){try{const d=JSON.parse(localStorage.getItem(SOCIAL_KEY)||'{"posts":[]}');return Array.isArray(d.posts)?d:{posts:[]}}catch{return {posts:[]}}}
function social(){
 const d=socialData(),people=Object.fromEntries(state.crew.map(c=>[c.id,displayMemberName(c)]));
 const posts=d.posts.slice().reverse().map(p=>{
 const c=state.cases.find(c=>c.id===p.caseId),likes=p.likes||[],comments=p.comments||[];
 return '<article class="socialpost"><div class="socialauthor"><button class="socialavatar" data-route="member/'+esc(p.author)+'" aria-label="Профиль автора">'+esc((people[p.author]||"?").slice(0,1))+'</button><div><strong>'+esc(people[p.author]||"Участник")+'</strong><small>'+esc(new Date(p.created).toLocaleString("ru-RU"))+'</small></div></div><p>'+esc(p.text)+'</p>'+(c?'<button data-route="case/'+esc(c.id)+'">Project: '+esc(c.title)+' →</button>':'')+(p.author===state.actor?'<button class="community-remove-post" data-action="social-delete" data-id="'+esc(p.id)+'">Удалить публикацию</button>':"")+'<div class="socialactions"><button data-action="social-like" data-id="'+esc(p.id)+'">'+(likes.includes(state.actor)?"♥":"♡")+' '+likes.length+'</button><span>Комментарии '+comments.length+'</span></div><div class="socialcomments">'+comments.map(x=>'<p><strong>'+esc(people[x.author]||"Участник")+':</strong> '+esc(x.text)+'</p>').join("")+'</div><form class="socialcommentform" data-post="'+esc(p.id)+'"><input required maxlength="500" name="comment" placeholder="Комментарий"><button type="submit">Отправить</button></form></article>';
 }).join("");
 return '<section class="community-section-head community-feed-heading"><div><h2>Лента сообщества</h2><small>Обновления, вопросы и результаты работ</small></div></section><section class="panel socialcomposer"><h2>Новая публикация</h2><form id="social-compose"><textarea name="text" required maxlength="1200" rows="3" placeholder="Что нового на объекте?"></textarea><div class="socialcomposeactions"><select name="caseId"><option value="">Без Project</option>'+state.cases.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title)+'</option>').join("")+'</select><button type="submit">Опубликовать</button></div></form></section><div class="community-feed-filters" role="group" aria-label="Фильтр ленты">'+[["all","Всё"],["posts","Публикации"],["work","Результаты"]].map(([id,label])=>'<button data-action="feed-view" data-view="'+id+'" class="'+(communityFeedView===id?"is-active":"")+'">'+label+'</button>').join("")+'</div><div class="socialfeed">'+((communityFeedView!=="posts"?communityWorkFeed(acceptedWorkEvents()):"")+(communityFeedView!=="work"?posts:"")||'<div class="community-empty-feed">Пока нет публикаций или принятых Shards.</div>')+'</div><p class="socialnotice">Публикации сохраняются только на этом устройстве. Это не общий онлайн-чат. Не публикуйте персональные данные клиентов.</p>';
}

/* NVTSK 0.6: approved visual reference, live Case/Shard/Lager data, one active workspace. */
function dashboardV66(){
 const visibleCases=[...new Map([...state.cases,...incomingCases()].map(c=>[c.id,c])).values()];
 const active=visibleCases.filter(c=>pct(c.id)!==100).length,review=state.shards.filter(x=>x.status==="submitted");
 const materials=state.garage.filter(x=>!["van","car","trailer"].includes(x.art));
 const assigned=state.shards.filter(x=>x.assignee===state.actor&&x.status!=="accepted");
 const tasks=lead()?review.concat(state.shards.filter(x=>x.status==="draft").slice(0,3)):assigned;
 const kpis=[["layers","Активные Case",active,"projects"],["team","Участники",state.crew.length,"team"],["box","Lager",materials.length+" позиций","lager"],["coins","К выплате","Нет данных","finance"],["coins","Merit",money(state.cases.reduce((n,c)=>n+Number(c.price||0),0)),"merit"]];
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

function financeWorkspace(){
 const sum=state.cases.reduce((n,c)=>n+Number(c.price||0),0);
 const rows=state.cases.map(c=>'<button class="ref66-finance-row" data-route="case/'+esc(c.id)+'"><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.city||"")+'</small></span><strong>'+money(c.price)+' €</strong><span class="ref66-finance-unknown">Оплата не подтверждена</span></button>').join("");
 return '<div class="ref66-section">'+heading("Финансы · "+APP_BRAND.workspace)+'<div class="ref66-section-tabs"><button data-route="finance">Обзор</button><button data-route="merit">Merit</button><button data-route="analytics">Аналитика</button></div><div class="ref66-finance-cards"><article class="panel"><small>Стоимость Case</small><h2>'+money(sum)+' €</h2></article><article class="panel"><small>Подтверждённые поступления</small><h2>Нет данных</h2></article><article class="panel"><small>Доступно к выплате</small><h2>Не определено</h2></article></div><section class="panel"><h2>Case и расчёты</h2><p class="ref66-finance-warning">Это бюджеты проектов, а не оплаченные счета. Реестр Rechnung, фактические Zahlungseingang и выплаты пока не реализованы. Выплата исполнителю допускается только после полной оплаты Case заказчиком.</p>'+rows+'</section></div>';
}
function meritWorkspace(){
 const minted=state.cases.filter(c=>!c.origin).reduce((n,c)=>n+Number(c.price||0),0);
 const received=state.cases.filter(c=>c.origin).reduce((n,c)=>n+Number(c.price||0),0);
 const allocated=state.shards.reduce((n,x)=>n+Number(x.price||0),0);
 return '<div class="ref66-section">'+heading("Merit · "+activeWorkspace().name)+'<div class="ref66-section-tabs"><button data-route="finance">Финансы</button><button data-route="merit">Merit</button><button data-route="analytics">Аналитика</button></div><div class="ref66-finance-cards"><article class="panel"><small>Создано в собственных Case</small><h2>'+money(minted)+'</h2></article><article class="panel"><small>Получено с переданными Case</small><h2>'+money(received)+'</h2></article><article class="panel"><small>Распределено по Shard</small><h2>'+money(allocated)+'</h2></article><article class="panel"><small>Доступно к распределению</small><h2>'+money(Math.max(0,minted+received-allocated))+'</h2></article></div><section class="panel"><h2>Правило эмиссии</h2><p>Merit создаётся только при первоначальном создании Case. Передача копии Case другой компании не создаёт Merit повторно. Полученный бюджет отображается отдельно от новой эмиссии.</p></section></div>';
}
function analyticsWorkspace(){
 const done=state.shards.filter(x=>x.status==="accepted").length,waiting=state.shards.filter(x=>x.status==="submitted").length;
 return '<div class="ref66-section">'+heading("Аналитика · "+APP_BRAND.workspace)+'<div class="ref66-finance-cards"><article class="panel"><small>Case</small><h2>'+state.cases.length+'</h2></article><article class="panel"><small>Shard принято</small><h2>'+done+'</h2></article><article class="panel"><small>Ожидают приёмки</small><h2>'+waiting+'</h2></article></div><section class="panel"><h2>Проекты и прогресс</h2>'+state.cases.map(c=>'<button class="ref66-finance-row" data-route="case/'+esc(c.id)+'"><span>'+esc(c.title)+'</span><strong>'+pct(c.id)+'%</strong></button>').join("")+'</section></div>';
}
const pages={company:companyProfile,finance:financeWorkspace,merit:meritWorkspace,analytics:analyticsWorkspace,dashboard:dashboardV66,projects,garage,tasks,team,field,settings,pulse,social:()=>communityShell("feed",social()),lager:()=>garage("material"),fuhrpark:()=>garage("fuhrpark")};
function render(){
 if(!account()){loginScreen(accounts().length===0);return;} document.body.classList.remove("nv90-auth");$("#nav").hidden=false;$(".top").hidden=false;
 const r=location.hash.slice(1)||"dashboard";
 $(".local").textContent=lab?"● ТЕСТОВАЯ КОПИЯ":"● LOCAL FIRST";
 const sectionName=r.startsWith("partner/")?"Контрагент":r.startsWith("member/")?"Профиль участника":r.startsWith("team/")?"Сообщество":r.startsWith("shard/")?"Shard":r.startsWith("case/")?"Project":({company:"Профиль фирмы",finance:"Финансы",merit:"Merit",analytics:"Аналитика",projects:"Projects",tasks:"Приёмка",team:"Сообщество",lager:"Склад",garage:"Garage",fuhrpark:"Автопарк",field:"Field Mode",pulse:"Финансы и Merit",social:"Уведомления",settings:"Настройки"})[r]||"Рабочее пространство";
 const workbar=r==="dashboard"?"":'<header class="workspace-bar"><div class="workspace-brand"><div class="nv82-platform-identity"><img src="art/nvtsk-approved.webp" alt="Логотип NVTSK" width="40" height="40"><small>Nvtsk_System</small></div>'+workspaceBadge()+'</div><div class="workspace-tools"><button data-route="dashboard">'+icon("home")+' Главная</button><button data-route="settings" aria-label="Настройки">'+icon("settings")+'</button></div></header>';
 $("#app").innerHTML=(lab?'<p class="labnotice">Тестовая копия · изменения изолированы</p>':"")+(damaged?'<p role="alert">Ошибка чтения. Для восстановления откройте настройки и импортируйте копию.</p>':'')+workbar+(r.startsWith("case/")?detail(r.slice(5)):r.startsWith("shard/")?shardDetail(r.slice(6)):r.startsWith("member/")?memberProfile(r.slice(7)):r.startsWith("partner/")?counterpartyProfile(r.slice(8)):r.startsWith("team/")?team():Object.hasOwn(pages,r)?pages[r]():dashboard());
 document.querySelectorAll("#nav button,.mode button").forEach(b=>b.classList.toggle(b.closest("#nav")?"active":"selected",(b.dataset.route===r||(b.dataset.route==="projects"&&r==="tasks")||(b.dataset.route==="lager"&&["garage","fuhrpark"].includes(r)))||(b.closest(".mode")&&r!=="field"&&b.dataset.route==="dashboard")||(b.closest("#nav")&&(r.startsWith("case/")||r.startsWith("shard/")||r.startsWith("partner/"))&&b.dataset.route==="projects")||(b.closest("#nav")&&(r.startsWith("member/")||r.startsWith("team/"))&&b.dataset.route==="team")));
 if(!lead())document.querySelectorAll('[data-action="new-case"],[data-action="new-electrical"]').forEach(b=>b.remove());
 if(r==="projects")filterProjectHub();
}
const input=(name,text,type="text")=>'<label>'+text+'<input required name="'+name+'" type="'+type+'" '+(type==="number"?'min="0" max="1000000000000" step=".01"':'maxlength="120"')+'></label>';
const select=(name,text,items,value)=>'<label>'+text+'<select required name="'+name+'">'+options(items,value)+'</select></label>';
const pairs=items=>items.map(x=>[x,x]);
let pending;
function fileLinks(files){return (files||[]).map(a=>'<a href="'+a.data+'" download="'+esc(a.name)+'" target="_blank" rel="noopener noreferrer">'+esc(a.name)+'</a>').join(" · ")}
function edit(kind,id){
 const s=state.shards.find(x=>x.id===id);
 const titles={"case-media":"Добавить фото / PDF","pv-tech":"PV · Паспорт объекта","pv-zone":"Новая Modulfläche","pv-string":"Новый DC String","pv-cut":"Раскрой шины","pv-material":"Материал для монтажа","pv-document":"Документ проекта",electrical:"Электромонтаж · New Project",case:"New Project",shard:"New Shard",task:"New Task","link-counterparty":"Заказчик Project",team:"Новая Team", "team-update":"Настроить Team", "assign-team":"Назначить Team",profile:"Редактировать профиль",material:"Новая позиция",crew:"Новый участник",assign:"Назначение",move:"Движение материала"};

 let fields=["case","electrical","shard","task","material","crew"].includes(kind)?input("title",kind==="crew"?"Имя":"Название"):"";
 if(kind==="case-media"){if(!lead()||!state.cases.some(c=>c.id===id))return;fields='<p class="hint">Медиа сохраняются локально. До 8 файлов на Case, изображения до 5 МБ (автоматическое сжатие), PDF до 650 КБ.</p>';}

 if(["pv-tech","pv-zone","pv-string","pv-cut","pv-material","pv-document"].includes(kind)){
   if(!lead())return;
   const project=state.cases.find(c=>c.id===id);
   if(!project)return;
   fields=PVProjectCard.form(kind,project);
 }
 if(kind==="case"||kind==="electrical")fields+='<label>Адрес объекта<input name="address" maxlength="300" required placeholder="Straße, Hausnummer, PLZ, Ort"></label>'+input("price","Бюджет, €","number")+counterpartySelector(kind==="case"?id:null);
 if(kind==="electrical")fields+='<p>Этапы: разметка и штробы; кабельные трассы; подрозетники, розетки и освещение; сборка щита; измерения и приёмка. Подключение и ввод в эксплуатацию — только уполномоченным электроспециалистом (Elektrofachkraft).</p>';
 if(kind==="shard"&&!id){if(!state.cases.length)return alert("Сначала создайте Case, затем добавьте Shard");fields+=select("caseId","Case",state.cases.map(c=>[c.id,c.title+" · "+(c.address||c.city||"")]))}
 if(kind==="shard")fields+=select("kind","Этап",pairs(["Projektierung","DC","AC","Anmeldung","Elektro · Rohbau","Elektro · Kabel","Elektro · Installation","Elektro · Verteiler","Elektro · Prüfung","Другое"]))+input("price","Бюджет Shard, €","number");
 if(kind==="shard"||kind==="assign")fields+=select("assignee","Исполнитель",teamOptions(),s?.assignee||state.crew.find(c=>c.role===roles[1])?.id);
  if(kind==="task")fields+='<p class="hint">Task входит в выбранный Shard. Бюджет и Merit не изменяются.</p><label>Исполнитель<select name="assignee"><option value="">Исполнитель Shard</option>'+options(teamOptions())+'</select></label><label>Описание<textarea name="notes" maxlength="2000" rows="3" placeholder="Что нужно сделать и как проверить результат"></textarea></label>';
 if(kind==="material")fields+=`<label>Артикул / Artikelnummer<input required name="sku" maxlength="80" placeholder="2004260"></label><label>Производитель<input name="brand" maxlength="100" placeholder="K2 Systems / novotegra"></label>`;
 if(kind==="crew")fields+=select("role","Роль",roles.map(r=>[r,r===roles[0]?"Капитан":r]),roles[1]);
 if(kind==="link-counterparty"){
   if(!lead())return;
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
 if(kind==="move"){const open=state.shards.filter(s=>s.status==="draft");fields+=select("type","Операция",open.length?[["issue","Выдача"],["return","Возврат"],["receive","Приход"],["writeoff","Списание"]]:[["receive","Приход"],["writeoff","Списание"]]);fields+='<div id="move-shard-wrap" hidden>'+select("shardId","Case / Shard",open.map(s=>[s.id,(state.cases.find(c=>c.id===s.caseId)?.title||"Case")+" / "+s.title]))+select("recipientId","Кому выдать / от кого вернуть",state.crew.map(c=>[c.id,c.name+" · "+c.role]))+'<p class="hint">Выберите участника, который фактически получает или возвращает материал. Оформляющий операцию записывается отдельно.</p></div>';}
 if(kind==="move")fields+=`<label>Причина списания<input name="reason" maxlength="300" placeholder="Брак, потеря, инвентаризация"></label>`;
 if(kind==="material"||kind==="move")fields+=input("qty","Количество, шт.","number").replace('step=".01"','step="1"').replace('min="0"','min="1"');
 if(["case","electrical","shard"].includes(kind))fields+='<label>Описание и инструкции<textarea name="notes" maxlength="4000" rows="3" placeholder="Объём работ, доступ, особенности объекта"></textarea></label><label>Фото / PDF (до 8 файлов, изображения до 5 МБ с автоматическим сжатием, PDF до 650 КБ)<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple></label><p class="hint">Файлы сохраняются локально вместе с Project и Shard и входят в JSON-экспорт. Не загружайте конфиденциальные документы на чужом устройстве.</p>';
 if(kind==="case-media")fields+='<label>Выбрать фото / PDF<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple required></label>';
 pending={kind,id};$("#dialogTitle").textContent=titles[kind];$("#fields").innerHTML=fields;if(kind==="move")syncMoveFields();$("#dialog").showModal();
}
document.addEventListener("click",async e=>{
 const accept=e.target.closest('[data-action="case-accept"]');if(accept){acceptCase(accept.dataset.id);return}
 const handoff=e.target.closest('[data-action="case-transfer"]');if(handoff){transferCase(handoff.dataset.id,handoff.dataset.target);return}

 const select=e.target.closest('[data-action="project-select"]');if(select){projectHubSelectedCase=select.dataset.id;render();return}
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
 if(e.target.closest('[data-action="feed-view"]')){const view=e.target.closest("[data-action]").dataset.view;if(["all","posts","work"].includes(view)){communityFeedView=view;render()}return}
 if(e.target.closest('[data-action="social-delete"]')){const id=e.target.closest("[data-action]").dataset.id,d=socialData(),p=d.posts.find(x=>x.id===id);if(p&&p.author===state.actor&&confirm("Удалить свою публикацию и комментарии?")){d.posts=d.posts.filter(x=>x.id!==id);try{localStorage.setItem(SOCIAL_KEY,JSON.stringify(d));render()}catch(err){alert(err.message)}}return}
 if(e.target.closest('[data-action="social-like"]')){const id=e.target.closest("[data-action]").dataset.id,d=socialData(),p=d.posts.find(x=>x.id===id);if(p){p.likes=p.likes||[];p.likes=p.likes.includes(state.actor)?p.likes.filter(x=>x!==state.actor):[...p.likes,state.actor];try{localStorage.setItem(SOCIAL_KEY,JSON.stringify(d));render()}catch(err){alert(err.message)}}return}

 const jump=e.target.closest("[data-pv-target]");
 if(jump){
   const target=document.getElementById(jump.dataset.pvTarget);
   if(target)target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth",block:"start"});
   return;
 }
 const b=e.target.closest("[data-route],[data-action]");if(!b)return;
 if(b.dataset.route){location.hash=b.dataset.route;return}
 const a=b.dataset.action,id=b.dataset.id;
 if(a==="sandbox"){
   try{
     if(!lab){localStorage.setItem(BASE+"_lab",JSON.stringify({format:1,data:state,history:[]}));sessionStorage.setItem(BASE+"_mode","lab")}
     else sessionStorage.removeItem(BASE+"_mode");
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
 if(a.startsWith("new-")||a==="assign"||a==="move"){edit(a.replace("new-",""),id);return}
 if(["accept","submit","revise"].includes(a))await change(()=>apply(state,a,{shardId:id}));
  if(a==="task-next"){const t=state.tasks.find(t=>t.id===id);if(t)await change(()=>apply(state,"task-status",{taskId:id,status:t.status==="todo"?"doing":t.status==="doing"?"done":"todo"}));}
 if(a==="undo"&&lead()&&history.length&&confirm("Вернуть предыдущий снимок данных?"))await change(()=>history.at(-1),true);
 if(a==="export"){
 const url=URL.createObjectURL(new Blob([damaged?raw:JSON.stringify(state,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="nvtsk-05.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
});
document.addEventListener("submit",e=>{const form=e.target;if(form.id!=="social-compose"&&!form.matches(".socialcommentform"))return;e.preventDefault();const d=socialData(),isPost=form.id==="social-compose",value=String(new FormData(form).get(isPost?"text":"comment")||"").trim();if(!value||value.length>(isPost?1200:500))return;try{if(isPost){const caseId=new FormData(form).get("caseId");d.posts.push({id:crypto.randomUUID(),author:state.actor,created:new Date().toISOString(),text:value,caseId:state.cases.some(c=>c.id===caseId)?caseId:null,likes:[],comments:[]})}else{const p=d.posts.find(x=>x.id===form.dataset.post);if(!p)return;p.comments.push({id:crypto.randomUUID(),author:state.actor,text:value})}localStorage.setItem(SOCIAL_KEY,JSON.stringify(d));render()}catch(err){alert(err.message)}});
function syncMoveFields(){const type=$("#fields [name=type]")?.value;const wrap=$("#move-shard-wrap");if(!wrap)return;const linked=type==="issue"||type==="return";wrap.hidden=!linked;const picker=wrap.querySelector("select");if(picker)picker.required=linked;const recipient=wrap.querySelector('select[name="recipientId"]');if(recipient)recipient.required=linked;const reason=$("#fields [name=reason]");if(reason)reason.required=type==="writeoff";}
document.addEventListener("change",async e=>{
 if(e.target.id==="company-logo-upload"&&e.target.files?.length){try{const file=e.target.files[0];if(!file.type.startsWith("image/")||file.size>5000000)throw Error("Нужен JPG, PNG или WebP до 5 МБ");const bitmap=await createImageBitmap(file),canvas=document.createElement("canvas"),scale=Math.min(1,720/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const logoData=canvas.toDataURL("image/webp",0.72);if(logoData.length>400000)throw Error("Изображение слишком большое");const r=workspaceRegistry();localStorage.setItem(WORKSPACES_KEY,JSON.stringify({...r,items:r.items.map(w=>w.id===activeWorkspace().id?{...w,logoData}:w)}));render()}catch(err){alert(err.message)}return}

 if(e.target.id==="ph-city"){projectHubCity=e.target.value;filterProjectHub();return}
 if(e.target.id==="ph-kind"){projectHubKind=e.target.value;filterProjectHub();return}
 if(e.target.name==="type"&&pending?.kind==="move")syncMoveFields();

 if(e.target.id==="import"&&lead()&&e.target.files.length){try{
 const file=e.target.files[0];if(file.size>5000000)throw Error("Файл больше 5 МБ");
 const data=validate(migrate(JSON.parse(await file.text())));
 if(confirm("Заменить локальные данные данными из файла?"))await change(()=>data,false,true);
 }catch(err){alert(err.message)}finally{e.target.value=""}}
});
document.addEventListener("input",e=>{if(e.target.id==="project-hub-search"){projectHubQuery=e.target.value;filterProjectHub()}if(e.target.id==="stock-search")document.querySelectorAll("[data-stock]").forEach(el=>el.hidden=!el.dataset.stock.includes(e.target.value.toLowerCase()));if(e.target.id==="member-search")document.querySelectorAll("[data-membersearch]").forEach(el=>el.hidden=!el.dataset.membersearch.includes(e.target.value.toLowerCase()))});
$("#cancel").onclick=()=>$("#dialog").close();
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
   if(await change(operation)){$("#dialog").close();if(kind==="case"||kind==="electrical")location.hash="case/"+p.id;else if(kind==="team"||kind==="team-update")location.hash="team/teams"}
 }catch(error){alert(error.message||"Ошибка вложения")}
 finally{submit.disabled=false}
};
document.querySelector('.mode [data-route="dashboard"]').innerHTML=icon("screen")+" Command Mode";
document.querySelector('.mode [data-route="field"]').innerHTML=icon("field")+" Field Mode";
const navIconNames={dashboard:"home",projects:"layers",team:"team",lager:"box",finance:"coins",merit:"coins",analytics:"layers",pulse:"coins",field:"field",social:"team",settings:"settings"};
document.querySelectorAll("#nav button[data-route]").forEach(b=>{const holder=b.querySelector(".nav-glyph");if(holder)holder.innerHTML=icon(navIconNames[b.dataset.route]||"box")});
addEventListener("hashchange",()=>{render();scrollTo(0,0)});
addEventListener("storage",e=>{if(e.key===KEY||e.key===null){try{readStore()}catch{damaged=true}$("#dialog").close();render()}});
render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
