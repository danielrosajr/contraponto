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

import {summarizeBulkClassification} from '../src/batch.js';

test('resumo do lote separa analisados, alterados e mantidos sem dupla contagem',()=>{
 const plan={total:7,ignoredBlank:1,preservedFacts:1,changes:[
  {id:'a',before:{type:'comentario',classification:''},after:{type:'pergunta',classification:'hipotese'}},
  {id:'b',before:{type:'pergunta',classification:''},after:{type:'pergunta',classification:'hipotese'}},
  {id:'c',before:{type:'comentario',classification:'fato'},after:{type:'argumento',classification:'fato'}}
 ]};
 const stats=summarizeBulkClassification(plan,['a','c','a','invalid']);
 assert.deepEqual(stats,{total:7,changed:2,unchanged:5,suggested:3,notSelected:1,alreadyUnchanged:4,changedTypes:2,changedNatures:1,ignoredBlank:1,preservedFacts:1});
});

test('resumo com todos já classificados confirma sucesso sem qualquer alteração',()=>{
 const stats=summarizeBulkClassification({total:5,ignoredBlank:0,preservedFacts:0,changes:[]},[]);
 assert.equal(stats.total,5);
 assert.equal(stats.changed,0);
 assert.equal(stats.unchanged,5);
 assert.equal(stats.suggested,0);
});

test('resumo do lote considera sugestões desmarcadas como mantidas',()=>{
 const plan={total:3,changes:[
  {id:'1',before:{type:'objecao',classification:''},after:{type:'comentario',classification:''}},
  {id:'2',before:{type:'pergunta',classification:''},after:{type:'cenario',classification:''}}
 ]};
 const stats=summarizeBulkClassification(plan,['1']);
 assert.equal(stats.changed,1);
 assert.equal(stats.unchanged,2);
 assert.equal(stats.notSelected,1);
 assert.equal(stats.alreadyUnchanged,1);
});
