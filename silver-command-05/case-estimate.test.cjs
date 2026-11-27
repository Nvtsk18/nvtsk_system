const assert = require("node:assert/strict");
require("./model.js");
const sheet = require("./case-estimate.js");
const input = {
  format:"nvtsk-company-starter", version:1, company:"Test company", owner:"Test owner", trade:"Electrical",
  workers:["Installer A","Installer B"],
  projects:[{title:"Workshop",scope:"Estimate only.",revenue:2400,labor:[{hours:24,rate:20},{hours:24,rate:20}],
    costs:{materials:320,transport:80,overhead:160,reserve:120}}]
};
const initial = JSON.stringify(input);
const workspace = sheet.seed(input, NVModel.roles);
assert.equal(JSON.stringify(input), initial);
assert.equal(workspace.cases.length, 1);
assert.deepEqual(workspace.teams[0].memberIds, ["crew-1","crew-2"]);
assert.equal(workspace.shards[0].teamId, workspace.teams[0].id);
assert.equal(workspace.shards[0].status, "draft");
assert.deepEqual(workspace.tasks.map(x=>x.assignee), workspace.teams[0].memberIds);
assert.deepEqual(workspace.shards[0].shares.map(x=>x.cents), [48000,48000]);
const c = NVModel.validate(NVModel.migrate(JSON.parse(JSON.stringify(workspace)))).cases[0];
const {description, plan} = sheet.read(c.notes);
assert.equal(description, input.projects[0].scope);
assert.deepEqual(sheet.totals(c.price,plan), {pay:96000, other:68000, margin:76000, percent:760/24});
assert.equal(sheet.totals(0,plan).percent, null);
assert.equal(sheet.totals(800,plan).margin,-84000);
assert.equal(sheet.laborCents({hours:1.25,rate:20.02}),2503);
assert.deepEqual(sheet.read("Existing text"),{description:"Existing text",plan:null});
assert.equal(sheet.read("Original\n\n[Смета NVTSK v1]\ninvalid").plan,null);
assert.throws(()=>sheet.write("x".repeat(4000), plan));
assert.throws(()=>sheet.starter({...input,version:2}));
assert.throws(()=>sheet.starter({...input,workers:[]}));
assert.throws(()=>sheet.starter({...input,projects:[{...input.projects[0],revenue:5}]}));
assert.throws(()=>sheet.write("",{...plan,labor:[{id:"bad record",hours:10,rate:20}]}));
assert.throws(()=>sheet.write("",{...plan,labor:[{id:"a",hours:-1,rate:20}]}));
assert.throws(()=>sheet.write("",{...plan,costs:{...plan.costs,materials:Infinity}}));
console.log("Case estimates, portable company setup and native assignments passed.");
