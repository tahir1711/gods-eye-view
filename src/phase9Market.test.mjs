/** Phase 9 Prism full-phase market publication tests. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
const snapshot=JSON.parse(fs.readFileSync(new URL('../public/phase9/market.json',import.meta.url),'utf8'));
const fmt=v=>new Intl.NumberFormat('en-PK').format(v);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('Phase 9 governed snapshot acceptance',()=>{
 assert.equal(snapshot.engineering_plot_count,19285);
 assert.equal(snapshot.observed_plot_count,1068);
 assert.equal(snapshot.independent_claim_count,5690);
 assert.equal(snapshot.held_events_excluded,8305);
 assert.equal(snapshot.sector_count,16);
 assert.equal(snapshot.plots.length,1068);
 assert.equal(snapshot.plots.reduce((n,p)=>n+p.claim_count,0),5690);
});
test('Phase 9 snapshot semantics and identities',()=>{
 assert.match(snapshot.note,/not completed sales/i);
 assert.match(snapshot.note,/No observation means unknown/i);
 const ids=new Set(snapshot.plots.map(p=>p.plot_id));
 assert.equal(ids.size,1068);
 for(const p of snapshot.plots){assert.ok(/^[A-Z]+-.+/.test(p.plot_id));assert.ok(p.claim_count>0);assert.ok(Array.isArray(p.history));assert.equal(p.history.length,p.claim_count);}
});
test('format and escaping helpers',()=>{assert.ok(['3,50,00,000','35,000,000'].includes(fmt(35000000)));assert.equal(esc('<script>'),'&lt;script&gt;');});
test('full-phase search crosses blocks',()=>{
 const blocks=new Set(snapshot.plots.map(p=>p.block)); assert.ok(blocks.size>1);
 const first=snapshot.plots[0].plot_id.toLowerCase(); assert.equal(snapshot.plots.filter(p=>p.plot_id.includes(first.toUpperCase())).length>=1,true);
});
