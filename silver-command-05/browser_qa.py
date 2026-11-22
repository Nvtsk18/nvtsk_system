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
            page.locator('#nav [data-route="'+name+'"]').click()
        def act(name):
            page.locator('[data-action="'+name+'"]:visible').first.click()
        def save():
            page.locator('#editor [type=submit]').click()
            expect(page.locator('dialog')).not_to_be_visible()
        def fits():
            overflow = page.evaluate("""() => ({viewport:innerWidth,scroll:document.documentElement.scrollWidth, offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left < -1}).slice(0,12).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,80),width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)}))})""")
            assert overflow["scroll"] <= overflow["viewport"], (width,page.url,overflow)
        expect(page.get_by_role("heading",name="Добро пожаловать",exact=False)).to_be_visible()
        expect(page.locator(".edition")).to_contain_text("0.5")
        fits()
        def capture(screen):
            folder=Path(os.environ.get("QA_IMAGES","/tmp/nvtsk-visual"))
            folder.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(folder/f"{engine.name}-{width}-{screen}.png"))
        # Geometry audit: blocks sharing a visual row must align on both edges.
        symmetry = page.evaluate("""() => {
          const rects = selector => [...document.querySelectorAll(selector)].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&r.width>0&&r.height>0}).map(e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}});
          const groups = [rects('.stats.desktopmetrics .stat'),rects('.stats.phonemetrics .stat'),rects('.mobiletiles .mobiletile')];
          const violations=[];
          for(const group of groups){const rows=new Map();for(const r of group){const k=Math.round(r.top/3)*3;if(!rows.has(k))rows.set(k,[]);rows.get(k).push(r)}for(const row of rows.values()){if(row.length<2)continue;const top=row[0].top,bottom=row[0].bottom;for(const r of row){if(Math.abs(r.top-top)>2||Math.abs(r.bottom-bottom)>2)violations.push({row,reason:'uneven row edges'})}}}
          return violations.slice(0,3);
        }""")
        assert not symmetry, (width, 'Dashboard symmetry', symmetry)
        capture("dashboard")
        # Residential electrical template must create one Case and five
        # budget-balanced Shards without changing the PV workflow.
        route("projects");act("new-electrical")
        page.get_by_label("Название").fill("QA Elektro Rohbau")
        page.get_by_label("Город").fill("Stockach")
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
        route("projects");act("new-case")
        page.get_by_label("Название").fill("QA Roof")
        page.get_by_label("Город").fill("Demo")
        page.get_by_label("Бюджет").fill("1000");save()
        expect(page.get_by_role("heading",name="QA Roof")).to_be_visible();fits();capture("case")
        act("new-shard");page.get_by_label("Название").fill("QA монтаж")
        page.get_by_label("Стоимость").fill("250");save()
        route("garage");fits();capture("garage");act("move");page.get_by_label("Количество").fill("2");save()
        expect(page.get_by_text("Остаток · 22")).to_be_visible()
        page.locator('.mode [data-route=field]').click()
        page.locator('#actor').select_option("member-0")
        task=page.locator("article.taskrow").filter(has_text="QA монтаж")
        task.get_by_role("button",name="На проверку").click()
        expect(task).to_contain_text("На проверке")
        page.locator('#actor').select_option("lead");route("tasks");act("accept")
        page.wait_for_function("""() => {const r=JSON.parse(localStorage.getItem('nvtsk05_independent'));return r?.data?.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')}""")
        page.wait_for_function("JSON.parse(localStorage.getItem('nvtsk05_independent')).data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')")
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
        page.goto(url,wait_until="domcontentloaded");route("projects");expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
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
        route("projects");expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
        assert page.evaluate("""() => {
            const record=JSON.parse(localStorage.getItem('nvtsk05_independent'));
            return record.data.cases.some(c=>c.title==='QA Roof') &&
                record.data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted');
        }"""), "Offline reload lost persisted Case or accepted Shard"
        ctx.set_offline(False)
        route("settings");act("sandbox")
        expect(page.get_by_text("Тестовая копия · изменения изолированы")).to_be_visible()
        route("projects");act("new-case")
        page.get_by_label("Название").fill("Sandbox only")
        page.get_by_label("Город").fill("Demo");page.get_by_label("Бюджет").fill("0");save()
        route("settings");act("sandbox");route("projects")
        expect(page.get_by_role("heading",name="Sandbox only")).to_have_count(0)
        assert not errors, errors
        print(f"PASS {engine.name} {width}×{height}: layout, Case, Shard, Garage, Field, acceptance, export/import, undo, persistence, offline",flush=True)
        ctx.close()
    browser.close()
