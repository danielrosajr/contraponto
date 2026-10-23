// English classification rules: transparent, conservative and entirely local.
// They indicate the FORM of an utterance, not its truth or logical validity.
const R=(type,re,reason,weight=1)=>({type,re,reason,weight});
export const EN_TYPE_RULES=[
 R('pausa',/\b(i need (a break|to rest|to stop)|let's (take a break|stop here|continue later)|we('ll| will) continue (later|tomorrow)|i('m| am) (tired|exhausted)|i have a headache|pause (for now|here)|let's call it a day)\b/,'Indica uma pausa ou ponto de retomada (em inglês).',8),
 R('meta',/\b(this (exercise|debate|discussion|reflection|argument map)|we('re| are) (debating|arguing)|what were we talking about|why (are you|do you) talk like|the point of this exercise|in this conversation)\b/,'Comentário sobre o próprio exercício ou diálogo.',7),
 R('roteiro',/\b(first (scenario|situation|point)|second (scenario|point)|let's (split|divide|organize|explore)|i('ll| will) (divide|list|explore)|three scenarios|two possibilities|points to discuss|step (one|two|three|[1-9]))\b/,'Organiza tópicos e etapas da reflexão.',6),
 R('retorno',/\b(back to (the|our|my) (point|question|topic)|returning to (the|our) (point|question)|getting back to (the|our) (question|topic))\b/,'Retorna explicitamente a um assunto anterior.',7),
 R('acordo',/\b(i (agree|accept) (for now|temporarily)|let's (accept|assume) (that )?(for now|temporarily)|i('ll| will) grant that for now|fair point,? for now)\b/,'Aceitação provisória, não necessariamente conclusão.',7),
 R('provisoria',/\b(for now,? (i conclude|my conclusion|i think)|my tentative conclusion|my provisional conclusion|so far (i conclude|it seems)|at this point (my conclusion|i conclude))\b/,'Conclusão explicitamente provisória.',7),
 R('final',/\b(my final conclusion|i (finally|definitively) conclude|my definitive answer|in conclusion,? i (believe|think))\b/,'Sinaliza uma conclusão atual.',6),
 R('objecao',/\b(i disagree|i object|that doesn't (follow|prove|mean)|but (why|how|what about|does that|isn't|wouldn't)|however,? that|the problem with that|you are assuming)\b/,'Levanta uma objeção ou dificuldade ao raciocínio.',6),
 R('contra',/\b(in response to that|that doesn't refute|my response is|what i actually meant|even so|on the other hand|but what i mean is)\b/,'Responde ou reformula uma objeção.',6),
 R('emocao',/\b(i (feel|felt|would feel) (sad|scared|afraid|angry|upset|confused|embarrassed|anxious|happy|ashamed|worried|uncomfortable|relieved)|i('m| am) (afraid|scared|anxious|sad|upset|angry|confused)|it makes me feel|i fear that|i'm worried)\b/,'Relato ou antecipação de uma emoção.',8),
 R('valor',/\b(i value|what matters to me|for me (honesty|freedom|trust|respect|autonomy) (is|means)|i care (deeply )?about (honesty|trust|freedom|autonomy)|i consider (honesty|respect|freedom) essential)\b/,'Nomeia valores ou princípios pessoais.',6),
 R('cenario',/\b(what if|imagine (if|that)|suppose (that|we)|let's say|in this scenario|hypothetically|if (she|he|they|i|we|you) (were|did|had|could|found|discovered))\b/,'Propõe um cenário hipotético ou alternativa.',7),
 R('exemplo',/\b(for example|for instance|as an example|to illustrate|consider this example|take the case of)\b/,'Usa uma situação para exemplificar.',7),
 R('premissa',/^(maybe|perhaps|it's possible|it might be)\b/,'Uma possibilidade que pode servir como ponto de partida.',3),
 R('comentario',/^(okay|ok|hmm|interesting|right|got it|sure|i see|well|anyway|no idea|let me think|fair enough)[.!…,\s]*$/,'Comentário curto sem nova afirmação argumentativa.',7),
 R('comentario',/\b(just a thought|just a comment|just an observation|thinking out loud|let me think|off topic|i'm not sure where i'm going)\b/,'Observação solta, sem necessidade de classificá-la como argumento.',5),
 R('argumento',/\b(because|the reason is|this shows that|the evidence (suggests|shows)|therefore|since (we|i|it|they)|this supports|that's why)\b/,'Apresenta motivo, justificativa ou evidência.',5),
 R('premissa',/\b(i (think|believe|assume|suppose|consider) (that|it|this|we|she|he)|i'd argue|i would argue|my starting point is|assuming that|given that|my premise is|i think (we|there|i))\b/,'Afirmação tomada como ponto de partida.',5),
 R('pergunta',/^(why|how|who|what|when|where|which|is it|are we|do you|does it|would it|could it|should i|can i|isn't it|doesn't it)\b/,'Começa com estrutura interrogativa.',6)
];
export const EN_CLASS_RULES=[
 R('verificar',/\b(i (heard|read) that|somebody told me|people say that|according to (a|the)|i need to verify|i need to check|i'm not sure if it's true|source says|studies (say|show))\b/,'Indica informação externa ainda a conferir.',7),
 R('sentimento',/\b(i (feel|felt|would feel) (sad|scared|afraid|angry|upset|confused|embarrassed|anxious|happy|ashamed|worried|uncomfortable|relieved)|i('m| am) (afraid|scared|anxious|sad|upset|angry|confused)|it makes me feel|i fear that)\b/,'Relato emocional, sem avaliar veracidade de fatos.',7),
 R('hipotese',/\b(maybe|perhaps|possibly|probably|what if|suppose|hypothetically|imagine if|might|could be|would happen|if (she|he|they|i|you|we) (were|did|had|could))\b/,'Hipótese, suposição ou possibilidade.',6),
 R('opiniao',/\b(in my opinion|i (think|believe|prefer) (that|it|this|we)|i('d| would) rather|to me (it's|it is)|i consider (this|that|it) (wrong|right|fair|unfair)|i'd argue)\b/,'Posição ou julgamento pessoal.',5),
 R('verificar',/\b(research shows|the data shows|according to studies)\b/,'Alega uma fonte: conferir antes de chamar de fato.',3)
];
