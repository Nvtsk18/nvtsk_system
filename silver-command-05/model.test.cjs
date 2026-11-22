const assert = require('node:assert/strict');
require('./model.js');
const {apply,validate,migrate} = NVModel;
const base = validate(migrate({version:1,cases:[],garage:[],crew:[{name:'Worker'}],tasks:[],shards:[]}));
let d=base;
function act(a,p){d=apply(d,a,p)}
act('case',{id:'c',city:'Demo',title:'Roof',price:100});
act('shard',{id:'s',caseId:'c',title:'DC',kind:'DC',price:50,assignee:'member-0'});
act('material',{id:'m',title:'Clamp',qty:20});
const move=(id,type,qty)=>act('move',{id,type,qty,itemId:'m',shardId:'s'});
move('one','issue',4);
assert.throws(()=>move('two','return',5));assert.throws(()=>move('two','issue',17));
move('two','return',2); assert.equal(d.garage[0].qty,18);
assert.throws(()=>act('submit',{shardId:'s'}));
act('actor',{id:'member-0'});act('submit',{shardId:'s'});
assert.throws(()=>act('accept',{shardId:'s'}));act('actor',{id:'lead'});act('accept',{shardId:'s'});
assert.throws(()=>act('accept',{shardId:'s'}));
let seed=42;
for(let i=0;i<300;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const previous=JSON.stringify(d);
try{move('t'+i,seed%2?'issue':'return',seed%13+1)}catch{assert.equal(JSON.stringify(d),previous)}
validate(d);const issued=d.moves.reduce((n,m)=>n+(m.type==='issue'?m.qty:-m.qty),0);
assert.equal(d.garage[0].qty+issued,20);}
assert.equal(base.cases.length,0);
console.log('PASS migration, workflow, permissions, stock conservation, rollback, 300 chaos operations, seed=42');
