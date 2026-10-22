import test from 'node:test';
import assert from 'node:assert/strict';
import {planBulkClassification} from '../src/batch.js';
import {makeDemo, TYPES, RELATIONS, CLASSES} from '../src/model.js';

test('lote oferece sugestões e não modifica dados nem conexões',()=>{
 const map=makeDemo();
 map.nodes[0].type='comentario';map.nodes[0].classification='';map.nodes[0].content='Por que eu deveria mudar de ideia?';
 const before=JSON.stringify(map),plan=planBulkClassification(map);
 assert.equal(JSON.stringify(map),before);
 assert.ok(plan.changes.length>0);
 assert.equal(plan.total,map.nodes.length);
 assert.equal(plan.changes.find(x=>x.id===map.nodes[0].id)?.after.type,'pergunta');
});
test('fatos manuais são preservados e textos vazios ignorados',()=>{
 const map={nodes:[{id:'a',type:'comentario',classification:'fato',content:'Eu sentiria medo se soubesse.'},{id:'b',type:'comentario',classification:'',content:'   '}]};
 const plan=planBulkClassification(map);
 assert.equal(plan.ignoredBlank,1);
 assert.equal(plan.preservedFacts,1);
 assert.equal(plan.changes[0].after.classification,'fato');
});
test('as opções do mapa contêm descrições estáveis',()=>{
 assert.ok(Object.keys(TYPES).length>=17);
 assert.ok(Object.keys(RELATIONS).length>=7);
 assert.ok(Object.keys(CLASSES).length>=6);
});
