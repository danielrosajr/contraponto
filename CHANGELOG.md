# Histórico de versões

## v0.2.0 — Pensamento Livre (22/10/2026)

### Novidades
- **Minidicionário interativo:** 17 tipos de bloco, cinco classificações opcionais e sete tipos de conexão (incluindo a opção de não classificar). Pesquisa e definições com exemplos diretamente na edição.
- **Escrita livre assistida:** ao digitar, regras locais e explicáveis sugerem um tipo e a natureza do pensamento, apresentando motivo, confiança aproximada e alternativas. Sem IA, internet ou envio de dados; classificação manual permanece soberana.
- **Cinco novos tipos de bloco:** Comentário, Pausa/marcador, Concordância provisória, Metacomentário e Organização/roteiro.
- **Notas laterais reais:** anotações associadas a um bloco sem criar nós/conexões; adicionar, visualizar, remover, desfazer e exportar notas no Markdown/JSON/prompt.
- **Pausa e retomada:** botão para registrar pausa, marcar a reflexão como pausada e retomar o último marcador.
- **Debate mais natural:** ações Continuar e Responder não forçam mais um tipo de argumento; sugestões de perguntas ampliadas (sentimentos, consequências, ética, autonomia, transparência e consentimento).
- **Exemplo demonstrativo ampliado:** 15 blocos conectados, 16 ligações e uma nota lateral de exemplo.

### Compatibilidade
- Preserva e normaliza mapas da versão 0.1: títulos, vozes, posições, relações e tipos antigos.
- O formato de dados sobe para `schemaVersion: 2`. A importação aceita backups das versões anteriores.
- Atualiza cache offline do service worker para `contraponto-0.2.0` e inclui os novos módulos.

### Testes e limitações
- 14 testes automatizados de modelo, inferência e exportação.
- Verificação de sintaxe JS e referências de IDs estáticos.
- Teste visual/navegação automatizada bloqueado por política do Chromium no ambiente de geração; testar manualmente antes de divulgar como estável.
- Classificação por heurísticas pode errar em frases ambíguas, irônicas ou longas e **não verifica fatos nem emite juízos morais**.

## v0.1.0 — Primeiro Pensamento (22/10/2026)
- Editor visual conectado, vozes, histórico, armazenamento local, exportações e GitHub Pages.
