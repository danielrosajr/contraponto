// Planejamento puro e reversível de sugestões em lote.
// Nunca altera o mapa recebido nem conclui que um pensamento é verdadeiro.
import {suggestThought} from './inference.js';

export function planBulkClassification(reflection) {
  const nodes=Array.isArray(reflection?.nodes)?reflection.nodes:[];
  const changes=[];
  let ignoredBlank=0, preservedFacts=0;
  for (const node of nodes) {
    const text=String(node?.content||'').trim();
    if (!text){ignoredBlank++;continue;}
    const suggestion=suggestThought(text);
    const before={type:node.type,classification:node.classification||''};
    // Um fato classificado manualmente não é removido pelo classificador,
    // que não dispõe de verificação de fontes.
    const classification=before.classification==='fato' ? 'fato' : (suggestion.classification||before.classification);
    if (before.classification==='fato')preservedFacts++;
    const after={type:suggestion.type||before.type,classification};
    if (before.type===after.type && before.classification===after.classification)continue;
    changes.push({id:node.id,before,after,confidence:suggestion.confidence,explanation:suggestion.explanation});
  }
  return {total:nodes.length,ignoredBlank,preservedFacts,changes};
}

// Resumo transparente do que foi de fato aplicado, e não apenas sugerido.
// Mantidos incluem blocos já adequados, sem texto e sugestões desmarcadas.
export function summarizeBulkClassification(plan, acceptedIds=[]) {
  const changes=Array.isArray(plan?.changes)?plan.changes:[];
  const candidates=new Set(changes.map(c=>c.id));
  const accepted=new Set(acceptedIds.filter(id=>candidates.has(id)));
  const total=Math.max(0,Number(plan?.total)||0);
  const changed=accepted.size;
  const suggested=changes.length;
  return {
    total,
    changed,
    unchanged:Math.max(0,total-changed),
    suggested,
    notSelected:Math.max(0,suggested-changed),
    alreadyUnchanged:Math.max(0,total-suggested),
    changedTypes:changes.filter(c=>accepted.has(c.id)&&c.before.type!==c.after.type).length,
    changedNatures:changes.filter(c=>accepted.has(c.id)&&c.before.classification!==c.after.classification).length,
    ignoredBlank:Math.max(0,Number(plan?.ignoredBlank)||0),
    preservedFacts:Math.max(0,Number(plan?.preservedFacts)||0)
  };
}
