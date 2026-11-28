const assert = require("node:assert/strict");
const test = require("node:test");
require("./model.js");
require("./training-maps.js");

const {regions, forRoute, forSite, position, addCases} = NVTrainingMaps;

test("each region has four distinct Case links on its own basemap", () => {
  assert.equal(regions.length, 2);
  assert.equal(new Set(regions.map(region => region.image)).size, 2);
  const ids = regions.flatMap(region => region.sites.map(site => site.id));
  assert.equal(new Set(ids).size, 8);
  for (const region of regions) {
    assert.equal(forRoute(region.route), region);
    assert.equal(region.sites.length, 4);
    for (const site of region.sites) {
      assert.equal(forSite(site.id), region);
      const {x, y} = position(region, site);
      assert.ok(x > 0 && x < 100 && y > 0 && y < 100);
    }
  }
});

test("adding PV sites preserves existing ALPHA records, the actor and later edits", () => {
  let old = NVModel.alphaLab();
  for (const site of forRoute("map-osnabrueck").sites) {
    old = NVModel.apply(old, "case", {id:site.id, title:"Своё название", city:"Osnabrück", price:0});
  }
  old = {...old, actor:"lab-m1"};
  const previous = JSON.stringify(old);
  const next = addCases(old);
  assert.equal(JSON.stringify(old), previous);
  assert.equal(next.actor, old.actor);
  assert.deepEqual(next.cases.slice(0, old.cases.length), old.cases);
  assert.equal(next.cases.length, old.cases.length + 4);
  for (const site of forRoute("map-bodensee").sites) {
    const record = next.cases.find(c => c.id === site.id);
    assert.equal(record.city, site.place);
    assert.equal(record.pvPlan.declaredModules, site.modules);
    assert.equal(record.pvPlan.roofType, site.roof);
    assert.equal(record.price, 0);
  }
  NVModel.validate(next);
  assert.strictEqual(addCases(next), next);
  assert.throws(() => addCases({...old, labSeed:undefined}), /ALPHA LAB/);
});
