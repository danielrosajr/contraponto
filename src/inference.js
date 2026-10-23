import {EN_TYPE_RULES,EN_CLASS_RULES} from './inference-en.js';
import {guessThoughtLanguage,isEnglishLanguage} from './language.js';
// Heurísticas transparentes e locais. Sugestões, nunca classificação factual/ética automática.
// Não classificam se uma ideia é verdadeira, correta, saudável ou moralmente aceitável.
const has=(t,re)=>re.test(t);
const normalize = text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const matches=(text,rules)=>rules.filter(rule=>has(text,rule.re));
const R = (type,re,reason,weight=1)=>({type,re,reason,weight});
const TYPE_RULES = [
 R('pausa',/\b(estou cansad[oa]|estamos cansad[oa]|dor de cabeca|preciso descansar|vou parar por hoje|pausa por (hoje|agora)|depois (continuamos|eu continuo)|retomar (amanha|depois)|continuar amanha|paramos por aqui)\b/, 'O texto indica uma interrupção ou ponto de retomada.',7),
 R('meta',/\b(esse exercicio|este exercicio|estamos discutindo|qual era o assunto|do que falavamos|nos somos o mesmo|porque (voce|vc) fala|sobre o debate|sobre esta reflexao|meu raciocinio|esse mapa|o argumento em si)\b/, 'O texto comenta o próprio exercício ou conversa.',6),
 R('roteiro',/\b(vou (dividir|analisar|separar|explorar)|vamos (dividir|analisar|separar)|primeir[oa] (cenario|situacao)|situacao 1|cenario 1|tres situacoes|duas possibilidades|alguns cenarios|etapa (1|2|3)|pontos a discutir)\b/, 'Você está organizando caminhos ou etapas.',6),
 R('retorno',/\b(voltando (a|ao|aquela)|retomando (o|a) (ponto|pergunta|tema)|retorno (a|ao) tema|de volta (a|ao) assunto)\b/, 'O texto indica retorno a um assunto anterior.',6),
 R('acordo',/\b(concordo (por enquanto|temporariamente)|aceito (temporariamente|por enquanto)|por enquanto aceito|irei aceitar temporariamente|vou aceitar (por enquanto|temporariamente)|vamos assumir por enquanto|ok,? (aceito|concordo))\b/, 'Há concordância explicitamente temporária.',6),
 R('provisoria',/\b(por enquanto,? (concluo|acredito|penso)|minha conclusao provisoria|a conclusao que tiro por agora|parece que podemos concluir|ate aqui concluo)\b/, 'Você está resumindo uma posição ainda revisável.',6),
 R('final',/\b(conclusao final|minha resposta definitiva|ao final concluo|concluo definitivamente)\b/, 'O texto sinaliza uma conclusão atual.',5),
 R('objecao',/\b(mas (isso|e|se|por que|porque|como)|isso nao (explica|prova|demonstra)|nao necessariamente|porem essa ideia|qual exatamente e o problema)\b/, 'O texto apresenta uma contestação ou dificuldade.',3),
 R('contra',/\b(mesmo assim|em resposta|por outro lado|mas o que quero dizer|isso nao refuta|na verdade quis dizer)\b/, 'O texto parece responder a uma objeção.',3),
 R('emocao',/\b(eu (me )?(sinto|sentiria)|estou (triste|feliz|confus[oa]|assustad[oa])|fico (triste|ansios[oa]|alegre)|tenho (medo|vergonha|raiva|receio)|me deixa (triste|feliz|nervos[oa]))\b/, 'Há uma descrição explícita de reação emocional.',6),
 R('valor',/\b(para mim (e|eh) importante|eu valorizo|considero essencial|meu valor|respeito (e|eh) importante|honestidade (e|eh) importante)\b/, 'O texto nomeia um princípio ou valor pessoal.',4),
 R('cenario',/\b(imagine que|imaginemos|suponha que|e se (um dia|acontecesse|ela|ele|eu|voce|a situacao)|num cenario|nesse cenario|caso (ela|ele|isso)|hipoteticamente|situacao [1-9])\b/, 'O texto apresenta uma situação alternativa ou imaginada.',5),
 R('exemplo',/\b(por exemplo|como exemplo|um exemplo seria|isso acontece quando|imagine uma pessoa)\b/, 'O texto ilustra uma ideia com um exemplo.',5),
 R('comentario',/^(bom|certo|ok|enfim|entendi|hmm|hum|sim|nao sei|deixa eu pensar|continue|continuando|pois e|beleza|interessante)[.!…,\s]*$/,'Parece uma fala breve sem nova afirmação argumentativa.',6),
 R('comentario',/\b(era so um comentario|pensamento solto|so uma observacao|sem relacao direta|deixa eu pensar|hum,? nao sei)\b/,'Parece um comentário ou uma observação solta.',4),
 R('argumento',/\b(porque|pois|uma razao|isso demonstra|a evidencia|sustenta a ideia|ja que)\b/,'O texto apresenta uma justificativa ou motivo.',3),
 R('premissa',/\b(eu parto (da ideia|do pressuposto)|considerando que|assumindo que|a principio|pressuponho que|eu penso que|eu acho que|eu acredito que|a ideia e que|considero que)\b/,'O texto apresenta uma afirmação que pode servir de ponto de partida.',4),
 R('pergunta',/^(por que|porque|como|qual|quais|quando|quem|onde|sera que|seria|deveria|isso significa|mas e se|e se|o que|tem como)\b/,'O texto começa como uma pergunta.',5)
];
const CLASS_RULES=[
 R('verificar',/\b(ouvi dizer|dizem que|li que|li na internet|vi na internet|preciso verificar|sera verdade que|nao tenho fonte|alguem disse que)\b/,'Você sinalizou uma informação externa ainda não conferida.',6),
 R('sentimento',/\b(eu (me )?(sinto|sentiria)|sinto (medo|raiva|tristeza|alegria|vergonha)|tenho (medo|vergonha|receio)|fico (triste|feliz|ansios[oa]|nervos[oa])|me deixa (triste|feliz|nervos[oa]))\b/,'É um relato emocional em primeira pessoa.',6),
 R('hipotese',/\b(talvez|possivelmente|provavelmente|poderia|pode ser que|e se|supondo que|imagine que|hipoteticamente|nesse cenario|eu sentiria|seria se)\b/,'O texto apresenta possibilidade ou suposição.',5),
 R('opiniao',/\b(eu acho|na minha opiniao|considero (bom|ruim|errado|certo|melhor|pior|importante)|eu prefiro|para mim|eu acredito|na minha visao)\b/,'Há um julgamento ou posição pessoal.',4),
 R('verificar',/\b(segundo (o|a)|os dados mostram|foi registrado|o documento comprova|a pesquisa mediu)\b/,'Parece mencionar uma fonte; verifique a evidência antes de classificar como fato.',2)
];
function evaluate(text,rules,defaultType){const matchesList=matches(text,rules),scores=new Map();
 for(const rule of matchesList){const item=scores.get(rule.type)||{type:rule.type,score:0,reasons:[]};item.score+=rule.weight;item.reasons.push(rule.reason);scores.set(rule.type,item);}
 const arr=[...scores.values()].sort((a,b)=>b.score-a.score);return arr.length?arr:[{type:defaultType,score:0,reasons:['Não há pistas fortes; escolha livremente o tipo que melhor descreve sua intenção.']}];}
export function suggestThought(input,locale='auto'){const original=String(input||'').trim(),t=normalize(original);
 const lang=locale==='auto'?guessThoughtLanguage(original):locale;
 const typeRules=isEnglishLanguage(lang)?EN_TYPE_RULES:TYPE_RULES;
 const classRules=isEnglishLanguage(lang)?EN_CLASS_RULES:CLASS_RULES;
 if(!t)return {type:null,classification:null,confidence:'sem texto',explanation:'Escreva algo para receber sugestões.',alternatives:[]};
 const types=evaluate(t,typeRules,'comentario');
 if(types[0]?.score===0 && t.split(/\s+/).length>=9 && !/[?？]\s*$/.test(original)){
   types[0]={type:'premissa',score:1,reasons:['Frase declarativa extensa sem pistas específicas: pode servir como ponto de partida. Também pode ser apenas um comentário.']};
   types.push({type:'comentario',score:0,reasons:['Observação livre, caso não deseje formular uma afirmação.']});
 }
 // Um ponto de interrogação final sugere pergunta, exceto quando prevalece uma regra mais explícita.
 if(/[?？]\s*$/.test(original) && !(isEnglishLanguage(lang)&&/^what if\b/i.test(original))){const p=types.find(r=>r.type==='pergunta');if(p){p.score+=4;p.reasons.push('A frase termina com ponto de interrogação.');}else types.push({type:'pergunta',score:5,reasons:['A frase termina com ponto de interrogação.']});types.sort((a,b)=>b.score-a.score);}
 const classes=evaluate(t,classRules,'');
 const best=types[0];return {type:best.type,classification:classes[0].type,confidence:best.score>=6?'forte':best.score>=3?'moderada':'fraca',explanation:best.reasons[0],classificationExplanation:classes[0].reasons[0],alternatives:types.slice(1,4).map(x=>x.type)};
}
