import {branchIdFor,elapsedMs,formatDuration} from './journey.js';
import {TYPES,RELATIONS,niceDate} from './model.js';
import {FALLACIES,FALLACY_STATUSES} from './fallacies.js';
export function metricsFor(r){
 const count=(items,keyFn)=>items.reduce((a,x)=>{const key=keyFn(x);a[key]=(a[key]||0)+1;return a;},{});
 const sessions=r.sessions||[];
 const totalMs=sessions.reduce((s,x)=>s+Math.max(0,Number(x.activeMs)||0),0);
 const focusMs={};for(const session of sessions){for(const [id,ms] of Object.entries(session.focusMs||{}))focusMs[id]=(focusMs[id]||0)+Math.max(0,Number(ms)||0);}
 const voices=new Map(r.voices.map(v=>[v.id,v.name]));
 const branches=[...new Set(r.edges.filter(e=>e.source===(r.nodes.find(n=>n.title==='Pergunta principal')||r.nodes[0])?.id).map(e=>e.target))].map(id=>{
  const n=r.nodes.find(x=>x.id===id);return n?{id,title:n.title||n.content.slice(0,65)||TYPES[n.type]?.[0],activeMs:focusMs[id]||0}:null;
 }).filter(Boolean);
 const allFallacies=r.nodes.flatMap(n=>(n.fallacies||[]).map(f=>({...f,nodeId:n.id})));
 const stamps=r.nodes.map(n=>n.createdAt).filter(Boolean).sort();
 const start=stamps[0]||r.createdAt,end=r.completedAt||stamps.at(-1)||r.updatedAt;
 return {totalNodes:r.nodes.length,totalEdges:r.edges.length,byType:count(r.nodes,n=>TYPES[n.type]?.[0]||n.type),
  byVoice:count(r.nodes,n=>voices.get(n.voiceId)||'Sem voz'),byRelation:count(r.edges,e=>RELATIONS[e.relation]||e.relation),
  totalMs,sessionCount:sessions.length,focusMs,branches,unassignedMs:Math.max(0,totalMs-Object.values(focusMs).reduce((s,x)=>s+x,0)),
  firstAt:start,lastAt:end,calendarMs:elapsedMs(start,end),allFallacies,fallaciesByStatus:count(allFallacies,f=>FALLACY_STATUSES[f.status]||f.status),
  isComplete:r.status==='concluído'};
}
export function reportMarkdown(r){const m=metricsFor(r),lines=[`# Relatório do debate — ${r.title}`,`Estado: ${r.status}${m.isComplete?' (concluído)':' (relatório parcial)'}`,`Último encerramento: ${r.closure?.kind||'não registrado'}${r.closure?.note?' — '+r.closure.note:''}`,`Pergunta: ${r.question}`,`Início: ${niceDate(m.firstAt)} · Último marco: ${niceDate(m.lastAt)}`,`Tempo ativo estimado na interface: ${formatDuration(m.totalMs)} · ${m.sessionCount} sessão(ões)`,`Intervalo de calendário (inclui pausas): ${formatDuration(m.calendarMs)}`,`Total: ${m.totalNodes} blocos · ${m.totalEdges} conexões`,'','## Tipos de blocos',...Object.entries(m.byType).sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).map(([a,b])=>`- ${a}: ${b}`),'','## Vozes',...Object.entries(m.byVoice).map(([a,b])=>`- ${a}: ${b}`),'','## Relações',...Object.entries(m.byRelation).map(([a,b])=>`- ${a}: ${b}`),'','## Tempo associado a cenários (estimado por seleção, pode não incluir todo raciocínio)',...m.branches.map(b=>`- ${b.title}: ${formatDuration(b.activeMs)}`),`- Sem cenário identificado: ${formatDuration(m.unassignedMs)}`,'','## Falácias marcadas pelo autor',...m.allFallacies.map(f=>`- Bloco ${f.nodeId}: ${FALLACIES[f.key]?.[0]||f.key} · ${FALLACY_STATUSES[f.status]}${f.note?` · ${f.note}`:''}`)];
 if(!m.allFallacies.length)lines.push('Nenhuma falácia anotada. Isso não significa ausência de falácias.');
 lines.push('','## Registro de sessões',...(r.sessions||[]).map((ss,i)=>`- Sessão ${i+1}: ${niceDate(ss.startedAt)} até ${niceDate(ss.endedAt)} · ${formatDuration(ss.activeMs)} ativos`),'','## Pausas registradas',...r.nodes.filter(n=>n.type==='pausa').map(n=>`- ${niceDate(n.createdAt)} · ${n.title||'Pausa'} · ${n.suggestedGap?'Sugerida retrospectivamente (não comprovada)':'Registrada voluntariamente'}`));
 lines.push('','Nota: tempo ativo conta apenas os períodos em que a página estava visível e sem ultrapassar o limite de inatividade. Não comprova quanto tempo você refletiu fora do app.');
 return lines.join('\n');
}
