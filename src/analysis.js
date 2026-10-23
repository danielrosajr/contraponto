import {markdownFor} from './export.js';
import {TYPES,RELATIONS,CLASSES} from './model.js';

export const END_REASONS={pausa:'Parei para continuar depois',semresposta:'Terminei sem chegar a uma resposta',provisoria:'Cheguei a uma conclusão provisória',final:'Considerei a reflexão concluída'};
export const DISCUSSION_TAGS={conversar:'Quero conversar sobre isso',pendente:'Não consegui responder',incomoda:'Esse pensamento me incomodou',mudanca:'Mudei de opinião aqui',sentimento:'Quero entender melhor o que senti'};
export const ANALYSIS_VERSION='0.4.0';
export function discussionSummary(r){
 const voice=id=>r.voices.find(v=>v.id===id)?.name||'Sem voz';
 const points=r.nodes.filter(n=>n.discussion?.length);
 const asks=r.nodes.filter(n=>['pergunta','objecao'].includes(n.type));
 const emotions=r.nodes.filter(n=>n.type==='emocao'||n.classification==='sentimento');
 const conclusions=r.nodes.filter(n=>['provisoria','final'].includes(n.type));
 const lines=[`# Para conversar — ${r.title}`,`**Pergunta que motivou a reflexão:** ${r.question}`,
  `**Descrição fornecida por mim:** ${r.description||'Não registrada.'}`,
  `**Situação atual:** ${r.status}`,
  `**Como encerrei a última sessão:** ${r.closure?END_REASONS[r.closure.kind]||r.closure.kind:'Não registrado.'}`,
  ...(r.closure?.note?[`**Observação de encerramento:** ${r.closure.note}`]:[]),
  '', '## Trechos que marquei para conversar',
  ...(points.length?points.flatMap(n=>[
   `### ${n.title||TYPES[n.type]?.[0]||'Pensamento'} (${n.id})`,
   `- Voz: ${voice(n.voiceId)} · Tipo: ${TYPES[n.type]?.[0]||n.type}`,
   `- Texto original: ${n.content}`,
   ...(n.discussion||[]).map(d=>`- ★ ${DISCUSSION_TAGS[d.key]||d.label||d.key}${d.note?' — '+d.note:''}`)
  ]):['Nenhum trecho marcado até agora.']),
  '', '## Emoções registradas ou antecipadas',
  ...(emotions.length?emotions.map(n=>`- ${voice(n.voiceId)} (${n.id}): ${n.content}`):['Nenhuma emoção foi classificada explicitamente. Isso não prova ausência de emoções.']),
  '', '## Conclusões escritas por mim',
  ...(conclusions.length?conclusions.map(n=>`- ${n.id}: ${n.content}`):['Nenhuma conclusão registrada.']),
  '', '## Questões e objeções escritas',
  ...(asks.length?asks.map(n=>`- ${n.id}: ${n.content}`):['Nenhuma pergunta ou objeção adicional registrada.']),
  '', '---',
  'Este é um resumo de trechos registrados pelo autor, NÃO uma avaliação psicológica ou interpretação automática. Para ler o raciocínio completo, consulte a apresentação guiada.'];
 return lines.join('\n');
}
export function analysisPrompt(r,{audience='technical'}={}){
 const core=`# CONTRAPONTO — Análise aprofundada de raciocínio (${ANALYSIS_VERSION})
Você receberá um mapa de um debate interno, com IDs, vozes, tipos, conexões, classificações, pausas, notas, marcações de falácia e pontos para conversar.

Sua função é investigar criticamente COMO o pensamento se desenvolveu, não determinar quem está certo, julgar o caráter do autor ou produzir diagnósticos.

REGRAS:
- Preserve o contexto e cite os IDs dos blocos para sustentar achados importantes.
- Diferencie crenças assumidas, hipóteses exploratórias, provocações, sentimentos, comentários, encerramentos e conclusões.
- Uma voz interna é uma perspectiva de escrita; não é personalidade independente. A voz crítica também pode errar.
- Não trate hipóteses como fatos: sentimentos não são erros lógicos, nem emoções são falácias. Não atribua ao autor opiniões que ele apenas testou.
- Distinga observações EXPLÍCITAS, interpretações INFERIDAS e hipóteses ainda NÃO VERIFICADAS. Indique interpretação alternativa relevante.
- Não deduza, sem suporte, traumas, diagnósticos, motivações inconscientes, intenções alheias ou eventos reais.
- Ao analisar falácias anotadas pelo autor, dê um parecer individual (sustentada / questionável / incorreta / dados insuficientes) e justifique. Não invente falácias.
- Comentários, pausas, roteiros e metacomentários podem ser parte do processo sem funcionar como argumentos.
- Encerramento por cansaço, pausa ou ausência de resposta NÃO constitui conclusão.
- Não apresente análises clínicas nem substitua um profissional de saúde.

SEÇÕES:
1. Reconstrução fiel da pergunta, dos cenários e das conexões, com as conclusões realmente registradas.
2. Evolução do pensamento: refinamentos, objeções reconhecidas, revisões e dúvidas (não confundir hesitação com mudança de crença).
3. Mudanças de assunto: identificar IDs de transição, digressões relevantes e linhas abandonadas.
4. Argumentos e suas premissas; consequências que de fato decorrem delas e lacunas.
5. Falácias possíveis: revisão individual de CADA marcação do autor e erros adicionais plausíveis, com justificativa.
6. Contradições reais versus mudanças de opinião, ambiguidades, contextos distintos e ambivalências.
7. Valores em tensão, apresentados como interpretações e NÃO características psicológicas comprovadas.
8. Comparação justa entre as vozes: respostas efetivas, caricaturas e questões evitadas por cada uma.
9. Perguntas pendentes, objeções pendentes e sem resposta, hipóteses sem confirmação e cenários não desenvolvidos.
10. Interpretações alternativas que também possam contestar SUA análise.
11. Síntese provisória: separar a conclusão EFETIVA do autor de sua sugestão de reformulação.
12. Próximos passos: de 3 a 5 novos blocos curtos, de diferentes tipos, com a conexão e ID de origem.
13. Resumo acessível para discussão com profissional: objetivo declarado, progressão, emoções expressas/antecipadas, valores em tensão, perguntas abertas e trechos indicados pelo autor, sem diagnósticos.

Para cada interpretação relevante, sinalize EXPLÍCITO / INFERIDO / HIPOTÉTICO e cite IDs.

Ao final, adicione exclusivamente um bloco de código JSON válido com chave "suggestions", em que cada item tenha exatamente estas chaves:
{"sourceId":"id real do bloco no mapa","type":"pergunta","relation":"continua","text":"Texto do novo pensamento sugerido"}
Use somente tipos válidos: ${Object.keys(TYPES).join(', ')}.
Use somente relações válidas: ${Object.keys(RELATIONS).join(', ')}.
Não invente IDs: sourceId deve existir no mapa. Cada sugestão é PROPOSTA, nunca uma mudança automática do debate.

--- INÍCIO DO MAPA ---
${markdownFor(r)}
--- FIM DO MAPA ---`;
 if(audience==='therapy')return `# Pedir resumo para conversa terapêutica\nCrie um resumo acessível de até uma página, sem diagnósticos, preservando o que o autor realmente disse. Diferencie hipóteses de fatos e sentimentos de crenças, destaque marcadores para conversar, atribua as interpretações à IA e não ao autor. Utilize citações por ID. Não pressuponha consentimento para compartilhar este texto com terceiros.\n\n${core}`;
 return core;
}
export function parseNextSteps(text,r){
 let source=String(text||'').trim();const fenced=[...source.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(m=>m[1].trim());let data;
 for(const part of [...fenced,source]){try{data=JSON.parse(part);break;}catch{}}
 if(!data)throw Error('Não encontrei JSON válido. Copie somente o bloco JSON de sugestões gerado pela IA.');
 const entries=Array.isArray(data)?data:data?.suggestions;
 if(!Array.isArray(entries))throw Error('O JSON deve conter um array "suggestions".');
 if(entries.length>20)throw Error('O limite é 20 sugestões por importação.');
 const ids=new Set(r.nodes.map(n=>n.id));let rejected=0;
 const suggestions=entries.map((x,i)=>{
  if(!x||!ids.has(x.sourceId)||!TYPES[x.type]||!RELATIONS[x.relation]||typeof x.text!=='string'||!x.text.trim()){rejected++;return null;}
  return {index:i,sourceId:x.sourceId,type:x.type,relation:x.relation,text:x.text.trim().slice(0,30000)};
 }).filter(Boolean);
 return {suggestions,rejected};
}
