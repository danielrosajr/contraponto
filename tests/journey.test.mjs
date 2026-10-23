import test from 'node:test';
import assert from 'node:assert/strict';
import {newReflection,normalizeImported} from '../src/model.js';
import {neighbours,pathTo,pathRecap,suspectedGaps,branchIdFor,formatDuration,elapsedMs} from '../src/journey.js';
const base=newReflection('Teste','Questão');
function fixture(){const r=structuredClone(base);const root=r.nodes[0];root.id='a';root.title='Pergunta principal';root.createdAt='2026-10-22T12:00:00.000Z';
 const make=(id,time,voice='eu1')=>({id,title:id,content:'Pensamento '+id,type:'premissa',voiceId:voice,x:0,y:0,createdAt:time,updatedAt:time});
 r.nodes.push(make('b','2026-10-22T12:05:00.000Z'),make('c','2026-10-22T13:20:00.000Z','eu2'),make('d','2026-10-22T12:10:00.000Z'));
 const edge=(id,source,target,relation='continua')=>({id,source,target,relation,createdAt:'2026-10-22T12:05:00.000Z'});
 r.edges=[edge('ab','a','b'),edge('ac','a','c'),edge('bd','b','d'),edge('dc','d','c'),edge('cy','c','a','retorna')];return r;}
test('navegar próximos e predecessores sem ordenar arbitrariamente',()=>{const r=fixture();assert.deepEqual(neighbours(r,'a').map(x=>x.node.id),['b','c']);assert.deepEqual(neighbours(r,'c','back').map(x=>x.node.id),['a','d']);});
test('resumo de retomada segue arestas reais, encontra caminho curto e ignora ciclos',()=>{const r=fixture();assert.deepEqual(pathTo(r,'d').map(x=>x.id),['a','b','d']);assert.deepEqual(pathTo(r,'d').map(x=>x.edgeId),[null,'ab','bd']);assert.equal(pathRecap(r,'c').lines.at(-1).voice,'Eu crítico');assert.equal(branchIdFor(r,'d'),'b');});
test('gap >= uma hora só em conexões cronológicas diretas, ignora retornos',()=>{const r=fixture();const gaps=suspectedGaps(r);assert.equal(gaps.length,2);assert.equal(gaps[0].edgeId,'ac');assert.equal(gaps[0].gap,80*60000);assert.equal(suspectedGaps(r,2*3600000).length,0);});
test('formatos de tempo e intervalos válidos',()=>{assert.equal(formatDuration(0),'< 1 min');assert.equal(formatDuration(90*60000),'1h 30min');assert.equal(elapsedMs('invalido','2026-01-01'),0);});
test('antigo JSON não perde blocos e normaliza os novos campos',()=>{const r=normalizeImported(fixture())[0];assert.deepEqual(r.sessions,[]);assert.deepEqual(r.nodes[0].fallacies,[]);assert.equal(r.completedAt,null);assert.equal(r.edges.length,5);});
