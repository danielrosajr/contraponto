// Detecção linguística conservadora de perguntas faladas, sem IA externa.
// Não detecta entonação nem garante que uma fala seja uma pergunta.
import {guessThoughtLanguage,isEnglishLanguage} from './language.js';

const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").trim();
const PATTERNS = {
  en: [
    /^(?:but\s+|so\s+|and\s+)?(?:why|who|what|which|where|when|how)(?:\s|$)/,
    /^(?:but\s+|so\s+|and\s+)?(?:do|does|did|can|could|would|should|will|is|are|am|was|were|have|has|had|may|might)(?:\s+(?:you|i|we|they|he|she|it|this|that|there|anyone|someone|everybody|people|my|your|our|the|a|an))\b/,
    /^(?:but\s+|so\s+|and\s+)?(?:don't|doesn't|isn't|aren't|wouldn't|couldn't|shouldn't)(?:\s+(?:you|we|they|he|she|it|this|that))\b/,
    /^(?:but\s+|so\s+|and\s+)?what if\b/,
    /^(?:but\s+|so\s+|and\s+)?(?:isn't that|does that mean|would that mean|don't you think|do you think|what about)\b/
  ],
  pt: [
    /^(?:mas\s+|entao\s+|e\s+)?(?:por que|porque|pra que|para que|qual|quais|quando|quem|onde|como|o que|que tipo de)\b/,
    /^(?:mas\s+|entao\s+|e\s+)?(?:voce acha que|voce acredita que|voce pensa que|voces acham que|sera que|seria possivel|tem como|e possivel|isso significa que|isso quer dizer que|nao seria|nao e|nao acha que|voce concorda|isso faz sentido|faz sentido)\b/,
    /^(?:mas\s+|entao\s+|e\s+)?(?:e se|e quanto a|e quanto ao)\b/
  ]
};

export function detectSpokenQuestion(input,language='auto'){
 const raw=String(input||'').trim();
 const lang=language==='auto'?guessThoughtLanguage(raw):language;
 const text=fold(raw).replace(/^[\s"“'«]+/,'');
 if(!text)return {question:false,confidence:'nenhuma',reason:'Sem texto',language:lang};
 const firstPart=text.split(/[.!?？\n]/)[0].trim();
 const found=(isEnglishLanguage(lang)?PATTERNS.en:PATTERNS.pt).some(p=>p.test(firstPart));
 return {question:found||/[?？]\s*$/.test(raw),confidence:found?'alta':(/[?？]\s*$/.test(raw)?'pontuação':'baixa'),reason:found?'Estrutura interrogativa identificada no começo da fala.':'Sem estrutura interrogativa confiável.',language:lang};
}

// Só altera frases sem pontuação interrogativa existente e sem múltiplas frases.
// Preserva o texto de quem falou, exceto o sinal final; revisão manual é sempre possível.
export function punctuateSpokenQuestion(input,language='auto'){
 const source=String(input||''); const trimmed=source.trim();
 if(!trimmed||/[?？!！]\s*$/.test(trimmed))return {text:source,changed:false,...detectSpokenQuestion(source,language)};
 const d=detectSpokenQuestion(trimmed,language);
 if(!d.question||d.confidence!=='alta'||/[.!?。！？]\s+\S/.test(trimmed))return {text:source,changed:false,...d};
 const tail=source.match(/\s*$/)?.[0]||'';
 const core=source.slice(0,source.length-tail.length).replace(/[.。]\s*$/,'').trimEnd();
 return {text:core+'?'+tail,changed:true,...d};
}
