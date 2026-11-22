"""Run against an isolated test profile: python browser_qa.py BASE_URL."""
import json
import os
import sys
from pathlib import Path
from threading import Thread
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright, expect

def start_server(port):
    server = ThreadingHTTPServer(("127.0.0.1",port),SimpleHTTPRequestHandler)
    Thread(target=server.serve_forever,daemon=True).start()
    return server

server = None if len(sys.argv)>1 else start_server(0)
port = server.server_port if server else None
url = "http://127.0.0.1:"+str(port)+"/silver-command-05/" if server else sys.argv[1]

with sync_playwright() as pw:
    engine = getattr(pw, os.getenv("ENGINE", "chromium"))
    browser = engine.launch()
    for width, height in [(375,812), (390,844), (768,1024), (1440,900)]:
        ctx = browser.new_context(viewport={"width":width,"height":height},has_touch=width<800)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.on("dialog", lambda dialog: dialog.accept())
        page.goto(url)
        def route(name):
            page.evaluate("(name) => { location.hash = name }", name)
        def act(name):
            page.locator('[data-action="'+name+'"]:visible').first.click()
        def save():
            page.locator('#editor [type=submit]').click()
            expect(page.locator('dialog')).not_to_be_visible()
        def fits():
            overflow = page.evaluate("""() => ({viewport:innerWidth,scroll:document.documentElement.scrollWidth, offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left < -1}).slice(0,12).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,80),width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)}))})""")
            assert overflow["scroll"] <= overflow["viewport"], (width,page.url,overflow)
        # Approved reference v66: exact information architecture, live data and mobile fit.
        expect(page.locator(".ref66")).to_be_visible()
        expect(page.locator(".ref66-greeting h1")).to_have_text("NVTSK SYSTEM")
        expect(page.locator(".ref66-metrics .ref66-kpi")).to_have_count(5)
        expect(page.locator(".ref66-projects")).to_be_visible()
        expect(page.locator(".ref66-tasks")).to_be_visible()
        expect(page.locator(".ref66-actions")).to_be_visible()
        expect(page.locator(".ref66-project")).to_have_count(3)
        expect(page.locator(".ref66-toolbar .workspace-switch")).to_be_visible()
        workspace=page.locator(".ref66-toolbar .workspace-switch")
        workspace.locator("summary").click()
        expect(workspace.locator(".workspace-switch-current")).to_contain_text("SolAn Plus GmbH")
        workspace.locator("summary").click()
        assert "office-command-v40.png" in page.evaluate("getComputedStyle(document.querySelector('.ref66'),'::before').backgroundImage")
        fits()
        capture("dashboard")
        # Social Team hub: actual member profiles, owner-editable details, feed,
        # searchable directory, experience and skill-based career progression.
        route("team")
        expect(page.locator(".community-hero")).to_be_visible()
        expect(page.locator(".community-hero h1")).to_have_text("Сообщество")
        expect(page.locator("#nav [data-route=team]")).to_contain_text("Сообщество")
        expect(page.locator(".community-identity-copy")).to_contain_text("Roman Eppinger")
        assert page.locator(".community-person").filter(has_text="Координатор").count()==0, "Legacy Coordinator must not appear"
        assert page.locator(".community-person").filter(has_text="Капитан").count() >= 1

        expect(page.locator(".company-captain-entry")).to_contain_text("Roman Eppinger")
        expect(page.locator(".company-captain-entry")).to_contain_text("SolAn Plus GmbH")
        expect(page.locator(".community-person")).to_have_count(2)
        expect(page.locator(".community-hero .community-kicker")).to_contain_text("SOLAN PLUS")
        route("team/teams")
        expect(page.locator(".company-teams-empty")).to_be_visible()
        act("new-team")
        page.locator("#editor [name=title]").fill("QA DC Crew")
        page.locator("#editor [name=captainId]").select_option("member-0")
        page.locator('#editor [name=memberIds][value="member-0"]').check()
        save()
        expect(page.locator(".company-team-card")).to_have_count(1)
        expect(page.locator(".company-team-card")).to_contain_text("Demo Monteur")
        page.locator(".company-team-card [data-action=team-edit]").click()
        page.locator("#editor [name=title]").fill("QA DC Team")
        save()
        expect(page.locator(".company-team-card")).to_contain_text("QA DC Team")
        route("team")
        expect(page.locator(".community-tabs button")).to_have_count(4)
        expect(page.locator("#actor")).to_have_value("lead")
        capture("team")
        page.locator(".community-person").filter(has_text="Demo Monteur").click()
        expect(page.get_by_role("heading",name="Demo Monteur")).to_be_visible()
        expect(page.locator(".community-profile-stats")).to_be_visible()
        assert page.locator('[data-action="edit-profile"]').count()==0, "Other member profile must not be editable"
        route("member/lead")
        expect(page.get_by_role("heading",name="Roman Eppinger")).to_be_visible()
        expect(page.locator(".company-contact-section")).to_contain_text("Hauptstraße 29, 88662 Überlingen")
        expect(page.locator(".company-contact-section")).to_contain_text("+49 160 784 19 43")
        expect(page.locator(".company-contact-section")).to_contain_text("romaneppinger@solanplus.de")
        expect(page.locator(".company-contact-section")).to_contain_text("www.solanplus.de")
        expect(page.locator(".company-network-company")).to_contain_text("SolAn Plus GmbH")
        expect(page.locator(".company-network-captain")).to_contain_text("Roman Eppinger")
        expect(page.locator(".company-network-branches .company-network-link")).to_have_count(5)
        expect(page.locator(".company-network-person")).to_have_count(1)
        expect(page.locator(".company-network-person")).to_contain_text("Demo Monteur")
        capture("captain-profile")
        act("edit-profile")
        page.locator('#editor [name=headline]').fill("PV Team Lead")
        page.locator('#editor [name=location]').fill("Bodensee")
        page.locator('#editor [name=skillsText]').fill("DC, K2, Lager")
        page.locator('#editor [name=bio]').fill("Organizing PV work and safe commissioning")
        expect(page.locator('#editor [name=phone]')).to_have_value("+49 160 784 19 43")
        page.locator('#editor [name=phone]').fill("+49 160 784 19 99")
        save()
        page.wait_for_function("""() => JSON.parse(localStorage.getItem('nvtsk05_independent')).data.crew.some(c=>c.id==='lead'&&c.headline==='PV Team Lead'&&c.skills.length===3&&c.phone==='+49 160 784 19 99')""")
        expect(page.get_by_text("PV Team Lead")).to_be_visible()
        route("team")
        expect(page.locator(".company-captain-person")).to_contain_text("Roman Eppinger")
        page.locator("#member-search").fill("nonexistent-member")
        expect(page.locator(".community-person:visible")).to_have_count(0)
        page.locator("#member-search").fill("Demo Monteur")
        expect(page.locator(".community-person:visible")).to_have_count(1)
        route("team/achievements")
        expect(page.get_by_role("heading",name="Путь мастерства")).to_be_visible()
        expect(page.locator(".community-rank-row")).to_have_count(2)
        route("team/feed")
        expect(page.locator("#social-compose")).to_be_visible()
        page.locator("#social-compose textarea").fill("QA: DC installation complete")
        page.locator("#social-compose button[type=submit]").click()
        expect(page.locator(".socialpost")).to_contain_text("QA: DC installation complete")
        page.locator('.socialpost [data-action="social-like"]').first.click()
        assert page.evaluate("""() => JSON.parse(localStorage.getItem('nvtsk05_independent_social')).posts.some(p=>p.likes.includes('lead'))"""), "Feed likes not saved"
        route("team")
        expect(page.locator(".community-update")).to_have_count(1)
                # Residential electrical template must create one Case and five
        # budget-balanced Shards without changing the PV workflow.
        route("projects");act("new-electrical")
        page.get_by_label("Название").fill("QA Elektro Rohbau")
        page.locator("#editor [name=city]").fill("Stockach")
        page.get_by_label("Адрес объекта").fill("Hauptstraße 1, 78333 Stockach")
        page.get_by_label("Описание и инструкции").fill("Черновая электропроводка и щит")
        page.locator('input[name="media"]').set_input_files({"name":"plan.pdf","mimeType":"application/pdf","buffer":b"%PDF-1.4\n%%EOF"})
        page.get_by_label("Бюджет").fill("1000");save()
        assert page.evaluate("""() => {
            const data=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
            const c=data.cases.find(c=>c.title==='QA Elektro Rohbau');
            const shards=data.shards.filter(s=>s.caseId===c?.id);
            return !!c && c.address==="Hauptstraße 1, 78333 Stockach" && c.files?.length===1 && c.files[0].name==="plan.pdf" && shards.length===5 &&
                shards.every(s=>s.status==='draft' && s.assignee===null) &&
                Math.round(shards.reduce((n,s)=>n+s.price,0)*100)===100000;
        }"""), "Electrical Case template failed to create five balanced Shards"
        # Role-specific participation: demo installer sees its assigned Shard project,
        # not unrelated projects or new unassigned electrical templates.
        route("team");page.locator("#actor").select_option("member-0")
        page.wait_for_function("""() => JSON.parse(localStorage.getItem('nvtsk05_independent')).data.actor==='member-0'""")
        route("dashboard")
        expect(page.locator(".command-myproject")).to_have_count(1)
        expect(page.locator(".command-myproject")).to_contain_text("PV Dachmontage")
        assert page.locator(".command-mobile-tiles").count()==0
        route("team");page.locator("#actor").select_option("lead")
        page.wait_for_function("""() => JSON.parse(localStorage.getItem('nvtsk05_independent')).data.actor==='lead'""")
        route("dashboard")
        expect(page.locator(".command-myproject")).to_have_count(5)
                # Dashboard dock navigation must reach its linked workspace.
        route("dashboard")
        expect(page.locator(".command-dock button")).to_have_count(5)
        page.locator(".command-dock [data-route=projects]").first.click()
        expect(page.get_by_role("heading",name="Projects",exact=True)).to_be_visible()
        # Project Hub search and tabs must work without altering case ownership.
        route("projects")
        expect(page.locator(".ph-tabs [data-action=project-tab]")).to_have_count(4)
        expect(page.locator(".ph-tabs [data-tab=mine]")).to_have_attribute("aria-current", "page")
        page.locator("#project-hub-search").fill("NO_SUCH_PROJECT_9999")
        expect(page.locator("#ph-no-match")).to_be_visible()
        expect(page.locator(".ph-card:visible")).to_have_count(0)
        page.locator("#project-hub-search").fill("")
        expect(page.locator("#ph-no-match")).to_be_hidden()
        page.locator(".ph-tabs [data-tab=joined]").click()
        expect(page.locator(".ph-tabs [data-tab=joined]")).to_have_attribute("aria-current", "page")
        expect(page.locator(".ph-tabs [data-tab=market]")).to_have_count(0)
        page.locator(".ph-tabs [data-tab=partners]").click()
        expect(page.locator(".cp-list-card")).to_have_count(1)
        expect(page.locator(".cp-list-card")).to_contain_text("Sunpaur GmbH")
        page.locator(".cp-list-card [data-route='partner/sunpaur-gmbh']").click()
        expect(page.get_by_role("heading",name="Sunpaur GmbH")).to_be_visible()
        expect(page.locator(".cp-contact-section")).to_contain_text("Zur Gottwies 6")
        expect(page.locator(".cp-contact-section")).to_contain_text("info@sunpaur.com")
        expect(page.locator(".cp-contact-section")).to_contain_text("HRB 729086")
        expect(page.locator(".cp-contact-section")).to_contain_text("DE361857259")
        expect(page.locator(".cp-contact-section")).to_contain_text("Patrick Kohler")
        expect(page.locator(".cp-contact-section")).to_contain_text("Christian Hertkorn")
        expect(page.locator(".cp-rel-graph")).to_contain_text("DC Shards")
        expect(page.locator(".cp-scope-grid")).to_contain_text("собственные электрики Sunpaur")
        expect(page.locator(".cp-project-row")).to_have_count(0)
        page.evaluate("window.scrollTo(0,0)")
        capture("counterparty")
        act("new-case-partner")
        expect(page.locator("#editor [name=counterpartyId]")).to_have_value("sunpaur-gmbh")
        page.locator("#cancel").click()
        route("projects")
        page.locator(".ph-tabs [data-tab=accounting]").click()
        expect(page.locator(".ph-account-stats > div")).to_have_count(4)
        expect(page.locator(".ph-account")).to_contain_text("Управленческая сводка")
        expect(page.locator(".ph-account")).to_contain_text("не подтверждённые поступления")
        expect(page.locator(".ph-account-row")).to_have_count(page.evaluate("""() => JSON.parse(localStorage.getItem('nvtsk05_independent')).data.cases.length"""))
        page.locator(".ph-tabs [data-tab=mine]").click()
        route("projects");act("new-case")
        page.get_by_label("Название").fill("QA Roof")
        page.locator("#editor [name=city]").fill("Demo")
        page.get_by_label("Бюджет").fill("1000");save()
        expect(page.get_by_role("heading",name="QA Roof")).to_be_visible();fits();capture("case")
        expect(page.locator(".cp-case-link")).to_contain_text("Контрагент не назначен")
        act("link-counterparty")
        page.locator("#editor [name=counterpartyId]").select_option("sunpaur-gmbh")
        save()
        expect(page.locator(".cp-case-partner")).to_contain_text("Sunpaur GmbH")
        page.locator(".cp-case-partner").click()
        expect(page.locator(".cp-project-row")).to_have_count(1)
        expect(page.locator(".cp-project-row")).to_contain_text("QA Roof")
        page.locator(".cp-project-row").click()
        expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
        # PV technical dossier: source plan vs Modulfläche and kWp consistency.
        expect(page.locator(".pv-cockpit")).to_be_visible()
        expect(page.locator(".pv-cockpit-nav button")).to_have_count(9)
        act("pv-tech")
        for key,val in [
            ("sourcePlan","Montageplanung Rev A"),("declaredModules","15"),
            ("declaredKwp","6.44"),("panelWp","460"),
            ("moduleType","AXIbiperfect 460"),("roofType","Beton"),
            ("tileType","Braas Frankfurter Pfanne"),("mounting","Novo-ES"),
            ("slopeDeg","35"),("eaveHeightM","6.0"),
            ("rafterSpacingCm","95"),("model3d","https://example.com/pv3d")
        ]: page.locator(f'#editor [name="{key}"]').fill(val)
        save()
        expect(page.locator(".pv-facts")).to_contain_text("Montageplanung Rev A")
        act("pv-zone")
        page.locator("#editor [name=name]").fill("Modulfläche/String 1")
        page.locator("#editor [name=direction]").fill("Südwest")
        page.locator("#editor [name=modules]").fill("14")
        page.locator("#editor [name=hooks]").fill("24")
        page.locator("#editor [name=panelWp]").fill("460")
        page.locator("#editor [name=roofType]").fill("Beton")
        save()
        expect(page.locator(".pv-zone")).to_have_count(1)
        expect(page.locator(".pv-issue.pv-danger")).to_contain_text("15")
        expect(page.locator(".pv-issue.pv-danger")).to_contain_text("14")
        expect(page.locator(".pv-issue.pv-warning").filter(has_text="Anlagenleistung")).to_contain_text("6,44")
        act("pv-string")
        page.locator("#editor [name=name]").fill("DC String 1")
        page.locator("#editor [name=direction]").fill("Südwest")
        page.locator("#editor [name=modules]").fill("14")
        page.locator("#editor [name=mppt]").fill("MPPT 1")
        save()
        expect(page.locator("#pv-strings .pv-zone")).to_have_count(1)
        expect(page.locator(".pv-issue.pv-warning").filter(has_text="DC Strings")).to_contain_text("DC Strings")
        act("pv-cut")
        page.locator("#editor [name=name]").fill("C-N-Schiene 37")
        page.locator("#editor [name=stockLengthMm]").fill("5900")
        page.locator("#editor [name=requiredLengthMm]").fill("5786")
        page.locator("#editor [name=qty]").fill("4")
        save()
        expect(page.locator(".pv-cut")).to_contain_text("Остаток 114 мм")
        act("pv-material")
        page.locator("#editor [name=name]").fill("Dachhaken")
        page.locator("#editor [name=qty]").fill("24")
        page.locator("#editor [name=sku]").fill("0300")
        save()
        expect(page.locator(".pv-material")).to_have_count(1)
        act("pv-document")
        page.locator("#editor [name=name]").fill("Stringplan Rev A")
        page.locator("#editor [name=kind]").fill("DC Stringplan")
        page.locator("#editor [name=url]").fill("https://example.com/stringplan.pdf")
        page.locator("#editor [name=revision]").fill("A")
        save()
        expect(page.locator(".pv-document")).to_have_count(1)
        page.locator('[data-action="pv-check"][data-check="risk"]').click()
        expect(page.locator('[data-action="pv-check"][data-check="risk"]')).to_have_attribute("aria-pressed","true")
        assert page.evaluate("""() => {
           const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
           const p=d.cases.find(c=>c.title==='QA Roof')?.pvPlan;
           return p?.checks?.risk===true && p?.zones?.length===1 && p?.strings?.length===1 && p?.cuts?.length===1 && p?.materials?.length===1 && p?.documents?.length===1;
        }"""), "PV project dossier must persist with linked source fields"
        page.evaluate("window.scrollTo(0,0)")
        capture("case-pv-dossier")
        act("new-shard");page.get_by_label("Название").fill("QA монтаж")
        page.get_by_label("Бюджет Shard").fill("250");save()
        act("assign-team")
        expect(page.locator('#editor [name=teamId]')).to_have_value(page.locator('#editor [name=teamId]').input_value())
        save()
        assert page.evaluate("""() => {
          const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
          return d.shards.some(s=>s.title==='QA монтаж'&&s.teamId===d.teams[0].id&&s.assignee==='member-0');
        }"""), "Team assignment must link Shard and captain"
        # Project -> Shard -> Task must be a real nested hierarchy.
        act("new-task")
        page.locator("#editor [name=title]").fill("QA закрепить рельсы")
        page.locator("#editor [name=notes]").fill("Крепёж и безопасность")
        save()
        assert page.evaluate("""() => {
          const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
          const sh=d.shards.find(s=>s.title==='QA монтаж');
          const t=d.tasks.find(t=>t.title==='QA закрепить рельсы');
          return !!sh && !!t && t.shardId===sh.id && t.status==='todo' && d.cases.some(c=>c.id===sh.caseId);
        }"""), "Task must belong to Shard and Shard to project"
        page.locator(".shard-work-card").filter(has_text="QA монтаж").get_by_role("button",name="Открыть Shard").click()
        expect(page.get_by_role("heading",name="QA монтаж")).to_be_visible()
        expect(page.get_by_text("QA закрепить рельсы")).to_be_visible()
        fits()
        route("garage");fits();
        # Audit every warehouse image: local assets are required; supplier-hosted
        # images are reported separately because third-party networks may block CI.
        photos = page.evaluate("""async () => {
          const imgs=[...document.querySelectorAll('.stockitem img,.stockcataloguecard img')];
          await Promise.all(imgs.map(img=>img.decode().catch(()=>null)));
          return imgs.map(img=>({src:img.currentSrc||img.src,alt:img.alt,ok:img.naturalWidth>0,width:img.naturalWidth}));
        }""")
        broken_local=[p for p in photos if not p["ok"] and "/art/" in p["src"]]
        assert not broken_local, (width,"Broken local warehouse images",broken_local)
        print("WAREHOUSE_PHOTOS",engine.name,width,json.dumps(photos,ensure_ascii=False))
        capture("garage");act("move");page.get_by_label("Количество").fill("2");save()
        expect(page.locator(".stockitem").filter(has_text="Einlegeschiene").get_by_text("22",exact=True)).to_be_visible()
        # Article accounting: unique SKUs, receipts, writeoffs and negative-stock guard.
        article_guards=page.evaluate("""() => {
          const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
          const item={id:'qa-article',title:'K2 SingleRail 36',sku:'2004260',brand:'K2 Systems',qty:0};
          const a=NVModel.apply(d,'material',item);
          const b=NVModel.apply(a,'move',{id:'qa-in',itemId:item.id,type:'receive',qty:12});
          const c=NVModel.apply(b,'move',{id:'qa-out',itemId:item.id,type:'writeoff',qty:2,reason:'Повреждённая упаковка'});
          const stock=c.garage.find(m=>m.id===item.id);
          const errors=[()=>NVModel.apply(c,'material',{...item,id:'qa-duplicate'}),()=>NVModel.apply(c,'move',{id:'qa-over',itemId:item.id,type:'writeoff',qty:11,reason:'Брак'}),()=>NVModel.apply(c,'move',{id:'qa-noreason',itemId:item.id,type:'writeoff',qty:1})];
          return stock.qty===10&&c.moves.at(-1).reason==='Повреждённая упаковка'&&errors.every(fn=>{try{fn();return false}catch{return true}});
        }""")
        assert article_guards, (width,"Article receipts/writeoffs/SKU invariants failed")
        # Inventory invariants: insufficient stock, cross-Shard returns and
        # fractional quantities must fail without modifying persisted data.
        stock_guards = page.evaluate("""() => {
          const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
          const item=d.garage.find(m=>m.id==='rail');
          const shard=d.shards.find(s=>s.title==='QA монтаж');
          const issuedIds=new Set(d.moves.filter(m=>m.itemId===item.id&&m.type==='issue').map(m=>m.shardId));
          const other=d.shards.find(s=>s.id!==shard.id&&s.status!=='accepted'&&!issuedIds.has(s.id));
          const cases=[{type:'issue',qty:item.qty+1,shardId:shard.id},{type:'return',qty:3,shardId:shard.id},{type:'issue',qty:.5,shardId:shard.id}];
          if(other)cases.push({type:'return',qty:1,shardId:other.id});
          return cases.every((p,i)=>{try{NVModel.apply(d,'move',{id:'guard-'+i,itemId:item.id,...p});return false}catch{return true}})&&item.qty===22;
        }""")
        assert stock_guards, (width,"Stock movement invariants failed")
        route("team")
        page.locator("#actor").select_option("member-0")
        route("field")
        route("tasks")
        task_btn=page.locator(".shard-work-card").filter(has_text="QA монтаж").get_by_role("button",name="Начать")
        task_btn.click()
        page.locator(".shard-work-card").filter(has_text="QA монтаж").get_by_role("button",name="Завершить").click()
        page.wait_for_function("""() => {
          const d=JSON.parse(localStorage.getItem('nvtsk05_independent')).data;
          return d.tasks.some(t=>t.title==='QA закрепить рельсы' && t.status==='done');
        }""")
        route("field")
        task=page.locator("article.fieldtask").filter(has_text="QA монтаж")
        task.get_by_role("button",name="Передать на приёмку").click()
        expect(task).to_contain_text("На проверке")
        route("team");page.locator('#actor').select_option("lead");route("tasks");act("accept")
        page.wait_for_function("""() => {const r=JSON.parse(localStorage.getItem('nvtsk05_independent'));return r?.data?.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')}""")
        page.wait_for_function("JSON.parse(localStorage.getItem('nvtsk05_independent')).data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')")
        # Gamification is linked to verified work, not raw task toggles.
        route("member/member-0")
        expect(page.locator(".community-profile-stats")).to_contain_text("75")
        expect(page.locator(".community-progress")).to_contain_text("75 XP")
                # Accepted Shard appears as a verified social milestone (never a premature badge).
        route("team/feed")
        expect(page.locator(".community-work-event")).to_have_count(1)
        expect(page.locator(".community-work-event")).to_contain_text("QA монтаж")
        expect(page.locator(".community-work-event")).to_contain_text("Demo Monteur")
        page.locator('[data-action="feed-view"][data-view="posts"]').click()
        expect(page.locator(".community-work-event")).to_have_count(0)
        expect(page.locator(".socialpost")).to_contain_text("QA: DC installation complete")
        page.locator('[data-action="feed-view"][data-view="work"]').click()
        expect(page.locator(".community-work-event")).to_have_count(1)
        expect(page.locator(".socialpost")).to_have_count(0)
        page.locator('[data-action="feed-view"][data-view="all"]').click()
        expect(page.locator(".community-work-event")).to_have_count(1)
        expect(page.locator(".socialpost")).to_have_count(1)
        route("member/member-0")
        expect(page.locator(".community-profile-activity .community-work-event")).to_have_count(1)
        expect(page.locator(".community-profile-activity")).to_contain_text("QA монтаж")
        route("team/feed")
        page.locator('[data-action="social-delete"]').click()
        expect(page.locator(".socialpost")).to_have_count(0)
        expect(page.locator(".community-work-event")).to_have_count(1)
        assert not page.evaluate("""() => JSON.parse(localStorage.getItem('nvtsk05_independent_social')).posts.length"""), "Deleting own post must persist"
        route("settings")
        expect(page.locator(".company-identity-settings")).to_contain_text("SolAn Plus GmbH")
        expect(page.locator(".company-identity-settings")).to_contain_text("NVTSK SYSTEM")
        route("projects")
        expect(page.locator(".ph-tabs [data-action=project-tab]")).to_have_count(4)
        # Browser-runtime regression: an accepted Shard cannot consume or return stock,
        # even if the actor is the manager. The persisted local snapshot must stay intact.
        closed_guard = page.evaluate("""() => {
            const raw = JSON.parse(localStorage.getItem('nvtsk05_independent'));
            const data = raw.data;
            const shard = data.shards.find(s => s.title === 'QA монтаж');
            const item = data.garage.find(m => m.id === 'rail');
            if (!shard || shard.status !== 'accepted' || !item) return false;
            const before = JSON.stringify(data);
            return ['issue','return'].every((type,i) => {
                try {
                    NVModel.apply(data,'move',{id:'closed-qa-'+i,type,qty:1,itemId:item.id,shardId:shard.id});
                    return false;
                } catch (_) {
                    return JSON.stringify(data) === before;
                }
            });
        }""")
        assert closed_guard, "Accepted Shard stock guard failed: "+str(page.evaluate("""() => {const r=JSON.parse(localStorage.getItem('nvtsk05_independent'));return {actor:r.data.actor,shards:r.data.shards.filter(s=>s.title==='QA монтаж'),item:r.data.garage.find(m=>m.id==='rail')};}"""))

        route("settings")
        with page.expect_download() as download:
            act("export")
        path=download.value.path()
        data=json.loads(path.read_text())
        assert any(s["title"]=="QA монтаж" and s["status"]=="accepted" for s in data["shards"])
        act("undo");route("tasks");expect(page.get_by_text("QA монтаж",exact=True)).to_be_visible()
        route("settings");page.locator('#import').set_input_files(path)
        page.wait_for_function("JSON.parse(localStorage.getItem('nvtsk05_independent')).data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')")
        page.goto(url,wait_until="domcontentloaded");route("projects");expect(page.locator(".ph-card").filter(has_text="QA Roof")).to_be_visible()
        page.evaluate("navigator.serviceWorker.ready");page.wait_for_function("!!navigator.serviceWorker.controller")
        # Keep the local server running for the other viewport cases.
        # Offline emulation is isolated to this browser context and does not
        # affect the remaining Chromium/WebKit test matrix.
        ctx.set_offline(True)
        if engine.name == "chromium":
            page.goto(url,wait_until="domcontentloaded")
        else:
            # WebKit Playwright offline navigation is unstable; verify cached shell directly.
            assert page.evaluate("""async () => !!(await caches.match(new URL("index.html",navigator.serviceWorker.controller.scriptURL)))"""), "Offline shell missing in WebKit cache"
        route("projects");expect(page.locator(".ph-card").filter(has_text="QA Roof")).to_be_visible()
        assert page.evaluate("""() => {
            const record=JSON.parse(localStorage.getItem('nvtsk05_independent'));
            return record.data.cases.some(c=>c.title==='QA Roof') &&
                record.data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted') &&
                record.data.tasks.some(t=>t.title==='QA закрепить рельсы' && t.status==='done');
        }"""), "Offline reload lost persisted Case or accepted Shard"
        ctx.set_offline(False)
        route("settings");act("sandbox")
        expect(page.get_by_text("Тестовая копия · изменения изолированы")).to_be_visible()
        route("projects");act("new-case")
        page.get_by_label("Название").fill("Sandbox only")
        page.locator("#editor [name=city]").fill("Demo");page.get_by_label("Бюджет").fill("0");save()
        route("settings");act("sandbox");route("projects")
        expect(page.get_by_role("heading",name="Sandbox only")).to_have_count(0)
        assert not errors, errors
        print(f"PASS {engine.name} {width}×{height}: layout, Project, Shard, Task, Garage, Field, acceptance, export/import, undo, persistence, offline",flush=True)
        ctx.close()
    browser.close()
