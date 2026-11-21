/* Run: node silver-command/garage-actor.test.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const garage = fs.readFileSync(path.join(__dirname, 'garage.js'), 'utf8');
const mapping = app.match(/NVTSK_GARAGE\?\.setActor\(\(\)=>([^;]+)\);/);
assert.ok(mapping, 'Garage actor provider must be wired');
const actorFor = new Function('demoActor', `return (${mapping[1]});`);
assert.equal(actorFor('me'), 'demo-client');
assert.equal(actorFor('roman'), 'roman');
assert.equal(actorFor('denis'), 'denis');
assert.equal(actorFor('olena'), 'olena');
assert.match(garage, /actorProvider\(\)!=="demo-client"/);
assert.match(garage, /p\.assignee===actor&&p\.creator!==actor/);
assert.match(garage, /\["DC","PLAN"\]\.includes\(p\.kind\)/);
console.log('Garage actor mapping and role invariants: 7/7 PASS');
