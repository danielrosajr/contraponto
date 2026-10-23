# Histórico de versões — CONTRAPONTO

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
