/* Local demonstration only. Never use as a server access-control boundary. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NVTSK_SOCIAL=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clean=(s,n=1000)=>String(s??'').trim().slice(0,n);
const id=()=> 'post-'+Math.random().toString(36).slice(2,12);
const member=(lot,actor)=>!!lot&&(lot.creator===actor||lot.assignee===actor||Array.isArray(lot.members)&&lot.members.includes(actor));
function canRead(post,lot,actor){return !!post&&!!lot&&post.lotId===lot.id&&member(lot,actor);}
function create({lot,actor,body}){if(!member(lot,actor))throw Error('Lot membership required');if(!clean(body))throw Error('Empty post');return {id:id(),lotId:lot.id,authorId:actor,body:clean(body),visibility:'lot',createdAt:new Date().toISOString(),comments:[]};}
function comment(post,{lot,actor,body}){if(!canRead(post,lot,actor))throw Error('No access');if(!clean(body))throw Error('Empty comment');if(!Array.isArray(post.comments)||post.comments.length>=100)throw Error('Comment limit');const c={id:id(),authorId:actor,body:clean(body,500),createdAt:new Date().toISOString()};post.comments.push(c);return c;}
function valid(p){return !!p&&typeof p.id==='string'&&typeof p.lotId==='string'&&typeof p.authorId==='string'&&typeof p.body==='string'&&p.body.length<=1000&&p.visibility==='lot'&&Array.isArray(p.comments)&&p.comments.length<=100&&p.comments.every(c=>c&&typeof c.id==='string'&&typeof c.authorId==='string'&&typeof c.body==='string'&&c.body.length<=500);}
return Object.freeze({member,canRead,create,comment,valid});
});
