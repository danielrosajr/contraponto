// Rótulos de autoavaliação, não diagnósticos automáticos de falácias.
export const FALLACIES={
 ad_hominem:['Ad hominem','Atacar a pessoa em vez do argumento.'],
 apelo_autoridade:['Apelo indevido à autoridade','Usar uma autoridade como prova suficiente sem avaliar evidências.'],
 apelo_emocao:['Apelo indevido à emoção','Usar emoção no lugar de justificativa relevante.'],
 causa_falsa:['Causa falsa','Confundir correlação ou sucessão temporal com causalidade.'],
 circular:['Raciocínio circular','Usar a conclusão como justificativa dela própria.'],
 dilema_falso:['Falso dilema','Apresentar apenas duas opções quando há alternativas.'],
 espantalho:['Espantalho','Distorcer a ideia alheia para facilitar o ataque.'],
 generalizacao:['Generalização precipitada','Concluir sobre um grupo a partir de poucos casos.'],
 ladeira:['Ladeira escorregadia','Supor uma cadeia extrema de consequências sem sustentação.'],
 non_sequitur:['Conclusão que não decorre','Tirar conclusão que não se segue das premissas.'],
 peticao:['Petição de princípio','Pressupor aquilo que deveria ser demonstrado.'],
 tu_quoque:['Tu quoque','Responder à crítica apontando suposta incoerência de quem a fez.'],
 outra:['Outra / não sei','Registrar suspeita sem forçar um rótulo.']
};
export const FALLACY_STATUSES={suspeita:'Suspeita',confirmada:'Identificada por mim',descartada:'Descartada após revisão'};
export function validFallacies(items){return Array.isArray(items)?items.slice(0,60).filter(x=>x&&FALLACIES[x.key]).map(x=>({id:String(x.id||'').slice(0,130),key:x.key,status:FALLACY_STATUSES[x.status]?x.status:'suspeita',note:String(x.note||'').slice(0,4000),createdAt:x.createdAt||new Date().toISOString()})):[];}
