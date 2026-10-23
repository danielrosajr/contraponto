# CONTRAPONTO — Meu Laboratório de Pensamentos

**Versão:** `v0.2.2 — Feedback de Classificação` · **Licença:** MIT · **Plataforma:** Web/PWA estática · **Idioma:** português brasileiro

Um mapa visual, local e privado para raciocinar, debater perspectivas, explorar possibilidades e registrar sentimentos, perguntas, comentários, pausas e conclusões. **Sem cadastro, backend, chaves de API ou bibliotecas externas**. Implementação em JavaScript modular, CSS, SVG e IndexedDB.

## Começar no Ubuntu

```bash
unzip CONTRAPONTO-v0.2.2.zip
cd CONTRAPONTO-v0.2.2
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Não abra o HTML diretamente pelo explorador de arquivos (`file://`); os módulos, o IndexedDB e a PWA exigem um servidor HTTP local ou HTTPS. Offline após o primeiro carregamento bem-sucedido e cache do service worker instalado.

## Melhorias da v0.2.2 — Confirmação de classificações

Depois de abrir uma reflexão, use **Ferramentas → Organizar → Aplicar sugestões a todos os blocos**. Revise as sugestões e marque quais serão aceitas. Ao clicar **Aplicar N sugestões**, o app abre um **resumo imediato**:

- **Analisados:** todos os blocos presentes na reflexão (inclusive blocos sem texto).
- **Alterados:** blocos cujas sugestões foram efetivamente aceitas e aplicadas; alterar tipo e natureza no mesmo bloco conta **uma única vez**.
- **Mantidos:** todos os demais blocos, seja por já estarem adequados, não terem sugestão ou terem sido desmarcados.
- **Detalhamento:** informa tipos e naturezas modificados, sugestões não selecionadas, blocos sem texto e fatos preservados (quando houver).

Exemplo: 15 analisados, 10 alterados, 5 mantidos. **Não confundir quantidades sugeridas com quantidades realmente aplicadas.** Se nada precisar mudar, o resumo mostra **0 alterados** e o total mantido. Depois de fechar o resumo, aparece um **toast** de confirmação com os mesmos totais, sem encobrir os botões de revisão. O **Desfazer lote** permanece disponível para recuperar a classificação anterior.

- Não houve mudança do banco ou do formato de backups (`schemaVersion: 2`).
- Cache offline atualizado para `contraponto-0.2.2` e versão do pacote `0.2.2`.
- 20 testes de lógica passaram. A interface do resumo foi testada em Chromium **com armazenamento em memória simulado**, nas resoluções 605×602 e 390×640 (fluxos de aplicar, desmarcar, confirmar, reabrir e nenhuma alteração). O navegador não pôde acessar `localhost` devido a política do ambiente; IndexedDB e service worker em navegador real ainda devem ser testados no seu dispositivo.
- `ROADMAP.md` registra a ideia do **Xadrez de Argumentos** como recurso futuro, ainda não implementado.

## Como atualizar no GitHub (v0.2.2)

Substitua os arquivos da raiz da v0.2.1 pelos do ZIP da v0.2.2. Mantenha o **mesmo endereço do GitHub Pages**, para preservar o armazenamento local vinculado à origem do site. Faça um backup JSON antes da atualização.

- Branch: `fix/contraponto-v0.2.2-feedback-classificacao`
- Commit: `fix: confirmar classificacao em lote com resumo e toast`
- Tag: `v0.2.2`
- Release: **CONTRAPONTO v0.2.2 — Feedback de Classificação**

No terminal, dentro do clone do repositório:

```bash
git checkout main && git pull
git checkout -b fix/contraponto-v0.2.2-feedback-classificacao
# copie os arquivos novos por cima dos antigos na raiz
git add .
git commit -m "fix: confirmar classificacao em lote com resumo e toast"
git push -u origin fix/contraponto-v0.2.2-feedback-classificacao
```

Abra um pull request para `main`, faça o merge e publique a tag/release após a validação. GitHub Pages Actions continua configurado em `.github/workflows/deploy.yml`.

## Correções e novidades na v0.2.1

- **Janela de edição corrigida:** o formulário respeita a altura da tela e rola internamente; os botões **Cancelar** e **Salvar alterações** ficam visíveis mesmo com muitos campos. Inclui área de segurança em celulares.
- **Aplicar sugestões em lote:** com uma reflexão aberta, acesse **Ferramentas → Organizar → ✦ Aplicar sugestões a todos os blocos**. O aplicativo calcula as sugestões localmente e exibe o **antes e depois**. Você pode selecionar ou desmarcar cada mudança; clique **Aplicar N sugestões** para confirmar. Depois use **Revisar** para corrigir individualmente ou **Desfazer lote** para retornar ao estado anterior de uma vez.
- **Preservação de dados:** textos, notas, posições, vozes e conexões **não são modificados** pela classificação em lote. Campos classificados manualmente como **Fato** permanecem marcados como Fato, porque a ferramenta não verifica evidências. Se a sugestão de natureza estiver indefinida, a natureza atual é preservada.
- **Ordem alfabética:** tipos de bloco, conexões, classificações, estados e vozes nos seletores, além de termos do dicionário e ações rápidas do inspetor.
- **Compatibilidade:** mantém `schemaVersion: 2` e o mesmo IndexedDB da v0.2.0; nenhuma migração destrutiva. O cache offline foi atualizado para `contraponto-0.2.1`.

**Atenção:** a classificação assistida usa regras simples no navegador, **não uma IA generativa**. Pode errar. Exporte um backup JSON antes de instalar uma atualização importante.

## O que mudou na v0.2

1. **Escrita livre com classificação sugerida.** Pressione `＋ Bloco`, `＋ Pensamento livre`, `Continuar` ou `Responder`. Comece a escrever. O painel indica o tipo provável, explica por que sugeriu e tenta inferir a natureza da frase. Quando o checkbox **Aplicar sugestões enquanto escrevo** estiver marcado, os menus acompanham a sugestão. Desmarque ou altere o menu para decidir manualmente. Em edições de nós antigos e ações com tipo explícito, o automático inicia desligado; nenhuma categorização existente é substituída silenciosamente.
2. **Dicionário contextual.** Use `? Dicionário` no cabeçalho ou `? Minidicionário` na barra lateral. No formulário, os menus **Tipo de bloco**, **Natureza da frase** e **Ligação** exibem uma explicação e exemplo logo abaixo. A busca filtra todos os termos.
3. **Tipos de bloco novos.** Comentário (fala livre), Pausa/marcador (onde parou), Concordância provisória, Metacomentário (sobre a conversa) e Organização/roteiro (ordem das questões).
4. **Notas laterais.** Toque num bloco e, no painel de detalhes, use `＋ Adicionar nota lateral`. Uma nota **não** vira nó do mapa. É possível remover, desfazer, consultar no histórico e levar no backup, Markdown e prompt.
5. **Pausar e retomar.** Clique em `⏸ Registrar pausa`, descreva o que falta explorar e salve. A reflexão recebe o status **pausado**. Quando voltar, clique em `↗ Retomar` para retornar ao último marcador. Os marcadores permanecem no mapa.
6. **Provocações ampliadas.** Agora há perguntas para distinguir sentimento, consequência, avaliação moral, autonomia, consentimento e confiança, sem apresentar análise psicológica como fato.

## Instruções anteriores de publicação no GitHub Pages (v0.2.1)

Se **já usa o repositório `contraponto`**, substitua os arquivos na mesma raiz; não crie um segundo repositório por obrigação. Antes de atualizar, faça um backup **Exportar → Backup completo (.json)** no app, especialmente se trocar de endereço.

```bash
# dentro do seu clone do repositório existente
git checkout main
git pull
git checkout -b fix/contraponto-v0.2.1-modal-e-classificacao-lote
# copie e substitua os arquivos do ZIP na raiz do clone
git add .
git commit -m "fix: ajustar modal e adicionar classificacao em lote"
git push -u origin fix/contraponto-v0.2.1-modal-e-classificacao-lote
```

Depois faça merge na `main`. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow em `.github/workflows/deploy.yml` publica a raiz quando há push em `main`.

Crie a **tag** `v0.2.1` e o **release** `CONTRAPONTO v0.2.1 — Revisão em Lote` na seção Releases. Se não usa Actions, as instruções podem mudar conforme a configuração do repositório. Após publicar, recarregue o site para atualizar o service worker e, se necessário, recarregue novamente. Não publique backups de reflexões pessoais no repositório.

> **Privacidade:** o GitHub Pages publica os arquivos estáticos e o código, mas não os pensamentos salvos no navegador. O IndexedDB permanece local ao perfil/origem do navegador. Ele **não é criptografado pelo app** e pode ser apagado ao limpar dados do site. Os backups e prompts só saem do aparelho quando você os exporta/copiar manualmente.

## Recursos preservados da v0.1

Biblioteca de reflexões, voz interna, nós posicionáveis, mapa com pan/zoom/minimapa, conexões semânticas, ramificações e retornos, histórico cronológico, recolhimento de caminhos, desfazer/refazer (até 50 mudanças do mapa por sessão), modo claro/escuro e exportações Markdown, SVG, PNG, JSON e prompt de IA. Tudo gratuito e sem backend.

## Exemplo e testes

- `samples/reflexao-demonstrativa.json` — mapa de 15 blocos, 16 conexões e uma nota lateral.
- `samples/mapa-demonstrativo.svg` — representação vetorial exportada, sem cortes.
- `src/inference.js` — motor de sugestões determinístico e local (heurísticas, **não uma IA**).
- `src/batch.js` — planejamento de sugestões em lote sem mutação dos blocos.
- `src/glossary.js` — definições e exemplos.
- `src/model.js`, `src/storage.js`, `src/main.js`, `src/export.js` — domínio, IndexedDB, editor e exportações.
- `tests/model.test.mjs`, `tests/inference.test.mjs`, `tests/batch.test.mjs` — testes automatizados executáveis com Node.js 20+:

```bash
npm test
```

### Limitações e cuidados

- O assistente **não entende de fato a intenção**, não valida premissas, não checa fontes, não detecta contradições lógicas automaticamente e não determina a moralidade de condutas. É apenas uma sugestão baseada em padrões de linguagem; texto ambíguo pode receber um rótulo inadequado. **Fato** nunca é classificado automaticamente: marque manualmente após verificação.
- Não existe sincronização entre celulares/computadores; exporte JSON para transferir seus dados.
- O funcionamento sem conexão começa após a instalação do cache em HTTPS ou localhost; não há garantia se o navegador limpar armazenamento.
- PNGs de mapas enormes podem exceder limites de memória/tamanho do navegador; SVG tende a ser mais robusto.
- Desfazer/refazer é por sessão e não cobre todas as operações da biblioteca/vozes. Evite editar o mesmo mapa em duas abas simultaneamente.
- Os 17 testes de lógica passaram. Simulamos UI com HTML/CSS/JavaScript carregados diretamente no Chromium em três resoluções (390×640, 605×602, 1100×720): modal, classificação em lote, desfazer e revisão individual funcionaram sem erros JavaScript. **O teste de UI usou armazenamento simulado em memória**. A navegação HTTP local no navegador automatizado foi bloqueada por política e persistência/offline em dispositivo real não foram novamente testados. Verifique no seu navegador e faça backup.
