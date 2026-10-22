import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemo,initialData,newReflection,normalizeImported,RELATIONS,TYPES} from '../src/model.js';
import {markdownFor,promptFor,makeSvg} from '../src/export.js';

test('biblioteca inicial contém exemplo conectado e múltiplos caminhos',()=>{
 const d=initialData();assert.equal(d.schemaVersion,2);const r=d.reflections[0];assert.equal(r.nodes.length,15);assert.equal(r.edges.length,16);
 assert.equal(r.nodes.filter(n=>n.type==='cenario').length,2);assert.ok(new Set(r.nodes.map(n=>n.voiceId)).size>=2);
 for(const e of r.edges){assert.ok(r.nodes.some(n=>n.id===e.source));assert.ok(r.nodes.some(n=>n.id===e.target));assert.ok(RELATIONS[e.relation]);}
 assert.ok(r.edges.some(e=>e.relation==='retorna'&&e.target===r.nodes[0].id));
});
test('nova reflexão possui pergunta inicial independente',()=>{
 const a=newReflection('A','Pergunta A'),b=newReflection('B','Pergunta B');
 assert.notEqual(a.id,b.id);assert.notEqual(a.nodes[0].id,b.nodes[0].id);
 assert.equal(a.nodes[0].type,'pergunta');assert.equal(a.nodes[0].content,'Pergunta A');
});
test('backup JSON importado preserva posições, nós e conexões',()=>{
 const r=makeDemo(),data=normalizeImported(JSON.parse(JSON.stringify({schemaVersion:1,reflections:[r]})));
 assert.equal(data.length,1);assert.equal(data[0].nodes.length,r.nodes.length);assert.deepEqual(data[0].edges,r.edges);
 assert.deepEqual(data[0].nodes.map(n=>[n.x,n.y]),r.nodes.map(n=>[n.x,n.y]));
});
test('importação rejeita estruturas inválidas e IDs duplicados',()=>{
 assert.throws(()=>normalizeImported({foo:'bar'}));
 const r=makeDemo();r.nodes[1].id=r.nodes[0].id;
 assert.throws(()=>normalizeImported({reflections:[r]}),/duplicado/);
});
test('exportações incluem conexões, vozes e interpretação cuidadosa',()=>{
 const r=makeDemo(),md=markdownFor(r),prompt=promptFor(r);
 assert.match(md,/Conexões detalhadas/);assert.match(md,/Retorna a/);
 assert.match(md,/Eu inicial/);assert.match(prompt,/sentimentos não são erros lógicos/);
 assert.match(prompt,/objeções pendentes/);
});
test('exportação SVG contém o mapa inteiro, seus blocos e rotas',()=>{
 const r=makeDemo(),{svg,width,height}=makeSvg(r);
 assert.ok(width>2500&&height>500);assert.ok(svg.startsWith('<svg'));
 assert.equal((svg.match(/<path d="M/g)||[]).length,r.edges.length+1); // inclui a seta do marcador
 assert.match(svg,/Conclusão provisória/);assert.match(svg,/Retorna a/);
});
