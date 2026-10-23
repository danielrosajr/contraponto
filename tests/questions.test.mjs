import test from 'node:test';
import assert from 'node:assert/strict';
import {detectSpokenQuestion,punctuateSpokenQuestion} from '../src/questions.js';
import {suggestThought} from '../src/inference.js';
import {batchVisualMap,batchVisualDiff,BATCH_HIGHLIGHT_MS} from '../src/batch-visual.js';

test('perguntas em português sem sinal são detectadas e pontuadas',()=>{
 for(const text of ['Você acha que isso faz sentido','Mas por que isso aconteceu','Será que ela gostaria disso','Como posso explicar meu argumento','E se eu estivesse errado']){
  const result=punctuateSpokenQuestion(text,'pt-BR');
  assert.equal(result.text,text+'?',text);assert.equal(result.changed,true,text);
 }
 assert.equal(suggestThought('Você acha que isso faz sentido','pt-BR').type,'pergunta');
});
test('perguntas em inglês britânico e americano sem ? recebem interrogação',()=>{
 for(const lang of ['en-US','en-GB']){
  for(const text of ['Do you think that matters','Why do you believe that','Could I be wrong','What if she found out','Is it really important']){
   const p=punctuateSpokenQuestion(text,lang);
   assert.equal(p.text,text+'?',lang+' '+text);
  }
  assert.equal(suggestThought('Do you think it matters',lang).type,'pergunta');
  assert.equal(suggestThought('What if she found out',lang).type,'cenario');
 }
});
test('não muda declarações e não inventa interrogação em texto ambíguo',()=>{
 for(const [text,lang] of [
  ['I think we should verify this','en-US'],
  ['I wonder why I thought this','en-GB'],
  ['Eu penso que precisamos verificar','pt-BR'],
  ['Talvez seja uma hipótese','pt-BR'],
  ['Do you think so. Now let me explain why.','en-US']
 ]){
  const p=punctuateSpokenQuestion(text,lang);assert.equal(p.changed,false,text);assert.equal(p.text,text,text);
 }
});
test('não duplica interrogação nem destrói sinais existentes',()=>{
 assert.equal(punctuateSpokenQuestion('Do you think so?','en-US').text,'Do you think so?');
 assert.equal(punctuateSpokenQuestion('Você acha que é isso? ','pt-BR').text,'Você acha que é isso? ');
 assert.equal(punctuateSpokenQuestion('Why now!','en-US').text,'Why now!');
 assert.equal(punctuateSpokenQuestion('  Mas por que isso.  ','pt-BR').text,'  Mas por que isso?  ');
});
test('comparação da classificação é puramente visual, seleciona apenas alterações aceitas',()=>{
 const items=[
  {id:'a',before:{type:'premissa',classification:'opiniao'},after:{type:'pergunta',classification:'hipotese'}},
  {id:'b',before:{type:'objecao',classification:''},after:{type:'objecao',classification:''}},
  {id:'c',before:{type:'premissa',classification:''},after:{type:'pergunta',classification:''}}
 ];
 const snapshot=structuredClone(items);
 const map=batchVisualMap(items);
 assert.deepEqual([...map.keys()],['a','c']);
 assert.equal(map.get('a').fields.length,2);
 assert.equal(map.get('c').fields.length,1);
 assert.equal(batchVisualDiff(items[1]),null);
 assert.equal(BATCH_HIGHLIGHT_MS,30000);
 assert.deepEqual(items,snapshot);
});
