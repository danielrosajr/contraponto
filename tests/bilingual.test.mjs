import test from 'node:test';
import assert from 'node:assert/strict';
import {guessThoughtLanguage,normalizeSpeechLanguage,SPEECH_LANGUAGES} from '../src/language.js';
import {suggestThought} from '../src/inference.js';
import {newLiveDebate,addTurn,previewLiveConversion,convertLiveToMap,potentialFallacies} from '../src/live.js';
import {newReflection,normalizeImported,initialData} from '../src/model.js';
import {markdownFor} from '../src/export.js';
import {reportMarkdown} from '../src/metrics.js';

test('três localidades com fallback seguro e sem traduzir texto',()=>{
 assert.deepEqual(Object.keys(SPEECH_LANGUAGES),['pt-BR','en-US','en-GB']);
 assert.equal(normalizeSpeechLanguage('EN-gb'),'en-GB');
 assert.equal(normalizeSpeechLanguage('en'),'en-US');
 assert.equal(normalizeSpeechLanguage('fr-FR'),'pt-BR');
 assert.equal(guessThoughtLanguage('I think this might be possible.'),'en-US');
 assert.equal(guessThoughtLanguage('Eu penso que isso importa.'),'pt-BR');
});

test('inglês: cenário, objeção, emoção, premissa, pausa e comentário',()=>{
 for(const [t,type,classification] of [
  ['What if she found the pictures?','cenario','hipotese'],
  ['I disagree with that argument.','objecao',''],
  ['I feel scared about this.','emocao','sentimento'],
  ['I think that this distinction matters.','premissa','opiniao'],
  ['I need a break. We will continue later.','pausa',''],
  ['No idea.','comentario','']
 ]){const got=suggestThought(t,'en-US');assert.equal(got.type,type,t);assert.equal(got.classification,classification,t);}
});

test('ingles GB e US usam mesma classificação, sem reescrever conteúdo',()=>{
 const s='I feel worried about the consequences.';
 assert.equal(suggestThought(s,'en-GB').type,'emocao');
 assert.equal(suggestThought(s,'en-US').type,'emocao');
 assert.equal(suggestThought('Mas e se isso acontecesse?','pt-BR').type,'pergunta');
});

test('detector de falácias em inglês é só pista e não insere marcação',()=>{
 const en=potentialFallacies('Everyone always lies, nobody tells the truth.','en-GB');
 assert.ok(en.some(x=>x.key==='generalizacao'));
 assert.equal(potentialFallacies('Todo mundo sempre mente','pt-BR')[0].key,'generalizacao');
});

test('sessão en-GB preserva idioma no turno, bloco, backup e Markdown',()=>{
 const r=newReflection('Bilingual','Do I know what I believe?');
 const live=newLiveDebate(r.nodes[0].id,r.voices,'Thinking aloud', '2026-10-23T12:00:00.000Z','en-GB');
 r.liveDebates.push(live);
 const a=addTurn(live,'eu1','2026-10-23T12:00:01.000Z');a.text='I feel scared about that possibility.';
 const b=addTurn(live,'eu2','2026-10-23T12:00:15.000Z');b.text='I disagree with your point.';
 const p=previewLiveConversion(r,live);
 assert.deepEqual(p.map(x=>x.type),['emocao','objecao']);
 assert.equal(p[0].classification,'sentimento');
 const res=convertLiveToMap(r,live,p);
 assert.equal(res.count,2);
 const reimported=normalizeImported({schemaVersion:6,reflections:[r]})[0];
 assert.equal(reimported.liveDebates[0].language,'en-GB');
 assert.deepEqual(reimported.liveDebates[0].segments.map(s=>s.language),['en-GB','en-GB']);
 assert.deepEqual(reimported.nodes.filter(n=>n.origin?.kind==='live').map(n=>n.language),['en-GB','en-GB']);
 assert.ok(markdownFor(reimported).includes('en-GB'));
 assert.ok(reportMarkdown(reimported).includes('en-GB'));
 assert.equal(reimported.liveDebates[0].segments[0].text,a.text);
});

test('backup v0.5.0 sem language restaura sessões em pt-BR',()=>{
 const r=newReflection('Old','Question');const live=newLiveDebate(null,r.voices);r.liveDebates.push(live);
 const seg=addTurn(live,'eu1');seg.text='Eu penso que precisamos investigar.';
 delete live.language;delete seg.language;
 const recovered=normalizeImported({schemaVersion:5,reflections:[r]})[0];
 assert.equal(recovered.liveDebates[0].language,'pt-BR');
 assert.equal(recovered.liveDebates[0].segments[0].language,'pt-BR');
 assert.equal(initialData().schemaVersion,6);
});

test('classificação não determina fatos nem valida moralmente argumentos ingleses',()=>{
 const c=suggestThought('Research shows everybody is wrong.','en-US');
 assert.notEqual(c.classification,'fato');
 assert.ok(potentialFallacies('Research shows everybody is wrong.','en-US').length);
});
