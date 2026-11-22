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
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width,page.url)
        expect(page.get_by_role("heading",name="Добро пожаловать",exact=False)).to_be_visible()
        fits()
        def capture(screen):
            folder=Path(os.environ.get("QA_IMAGES","/tmp/nvtsk-visual"))
            folder.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(folder/f"{engine.name}-{width}-{screen}.png"))
        capture("dashboard")
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
        task=page.locator("article").filter(has_text="QA монтаж")
        task.get_by_role("button",name="На проверку").click()
        expect(task).to_contain_text("На проверке")
        page.locator('#actor').select_option("lead");route("tasks");act("accept")
        # Browser-runtime regression: an accepted Shard cannot consume or return stock,
        # even if the actor is the manager. The persisted local snapshot must stay intact.
        closed_guard = page.evaluate("""() => {
            const raw = JSON.parse(localStorage.getItem('nvtsk05_independent'));
            const data = raw.format === 1 ? raw.data : raw;
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
        assert closed_guard, "Accepted Shard permitted stock mutation in browser model"

        route("settings")
        with page.expect_download() as download:
            act("export")
        path=download.value.path()
        data=json.loads(path.read_text())
        assert any(s["title"]=="QA монтаж" and s["status"]=="accepted" for s in data["shards"])
        act("undo");route("tasks");expect(page.get_by_text("QA монтаж",exact=True)).to_be_visible()
        route("settings");page.locator('#import').set_input_files(path)
        page.wait_for_function("JSON.parse(localStorage.getItem('nvtsk05_independent')).data.shards.some(s=>s.title==='QA монтаж' && s.status==='accepted')")
        page.reload();route("projects");expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
        page.evaluate("navigator.serviceWorker.ready");page.wait_for_function("!!navigator.serviceWorker.controller")
        if server:
            server.shutdown()
            server.server_close()
        else:
            ctx.set_offline(True)
        page.reload();expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
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
        if server: server=start_server(port)
    browser.close()
