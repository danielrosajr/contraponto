// Glossário local: definições curtas, exemplos e ressalvas. Nenhum serviço externo.
export const GLOSSARY = {
  types: {
    aovivo: ['Debate ao Vivo','Marcador que indica uma sessão capturada por voz ou texto. Seus blocos seguintes podem ser transcrições convertidas e revistas.','Uma conversa ao vivo continua a linha anterior.'],
    pergunta: ['Pergunta','Algo que você quer entender ou responder.','O que eu sentiria se isso acontecesse?'],
    premissa: ['Premissa','Ideia adotada como ponto de partida de um raciocínio; pode precisar ser verificada.','Talvez conhecer uma situação mude minha reação.'],
    argumento: ['Argumento','Razão oferecida para sustentar uma afirmação.','Porque uma informação pode mudar minhas decisões.'],
    objecao: ['Objeção','Questionamento ou dificuldade apresentada contra uma ideia.','Mas isso vale mesmo quando existem consequências?'],
    contra: ['Contra-argumento','Resposta que tenta rebater uma objeção ou outro argumento.','Mesmo assim, sentir algo e sofrer efeitos são coisas diferentes.'],
    exemplo: ['Exemplo','Situação concreta ou ilustrativa que ajuda a explicar uma ideia.','Imagine alguém recebendo uma notícia inesperada.'],
    cenario: ['Cenário','Possibilidade real ou imaginada que você deseja explorar: um “e se...?”.','E se eu descobrisse a situação só meses depois?'],
    emocao: ['Emoção','Reação emocional como medo, alegria, raiva, confusão ou tristeza.','Eu sentiria medo de perder a confiança.'],
    valor: ['Valor pessoal','Princípio que importa para você, como respeito, honestidade ou liberdade.','Eu valorizo autonomia e sinceridade.'],
    provisoria: ['Conclusão provisória','Resposta atual que ainda está aberta a revisão.','Por enquanto, penso que desconhecer muda meu sofrimento imediato.'],
    final: ['Conclusão final','Síntese que você considera satisfatória agora, sem impedir futuras revisões.','Depois de comparar os cenários, concluo que...'],
    retorno: ['Retorno ao tema','Ponto usado para reconectar uma digressão à questão principal.','Voltando à pergunta inicial...'],
    comentario: ['Comentário','Observação solta, frase de passagem, brincadeira ou fala que não precisa defender uma ideia.','Certo, deixa eu pensar um pouco.'],
    pausa: ['Pausa / marcador','Registra interrupção e o próximo passo para retomar o pensamento depois.','Estou cansado; retomar amanhã a questão do consentimento.'],
    acordo: ['Concordância provisória','Aceitação temporária de um ponto, ainda sujeita a revisão.','Por enquanto, aceito esse ponto e quero testar outro cenário.'],
    meta: ['Metacomentário','Comentário sobre o próprio debate, método ou exercício, e não sobre o tema debatido.','Por que estamos falando como se fôssemos duas pessoas?'],
    roteiro: ['Organização / roteiro','Apresenta tópicos ou etapas que você deseja percorrer.','Vou analisar três situações diferentes.']
  },
  classes: {
    '': ['Não classificado','Você ainda não decidiu a natureza desta frase. Tudo bem deixar em aberto.','Use quando não tiver certeza.'],
    fato: ['Fato','Afirmação que pode, em princípio, ser verificada por evidências.','A reunião aconteceu ontem (se houver registro).'],
    opiniao: ['Opinião','Juízo, avaliação ou preferência pessoal.','A honestidade é muito importante para mim.'],
    hipotese: ['Hipótese','Possibilidade ou explicação a ser explorada, sem afirmá-la como fato.','Talvez eu reagisse de outra maneira.'],
    sentimento: ['Sentimento','Relato da sua experiência emocional, não um teste de verdade ou falsidade lógica.','Sinto insegurança quando imagino isso.'],
    verificar: ['Informação a verificar','Afirmação externa cuja origem ou comprovação você ainda precisa checar.','Ouvi dizer que isso é proibido por lei.']
  },
  relations: {
    continua: ['Continua','Desenvolve o pensamento anterior.','Uma ideia segue para a próxima.'],
    apoia: ['Apoia','Oferece motivos ou evidências a favor da ideia.','Este exemplo reforça minha premissa.'],
    contesta: ['Contesta','Questiona ou se opõe à ideia anterior.','Será que a premissa vale sempre?'],
    depende: ['Depende de','Indica uma condição necessária ou relevante.','Minha resposta muda conforme o contexto.'],
    exemplifica: ['Exemplifica','Mostra uma situação que ilustra o pensamento.','E se isso acontecesse com outra pessoa?'],
    reformula: ['Reformula','Expressa uma ideia anterior com mais precisão ou de outra forma.','Não é ausência de efeitos; é ausência de sofrimento consciente.'],
    retorna: ['Retorna a','Liga uma ramificação a um pensamento anterior.','Agora volto à pergunta inicial.']
  }
};
export const GLOSSARY_GROUPS = [['types','Tipos de bloco'],['classes','Natureza da frase'],['relations','Tipos de conexão']];
export const definition = (group,id)=>GLOSSARY[group]?.[id]||null;
