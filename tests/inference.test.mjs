import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestThought} from '../src/inference.js';
import {GLOSSARY,definition} from '../src/glossary.js';
import {TYPES,RELATIONS,CLASSES,makeDemo,normalizeImported} from '../src/model.js';
import {markdownFor,promptFor} from '../src/export.js';

test('minidicionário cobre cada tipo, natureza e conexão existente',()=>{
 for(const type of Object.keys(TYPES))assert.ok(definition('types',type)?.[1]);
 for(const relation of Object.keys(RELATIONS))assert.ok(definition('relations',relation)?.[1]);
 for(const cls of Object.keys(CLASSES))assert.ok(definition('classes',cls)?.[1]);
});
test('sugere pergunta escrita livremente',()=>{
 const q=suggestThought('Mas e se ela descobrisse as imagens?');
 assert.equal(q.type,'pergunta');assert.equal(q.classification,'hipotese');
});
test('sugere pausa/retomada e metacomentário',()=>{
 assert.equal(suggestThought('Estou com dor de cabeça. Depois continuamos.').type,'pausa');
 assert.equal(suggestThought('Nós somos o mesmo, por que você fala como se fosse outra pessoa?').type,'meta');
});
test('sugere cenário, emoção, concordância e organização',()=>{
 assert.equal(suggestThought('Imagine que eu visse uma fotografia diferente').type,'cenario');
 assert.equal(suggestThought('Eu sentiria medo e confusão.').type,'emocao');
 assert.equal(suggestThought('Por enquanto aceito esse ponto, mesmo com dúvidas.').type,'acordo');
 assert.equal(suggestThought('Vou analisar três situações diferentes.').type,'roteiro');
});
test('regras expõem incerteza, não inventam fatos ou validade',()=>{
 const a=suggestThought('Uma reflexão difícil.');assert.equal(a.confidence,'fraca');
 assert.equal(a.classification,'');assert.ok(a.explanation);
 const b=suggestThought('Li na internet que isso é obrigatório.');assert.equal(b.classification,'verificar');
 const c=suggestThought('Sinto raiva quando imagino isso.');assert.equal(c.classification,'sentimento');
});
test('importação antiga mantém tipos, posições e adiciona array de notas',()=>{
 const legacy=makeDemo();legacy.nodes[1].type='premissa';delete legacy.nodes[1].annotations;
 const imported=normalizeImported({schemaVersion:1,reflections:[legacy]})[0];
 assert.equal(imported.nodes[1].type,'premissa');assert.equal(imported.nodes[1].x,legacy.nodes[1].x);
 assert.deepEqual(imported.nodes[1].annotations,[]);
});
test('notas sobrevivem backup/importação e aparecem no Markdown e prompt',()=>{
 const r=makeDemo();r.nodes[2].annotations=[{id:'note1',text:'Verificar relação com autonomia.',createdAt:'2026-10-22T21:00:00.000Z'}];
 const imported=normalizeImported({schemaVersion:2,reflections:[r]})[0];
 assert.equal(imported.nodes[2].annotations[0].text,'Verificar relação com autonomia.');
 assert.match(markdownFor(imported),/Nota lateral/);assert.match(markdownFor(imported),/Verificar relação com autonomia/);
 assert.match(promptFor(imported),/Comentários, pausas, roteiros e metacomentários/);
});


test('premissa é sugerida com incerteza para afirmações iniciais',()=>{
 const s=suggestThought('Eu penso que não saber de algo evita um sofrimento imediato.');
 assert.equal(s.type,'premissa');assert.equal(s.classification,'');
 const plain=suggestThought('Uma informação incompleta pode afetar escolhas mesmo quando a pessoa desconhece os detalhes.');
 assert.equal(plain.type,'premissa');assert.equal(plain.confidence,'fraca');
});
