// Idioma do reconhecimento, independente do idioma da interface (sempre PT-BR).
export const SPEECH_LANGUAGES = Object.freeze({
 'pt-BR':'Português (Brasil)',
 'en-US':'English (United States)',
 'en-GB':'English (United Kingdom)'
});
export function normalizeSpeechLanguage(value){
 const k=String(value||'').trim().toLowerCase();
 return {'pt-br':'pt-BR','pt':'pt-BR','en':'en-US','en-us':'en-US','en-gb':'en-GB'}[k]||'pt-BR';
}
export const isEnglishLanguage=value=>['en-US','en-GB'].includes(normalizeSpeechLanguage(value));
// Usado somente quando não há idioma explicitamente escolhido (edição manual).
// Se a evidência for ambígua, mantém o comportamento histórico em PT-BR.
export function guessThoughtLanguage(text){
 const t=` ${String(text||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-zà-ÿ']+/g,' ')} `;
 const en=/\b(i think|i believe|i feel|i would|i'm|i am|what if|but why|but what|because|however|let's|let me|for example|in my opinion|we should|i disagree|i agree|i need|no idea|maybe|perhaps|suppose that|imagine if|that's|you are|you don't|i don't|it means|could it|does this|do you)\b/g;
 const pt=/\b(eu acho|eu penso|eu sinto|eu acredito|mas e se|por que|porque|por exemplo|na minha opinião|na minha opiniao|talvez|vamos|você|voce|isso significa|não|nao|estou|sinto|depois|continuamos|imagine que)\b/g;
 const a=[...t.matchAll(en)].length, b=[...t.matchAll(pt)].length;
 return a>b && a>0?'en-US':'pt-BR';
}
