"""Run against an isolated test profile: python browser_qa.py BASE_URL."""
import json
import os
import sys
from playwright.sync_api import sync_playwright, expect

url = sys.argv[1]
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
        route("projects");act("new-case")
        page.get_by_label("Название").fill("QA Roof")
        page.get_by_label("Город").fill("Demo")
        page.get_by_label("Бюджет").fill("1000");save()
        expect(page.get_by_role("heading",name="QA Roof")).to_be_visible();fits()
        act("new-shard");page.get_by_label("Название").fill("QA монтаж")
        page.get_by_label("Стоимость").fill("250");save()
        route("garage");fits();act("move");page.get_by_label("Количество").fill("2");save()
        expect(page.get_by_text("Остаток · 22")).to_be_visible()
        page.locator('.mode [data-route=field]').click()
        page.locator('#actor').select_option("member-0")
        task=page.locator("article").filter(has_text="QA монтаж")
        task.get_by_role("button",name="На проверку").click()
        expect(task).to_contain_text("На проверке")
        page.locator('#actor').select_option("lead");route("tasks");act("accept")
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
        ctx.set_offline(True);page.reload();expect(page.get_by_role("heading",name="QA Roof")).to_be_visible()
        assert not errors, errors
        print(f"PASS {engine.name} {width}×{height}: layout, Case, Shard, Garage, Field, acceptance, export/import, undo, persistence, offline",flush=True)
        ctx.close()
    browser.close()
