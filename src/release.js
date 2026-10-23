export const APP_VERSION='0.5.1';
export const RELEASES=[
 {version:'0.5.1',name:'Debate Bilíngue',date:'23/10/2026',items:['Idioma selecionável por sessão: português brasileiro, inglês americano ou britânico.', 'Transcrição tenta utilizar a língua selecionada sem alterar os textos originais.', 'Classificação assistida e pistas de possíveis falácias ampliadas para textos em inglês.', 'Idioma preservado nos turnos, blocos convertidos, backups JSON e exportações.', 'Tutorial, painel de ajuda, relatórios e cache offline atualizados.']},
 {version:'0.5.0',name:'Debate ao Vivo',date:'23/10/2026',items:['Captura por voz com troca rápida entre perspectivas e novas vozes criadas durante a sessão.', 'Transcrição opcional do navegador e áudio salvo em IndexedDB separado dos backups JSON.', 'Pausar, retomar, encerrar e revisar a sessão; cada turno preserva texto e horário.', 'Conversão em blocos conectados com marcador 🎙, prévia editável e sugestões locais.', 'Tempo por voz, tempo de turno e estimativa de som detectado; suspeitas de falácia revisáveis.', 'Tutorial, relatórios, versões e exportações atualizados para o novo modo.']},
 {version:'0.4.0',name:'Apresentação Guiada',date:'23/10/2026',items:[
  'Apresentação HTML independente: leitura por etapas, ramificações, mapa e resumo imprimível em PDF.',
  'Marcadores pessoais de trechos para conversar e opções de privacidade antes de compartilhar.',
  'Novo prompt de análise crítica e sugestões de continuação importáveis após revisão.',
  'Motivo explícito de encerramento, separado da situação geral da reflexão.',
  'Tutorial guiado e histórico de novidades consultável em qualquer tela.']},
 {version:'0.3.1',name:'Leitura Guiada',items:['Modo leitura ampliado no PC e celular; navegação por setas e duplo clique.']},
 {version:'0.3.0',name:'Fio do Raciocínio',items:['Navegação por conexões, retomada, sessões e pausas, falácias, relatório e prompt de xadrez.']},
 {version:'0.2.2',name:'Feedback de Classificação',items:['Resumo e confirmação das sugestões aplicadas em lote.']},
 {version:'0.2.1',name:'Revisão em Lote',items:['Editor dentro da tela, classificações em lote e menus alfabéticos.']},
 {version:'0.2.0',name:'Pensamento Livre',items:['Minidicionário, classificação assistida, comentários e pausas.']},
 {version:'0.1.0',name:'Primeiro Pensamento',items:['Editor visual, conexões, salvamento local, histórico e exportações.']}
];
export const TOUR_STEPS=[
 {selector:'#newReflection',title:'1. Crie uma pergunta',description:'Tudo começa com uma pergunta. Você pode criar um debate pessoal sem cadastro ou servidor. Neste tutorial vamos usar a demonstração, sem precisar inventar um tema.',location:'library'},
 {selector:'#reflectionGrid',title:'2. Sua biblioteca privada',description:'As reflexões ficam neste navegador. Faça backups JSON antes de apagar dados, trocar de aparelho ou endereço do site.',location:'library'},
 {selector:'#graphViewport',title:'3. Seu mapa de pensamentos',description:'Cada bloco é uma ideia. Arraste para reorganizar, explore conexões com as setas e dê dois cliques para ler em tela ampliada.',location:'workspace'},
 {selector:'#readerOpenToolbar',title:'4. Modo Leitura',description:'Use este botão para acompanhar um pensamento de cada vez. A leitura é separada da edição para evitar arrastes acidentais.',location:'workspace'},
 {selector:'#addToolbar',title:'5. Construa o debate',description:'Acrescente uma pergunta, objeção, exemplo, emoção ou comentário. A classificação é uma sugestão, não um julgamento automático.',location:'workspace'},
 {selector:'#liveStartToolbar',title:'6. Debate ao Vivo',description:'Inicie a captura a partir de um bloco ou comece um novo trecho. Escolha PT-BR, EN-US ou EN-GB na criação; depois troque entre vozes com botões ou teclas 1–9, pause, finalize e converta as falas em blocos.',location:'workspace'},
 {selector:'#liveStartToolbar',title:'7. Idioma da conversa',description:'Na configuração da nova sessão ao vivo, escolha Português (Brasil), English (US) ou English (UK). As transcrições ficam no idioma original, e a classificação assistida reconhece expressões em ambos os idiomas.',location:'workspace'},
 {selector:'#exportBtn',title:'8. Compartilhe com controle',description:'Em Exportar você encontra a apresentação HTML. Confira as opções de privacidade antes de enviar a alguém.',location:'workspace'},
 {selector:'#finishBtn',title:'9. Concluir não é sempre responder',description:'Ao encerrar, indique se você chegou a uma conclusão, ficou sem resposta ou simplesmente precisa de uma pausa.',location:'workspace'},
 {selector:'#globalVersion',title:'10. Consulte o que mudou',description:'Este botão mostra a versão atual e o histórico de melhorias. Você pode reiniciar o tutorial a qualquer momento.',location:'workspace'}
];
