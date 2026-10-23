# Changelog — CONTRAPONTO

## [0.5.2] — 23/10/2026 · Perguntas e Destaques

- No Debate ao Vivo, frases interrogativas em português e inglês passam a ser identificadas mesmo quando o reconhecimento de fala não fornece `?`.
- Ao terminar cada turno ou pausar a sessão, o aplicativo adiciona `?` **somente em perguntas com estrutura linguística clara**, com opção de correção manual e botão **? É pergunta**.
- A classificação local de blocos passa a considerar perguntas não pontuadas, inclusive no processo de conversão de Debate ao Vivo para mapa.
- Depois de classificar vários blocos, o app mostra por **30 segundos** os blocos alterados com borda realçada, diferença riscada `antes → depois` de tipo e/ou natureza e um botão para encerrar o destaque.
- Alterações visuais não alteram textos, relações, backup, voz ou histórico. Revisão e desfazer do lote foram preservados.
- Tutorial guiado, ajuda do Debate ao Vivo, cache offline, testes, documentação e versão visível atualizados.
- Limite conhecido: sem análise de entonação ou IA semântica, frases ambíguas continuam exigindo revisão humana.

## [0.5.1] — 23/10/2026 · Debate Bilíngue

### Novo
- Seletor por sessão: `pt-BR`, `en-US` e `en-GB`, mantendo a interface em português.
- Reconhecimento de fala configurado para o idioma selecionado, sujeito à disponibilidade do navegador.
- Classificador local em inglês: perguntas, cenários, premissas, objeções, argumentos, emoções, comentários e pausas.
- Pistas em inglês de possíveis generalizações, falsos dilemas e respostas *tu quoque* (sem diagnóstico automático de falácias).
- Idioma salvo em sessões, turnos e blocos convertidos, e mantido em backup e exportações textuais.
- Preferência de idioma lembrada no próprio navegador para a próxima sessão.
- Tutorial e ajuda do modo ao vivo atualizados; cache offline `contraponto-0.5.1`.

### Compatibilidade e cuidados
- Backups sem idioma continuam compatíveis (padrão `pt-BR`).
- Um idioma por sessão; a alternância automática no meio da fala não é suportada.
- A transcrição automática pode depender de processamento externo. O áudio original nunca é traduzido.
- Testes automatizados e de interface simulada; validar microfone e transcrição em aparelhos reais.

---

# CONTRAPONTO — Histórico de versões

## v0.5.0 — Debate ao Vivo (23/10/2026)

- 🎙 Modo Debate ao Vivo dentro da mesma reflexão, iniciado de um bloco selecionado ou como novo trecho.
- Alternância imediata entre as três perspectivas iniciais, mais vozes adicionadas enquanto o debate acontece; atalhos 1–9 para as primeiras nove.
- Gravação de áudio local **opcional** com MediaRecorder e armazenamento em IndexedDB separado do backup JSON; download, reprodução aproximada de trechos e exclusão de áudio.
- Transcrição automática **opcional**, dependente da SpeechRecognition do navegador; quando não há suporte, registro manual por texto permanece disponível.
- Texto da conversa salvo progressivamente, com registro de horários, voz, períodos de turno e indicação de som detectado quando há microfone capturado.
- Pausar, retomar e encerrar com motivos diferentes (interrompido, sem resposta, provisório ou concluído).
- Conversão revisável da transcrição em blocos do mapa, com sugestão de tipos e relações, preservação de voz e horário e marcador especial 🎙 de origem ao vivo.
- Marcação voluntária de possíveis falácias em cada fala e sinais fracos por palavras-chave, sem gerar veredictos automáticos.
- Relatórios e Markdown exportado incluem as capturas e os tempos por voz; tempo ativo do aplicativo e duração dos turnos permanecem separados para evitar somas duplicadas.
- Tutorial guiado expandido com etapa de Debate ao Vivo e ajuda contextual na tela de captura.
- Migração de armazenamento IndexedDB v1 → v2, schema lógico v5; compatibilidade com dados dos backups anteriores.
- Testes automatizados e de interface simulada ampliados; atualização do cache offline.

### Avisos de privacidade e limites

- O reconhecimento de fala **pode enviar áudio a serviços externos do navegador**; requer ativação explícita e pode não funcionar offline ou em todos os aparelhos.
- O áudio local não é criptografado, pode ocupar bastante armazenamento e **não viaja no backup JSON**. Baixe gravações importantes separadamente.
- A detecção de voz por volume não diferencia voz humana de ruído. Sem gravação, o sistema mostra tempo de turno, não tempo falado real.
- A gravação em abas de fundo pode ser interrompida pelo sistema operacional; ao ocultar a página, esta versão pausa a sessão por segurança.

## [0.4.0] — Apresentação Guiada (23/10/2026)

### Novidades
- **Exportação HTML independente (offline):** História guiada responsiva, seleção de ramificações, mapa clicável, resumo, índice cronológico e impressão/salvamento como PDF pelo navegador. Sem API, CDN, servidor ou rastreamento. Prévia isolada antes do download.
- **Controle de compartilhamento:** nomes de vozes podem ser substituídos por perspectivas numeradas; notas/contexto privado e marcações de possíveis falácias ficam fora do HTML por padrão. O conteúdo dos blocos NÃO é anonimizado automaticamente — exige revisão manual.
- **Pontos para conversar:** cinco motivos para marcar blocos, com notas opcionais; visíveis no inspetor, Modo Leitura, Markdown, resumo para sessão e apresentação.
- **Resumo para sessão:** arquivo Markdown construído a partir de trechos efetivamente escritos e marcados, sem inventar interpretação ou diagnóstico; novo prompt voltado a relato para uma IA externa.
- **Prompt de análise técnica revisto:** pede análise das diferentes vozes com IDs, premissas, objeções, falácias marcadas, evolução, mudanças de assunto e interpretações alternativas. Distingue explícito / inferido / hipotético.
- **Importação de sugestões da IA:** cole um objeto JSON `suggestions` com `sourceId`, `type`, `relation` e `text`. Prévia, seleção manual, criação de novos blocos e desfazer em lote. Não envia dados à IA.
- **Encerramento justificado:** pausa, sem resposta, conclusão provisória e conclusão final, com observação opcional e registro histórico separado do status da reflexão.
- **Tutorial guiado:** oito passos sobre a biblioteca, mapa, leitor, criação, compartilhamento, encerramento e novidades; pode ser reiniciado.
- **Controle de versão:** badge v0.4.0 no topo abre changelog legível com histórico de todas as versões; indicador de novidade após a atualização.
- **Persistência:** schemaVersion 4 normaliza novos campos sem destruir dados das versões antigas. Cache offline passa para `contraponto-0.4.0`.

### Observações
- O HTML contém os dados que você decidir exportar. Um arquivo repassado pode ser lido por qualquer pessoa que o tenha; não existe expiração ou revogação.
- PDF é obtido pelo botão **Imprimir/PDF** no HTML. Não existe biblioteca nativa de criação de PDF nem garantia de abertura de HTML em anexos de todos os aplicativos de celular.
- A IA não é executada no aplicativo. Análises e sugestões dependem de copiar conteúdo voluntariamente para um serviço externo.

## [0.3.1] — Leitura Guiada
- Modo leitura ampliado, navegação por setas, escolha de ramificações e duplo clique para ler.

## [0.3.0] — Fio do Raciocínio
- Navegação por conexões, retomada, tempos e sessões, pausas retrospectivas, falácias, relatório e prompt de xadrez.

## [0.2.2] — Feedback de Classificação
- Resumo de alterações e toast após aplicar sugestões a todos os blocos.

## [0.2.1] — Revisão em Lote
- Modal responsivo, menus em ordem alfabética e revisão coletiva de classificações.

## [0.2.0] — Pensamento Livre
- Minidicionário, classificação assistida local, comentários, pausas e notas laterais.

## [0.1.0] — Primeiro Pensamento
- Biblioteca, editor visual, vozes, provocações, exportações, IndexedDB e PWA.
