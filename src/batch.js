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
