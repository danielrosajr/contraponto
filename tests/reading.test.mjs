import test from 'node:test';
import assert from 'node:assert/strict';
import {readingStep} from '../src/reading.js';
const graph={nodes:[
 {id:'a',createdAt:'2026-10-20T10:00:00Z'},
 {id:'b',createdAt:'2026-10-20T10:01:00Z'},
 {id:'c',createdAt:'2026-10-20T10:02:00Z'},
 {id:'d',createdAt:'2026-10-20T10:03:00Z'}
],edges:[
 {id:'e1',source:'a',target:'b',relation:'continua'},
 {id:'e2',source:'b',target:'c',relation:'contesta'},
 {id:'e3',source:'b',target:'d',relation:'continua'},
 {id:'e4',source:'d',target:'a',relation:'retorna'}
]};
test('leitura detecta ausência de ligação sem inventar um bloco',()=>{
 assert.equal(readingStep(graph,'c','next').kind,'end');
 assert.equal(readingStep(graph,'z','next').kind,'end');
});
test('leitura segue conexão única',()=>{
 let step=readingStep(graph,'a','next');
 assert.equal(step.kind,'single');assert.equal(step.candidate.node.id,'b');
});
test('ramificações exigem escolha explícita',()=>{
 const step=readingStep(graph,'b','next');
 assert.equal(step.kind,'choose');assert.deepEqual(step.candidates.map(c=>c.node.id),['c','d']);
});
test('voltar respeita o último percurso real, inclusive com múltiplas entradas',()=>{
 const step=readingStep(graph,'a','back',[{from:'d',to:'a'}]);
 assert.equal(step.kind,'single');assert.equal(step.candidate.node.id,'d');assert.equal(step.fromHistory,true);
});
test('ligações de retorno não geram laço infinito',()=>{
 assert.equal(readingStep(graph,'d','next').candidate.node.id,'a');
 assert.equal(readingStep(graph,'a','back').candidate.node.id,'d');
});
