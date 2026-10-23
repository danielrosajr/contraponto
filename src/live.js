// Modelos puros de Debate ao Vivo: tempo de turno != tempo de fala detectada.
import {uid,now,TYPES,RELATIONS} from './model.js';
import {suggestThought} from './inference.js';
import {FALLACIES} from './fallacies.js';
import {normalizeSpeechLanguage,isEnglishLanguage,guessThoughtLanguage} from './language.js';

export const LIVE_FINISH={pausa:'Interrompido para continuar',semresposta:'Encerrado sem resposta',provisoria:'Conclusão provisória',final:'Debate concluído'};
export function newLiveDebate(anchorNodeId=null, voices=[],title='Debate ao Vivo',ts=now(),language='pt-BR'){
 return {id:uid('live'),anchorNodeId:anchorNodeId||null,title:String(title).slice(0,180),language:normalizeSpeechLanguage(language),startedAt:ts,endedAt:null,status:'running',finishReason:null,finishNote:'',audioRequested:false,audioAvailable:false,audioMime:'',transcriptionRequested:false,segments:[],voicesAtStart:voices.map(v=>v.id),createdNodeIds:[]};
}
export function addTurn(live,voiceId,ts=now()){
 const seg={id:uid('turn'),voiceId,startedAt:ts,endedAt:null,turnMs:0,speechMs:0,language:normalizeSpeechLanguage(live.language),text:'',fallacies:[],mappedNodeId:null};
 live.segments.push(seg);return seg;
}
export function stopTurn(seg,ts=now()) {if(!seg)return;seg.endedAt=ts;}
export function liveStats(live,voices=[]){
 const byVoice=new Map(voices.map(v=>[v.id,{id:v.id,name:v.name,turnMs:0,speechMs:0,turns:0,words:0}]));
 for(const s of live.segments||[]){if(!byVoice.has(s.voiceId))byVoice.set(s.voiceId,{id:s.voiceId,name:'Voz não identificada',turnMs:0,speechMs:0,turns:0,words:0});
 const t=byVoice.get(s.voiceId);t.turnMs+=Math.max(0,Number(s.turnMs)||0);t.speechMs+=Math.max(0,Number(s.speechMs)||0);t.turns++;t.words+=(s.text||'').trim().split(/\s+/).filter(Boolean).length;}
 return {totalMs:[...byVoice.values()].reduce((s,x)=>s+x.turnMs,0),speechMs:[...byVoice.values()].reduce((s,x)=>s+x.speechMs,0),words:[...byVoice.values()].reduce((s,x)=>s+x.words,0),turns:live.segments.length,byVoice:[...byVoice.values()].filter(v=>v.turns).sort((a,b)=>b.turnMs-a.turnMs)};
}
export function potentialFallacies(text,language='auto'){const t=String(text||'').toLocaleLowerCase('pt-BR');let signals=[];const lang=language==='auto'?guessThoughtLanguage(text):language;
 if(isEnglishLanguage(lang)){
 if(/\b(everyone|everybody|nobody|no one|always|never|all people|none of them)\b/.test(t))signals.push({key:'generalizacao',reason:'Termo universal: verifique a evidência e possíveis exceções; isso não comprova uma falácia.'});
 if(/\beither\b[^.!?]{2,120}\bor\b/.test(t))signals.push({key:'dilema_falso',reason:'Pode estar limitando opções a duas alternativas. Verifique o contexto.'});
 if(/\b(but you (also|did|do)|you too|you're one to talk)\b/.test(t))signals.push({key:'tu_quoque',reason:'Talvez responda ao comportamento da pessoa, não ao argumento.'});
 return signals.slice(0,3);
 }
 if(/\b(todo mundo|ningu[eé]m|sempre|nunca|todos|nenhum|qualquer pessoa)\b/.test(t))signals.push({key:'generalizacao',reason:'Expressão abrangente; confira se há evidências suficientes e possíveis exceções.'});
 if(/\b(ou [^.!?]{4,65} ou |s[oó] (existem|tem|h[aá]) (duas|2) (op[çc][oõ]es|possibilidades))/.test(t))signals.push({key:'dilema_falso',reason:'Possível apresentação limitada de alternativas; considere outras opções.'});
 if(/\b(voc[eê] (tamb[eé]m|sempre|nunca)|mas voc[eê] fez)\b/.test(t))signals.push({key:'tu_quoque',reason:'Pode haver resposta centrada na conduta da pessoa, não no argumento.'});
 return signals.slice(0,3);
}
export function previewLiveConversion(r,live){
 const existing=new Set(r.nodes.map(n=>n.id)); const candidate=[];
 for(const seg of live.segments){if(seg.mappedNodeId&&existing.has(seg.mappedNodeId))continue;
  const text=(seg.text||'').trim();if(!text)continue;
  const inference=suggestThought(text,seg.language||live.language||'pt-BR');const type=TYPES[inference.type]&&inference.type!=='aovivo'?inference.type:'comentario';
  candidate.push({segmentId:seg.id,voiceId:seg.voiceId,language:normalizeSpeechLanguage(seg.language||live.language),text,type,classification:inference.classification||'',relation:type==='objecao'?'contesta':type==='exemplo'?'exemplifica':'continua',confidence:inference.confidence||'baixa',reason:inference.explanation||'Sugestão local; revise antes de aplicar.'});
 }
 return candidate;
}
export function convertLiveToMap(r,live,approved,ts=now()){
 const existing=new Set(r.nodes.map(n=>n.id)),segMap=new Map(live.segments.map(s=>[s.id,s]));
 const selected=approved.filter(c=>segMap.has(c.segmentId)&&String(c.text||'').trim()&&!segMap.get(c.segmentId).mappedNodeId);
 if(!selected.length)return {markerId:null,nodeIds:[],count:0};
 let marker=r.nodes.find(n=>n.liveSessionId===live.id&&n.type==='aovivo');
 const anchor=r.nodes.find(n=>n.id===live.anchorNodeId)||null;
 const parent=anchor||r.nodes.at(-1)||null;
 if(!marker){marker={id:uid('node'),type:'aovivo',title:'🎙 Debate ao Vivo',content:live.title||'Sessão de debate gravado',notes:'Marcador de origem: os próximos blocos surgiram em uma sessão ao vivo.',classification:'',state:'ativo',voiceId:live.segments[0]?.voiceId||r.voices[0]?.id||'eu1',x:(parent?.x||0)+360,y:parent?.y||0,collapsed:false,createdAt:ts,updatedAt:ts,liveSessionId:live.id,annotations:[],discussion:[],fallacies:[]};r.nodes.push(marker);
  if(anchor)r.edges.push({id:uid('edge'),source:anchor.id,target:marker.id,relation:'continua',createdAt:ts});}
 let last=r.nodes.find(n=>n.id===live.createdNodeIds.at(-1))||marker;let i=0;const nodeIds=[];
 for(const proposal of selected){const seg=segMap.get(proposal.segmentId);if(!seg||seg.mappedNodeId)continue;
  const type=TYPES[proposal.type]&&proposal.type!=='aovivo'?proposal.type:'comentario';const relation=RELATIONS[proposal.relation]?proposal.relation:'continua';
  const position={x:last.x+355,y:last.y+(i%2?120:-40)};const id=uid('node');
  const created={id,type,title:'',content:String(proposal.text).slice(0,30000),notes:'Capturado no Debate ao Vivo. Transcrição automática pode conter erros.',voiceId:seg.voiceId,language:normalizeSpeechLanguage(seg.language||live.language),classification:['','fato','opiniao','hipotese','sentimento','verificar'].includes(proposal.classification)?proposal.classification:'',state:'ativo',x:position.x,y:position.y,collapsed:false,createdAt:seg.startedAt||ts,updatedAt:ts,origin:{kind:'live',sessionId:live.id,segmentId:seg.id,language:normalizeSpeechLanguage(seg.language||live.language)},annotations:[],discussion:[],fallacies:(seg.fallacies||[]).filter(f=>FALLACIES[f.key]).map(f=>({...f}))};
  r.nodes.push(created);r.edges.push({id:uid('edge'),source:last.id,target:id,relation,createdAt:ts});seg.mappedNodeId=id;live.createdNodeIds.push(id);nodeIds.push(id);last=created;i++;
 }
 return {markerId:marker.id,nodeIds,count:nodeIds.length};
}
export function normalizeLiveDebates(raw){
 if(!Array.isArray(raw))return [];
 return raw.slice(-200).filter(s=>s&&typeof s==='object').map(s=>({
 id:String(s.id||uid('live')).slice(0,130),anchorNodeId:typeof s.anchorNodeId==='string'?s.anchorNodeId:null,title:String(s.title||'Debate ao Vivo').slice(0,180),language:normalizeSpeechLanguage(s.language),startedAt:String(s.startedAt||now()),endedAt:s.endedAt||null,status:s.status==='finished'?'finished':'paused',finishReason:LIVE_FINISH[s.finishReason]?s.finishReason:null,finishNote:String(s.finishNote||'').slice(0,2500),audioRequested:!!s.audioRequested,audioAvailable:!!s.audioAvailable,audioMime:String(s.audioMime||'').slice(0,120),nextAudioChunk:Math.max(0,Number(s.nextAudioChunk)||0),transcriptionRequested:!!s.transcriptionRequested,
 voicesAtStart:Array.isArray(s.voicesAtStart)?s.voicesAtStart.slice(0,60).map(String):[],createdNodeIds:Array.isArray(s.createdNodeIds)?s.createdNodeIds.slice(0,3000).map(String):[],segments:Array.isArray(s.segments)?s.segments.slice(0,3000).map(t=>({id:String(t.id||uid('turn')).slice(0,130),voiceId:String(t.voiceId||'eu1'),startedAt:String(t.startedAt||now()),endedAt:t.endedAt||null,turnMs:Math.max(0,Number(t.turnMs)||0),speechMs:Math.max(0,Number(t.speechMs)||0),language:normalizeSpeechLanguage(t.language||s.language),text:String(t.text||'').slice(0,30000),mappedNodeId:typeof t.mappedNodeId==='string'?t.mappedNodeId:null,fallacies:Array.isArray(t.fallacies)?t.fallacies.slice(0,30).filter(f=>f&&FALLACIES[f.key]).map(f=>({id:String(f.id||uid('fallacy')),key:f.key,status:'suspeita',note:String(f.note||'').slice(0,1000),createdAt:String(f.createdAt||now())})):[]})):[]
 }));
}
