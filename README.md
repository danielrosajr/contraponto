# CONTRAPONTO — Meu Laboratório de Pensamentos

**Versão 0.3.1 — Leitura Guiada** · Gratuito · Português brasileiro · GitHub Pages · Sem login, backend ou IA externa

Aplicativo web/PWA para organizar debates consigo mesmo num mapa visual de blocos conectados, com múltiplas vozes, classificação local de frases, minidicionário, histórico, ramificações, notas, falácias registradas manualmente, sessões e relatórios. Dados em **IndexedDB**, no navegador. Exporta/importa JSON, gera Markdown, SVG, PNG e prompts para IA. Nenhuma reflexão é enviada automaticamente a servidores.

## Começar no Ubuntu

```bash
unzip CONTRAPONTO-v0.3.1.zip
cd CONTRAPONTO-v0.3.1
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Não abra pelo `file://`: módulos e PWA dependem de HTTP ou HTTPS. A instalação/cache offline precisa do primeiro carregamento com internet (ou local). Para testes automatizados: `npm test` (Node.js 20+; não precisa `npm install`).

## O que mudou na v0.3.1 — Modo Leitura e atalhos corrigidos

O modo mapa continua oferecendo arraste, reorganização e edição. O novo **Modo Leitura** é uma camada separada e quase em tela cheia, com o texto do bloco **sem truncamento**, sua voz, tipo, data e notas. Por ficar fora da área de arraste, seus botões de navegação não arrastam os cartões.

### Como usar no computador

1. Abra uma reflexão, selecione um bloco e clique em **▣ Modo leitura** na barra superior, **▣ Ler** na navegação flutuante ou **▣ Ler ampliado** no inspetor. Você também pode dar **duplo clique** diretamente no bloco.
2. No Modo Leitura, pressione **→** para avançar ou **←** para voltar, ou use os botões fixos no rodapé. Quando houver mais de uma saída, escolha a ramificação clicando no item desejado ou pressionando **1** a **9**.
3. Pressione **Esc** ou clique em **Voltar ao mapa**. O bloco atual continuará selecionado, e o mapa centraliza nele. Para editar em vez de ler, clique **Editar bloco** dentro do leitor ou use o inspetor no mapa.
4. No mapa normal, ao clicar num bloco, o foco vai para o mapa e **← / →** também funcionam sem exigir Modo Leitura. **Enter** com o mapa focado abre o leitor do bloco selecionado.

No celular, o Modo Leitura usa os mesmos botões, com tamanho adequado para toque. Sem teclado físico, escolha a ramificação tocando na alternativa. A navegação antiga do mapa continua disponível.

**Restrições:** o leitor navega por *conexões verdadeiras*; não inventa ordem onde há várias possibilidades. Ao retornar, prioriza o caminho realmente percorrido. O duplo clique, que antes abria a edição, agora abre o Modo Leitura; use **Editar bloco** para modificar o conteúdo.

**Dados:** não há migração ou alteração no schemaVersion 3, nem envios externos. O cache offline mudou para `contraponto-0.3.1`; confirme a atualização do site/aba após o deploy.

## Funcionalidades trazidas na v0.3.0

### 1. Navegação por setas

Selecione um bloco e use **→** para avançar por uma conexão real e **←** para voltar. Quando existem várias conexões, uma janela permite escolher o caminho; o app não escolhe uma arbitrariamente. Há botões **Anterior** e **Próximo** sobre o mapa, inclusive para toque no celular. A navegação respeita conexões e ciclos; não muda nem apaga linhas. O **←** prioriza o último caminho realmente percorrido durante a navegação, quando possível.

### 2. Retomar com resumo e destaque do caminho

Clique **↗ Retomar**, disponível quando já existe histórico de sessão ou marcador de pausa. O sistema encontra o caminho pela rede de conexões, mostra as últimas falas e indica cada voz. Não gera interpretação de sentimentos nem inventa resumo abstrato: a prévia usa apenas os textos originais dos blocos. Após confirmar, o trecho fica destacado no mapa **por até 45 segundos**, ou até clicar **Encerrar destaque** ou adicionar novo pensamento. Os marcadores de pausa são preservados. Se o debate estava pausado ou concluído, ele volta para **em andamento**.

### 3. Cronômetro, sessões e pausas possíveis

Cada vez que você abre uma reflexão **em andamento**, inicia-se uma sessão local. O aplicativo conta tempo **aproximado de uso ativo na aba**, não tempo de reflexão fora do navegador. A contagem termina quando a página é ocultada, quando você sai, conclui, pausa explicitamente ou após **5 minutos sem interação**. Se voltar a interagir, uma nova sessão começa; uma sessão interrompida pelo fechamento inesperado preserva até o último salvamento. O contador do cabeçalho usa a soma dos tempos registrados.

O relatório discrimina **datas e horários de início/fim**, sessões, tempo ativo e intervalo de calendário (que pode incluir grandes pausas). Ao selecionar blocos, o tempo ativo também pode ser associado ao primeiro cenário do caminho da pergunta principal. **Não se trata de um cronômetro por pensamento confiável**: mudar o foco ou trabalhar em paralelo pode distorcer essa estimativa, que será explicitamente rotulada.

Em **Organizar → Procurar pausas não registradas**, o sistema procura conexões diretas em que as datas de criação dos dois blocos diferem **uma hora ou mais**. Mostra as possíveis pausas para você confirmar. Se aceitar, insere um marcador novo entre os blocos sem perder a relação original (a conexão é dividida em duas). É reversível com desfazer. O marcador informa que foi **sugerido retrospectivamente**; não afirma que você realmente parou. Criar um pensamento ligado a outro muito antigo também pode mostrar uma sugestão de pausa.

### 4. Marcação manual de falácias

Selecione um bloco → **⚑ Marcar possível falácia**. Escolha entre espantalho, falso dilema, generalização, raciocínio circular, falsa causa, ad hominem e outras; acrescente uma justificativa e marque como suspeita, identificada por você ou descartada após revisão. Você pode editar ou apagar a marcação; nenhuma falácia é atribuída automaticamente. As marcações entram no backup, Markdown, relatório e prompt de IA, que **pede para revisar cada uma criticamente e apontar possíveis erros que você não marcou**. Uma emoção não é uma falácia e a opinião de uma IA não é veredito.

### 5. Relatório final/parcial

Clique **◎ Relatório** em qualquer momento, ou **✓ Concluir** para finalizar a sessão e abrir o relatório automaticamente. Mostra quantidade de blocos, conexões, vozes, tipos, relações, marcadores de falácia, número de sessões, tempo ativo estimado, calendário desde o primeiro bloco até o último marco/conclusão, pausas registradas e estimativa de atenção por cenário. É possível **baixar em Markdown**. O relatório é parcial enquanto a reflexão não estiver concluída.

### 6. Prompt de xadrez de argumentos

Clique **♟ Prompt de xadrez** em Organizar ou **Exportar → Prompt de xadrez**. Abre texto completo para copiar ou salvar em `.txt` e levar manualmente a uma IA. Instrui a IA a correlacionar vozes/brancas/pretas e blocos/lances, justificar metáforas de xeque/blunder, criar roteiro de animação e **não inventar PGN com jogadas ilegais**. **Não** implementa ainda um tabuleiro, motor de xadrez, replay ou avaliação automática; isso continua no `ROADMAP.md`.

## Compatibilidade e segurança dos dados

- Esta versão atualiza o formato normalizado para **schemaVersion 3**, preservando reflexões antigas (`schemaVersion 1/2`) sem migração destrutiva. Blocos, vozes, posições, tipos, notas e conexões antigos são mantidos; sessões e falácias começam vazias quando não existiam.
- **Faça backup JSON antes de atualizar**. Use a **mesma URL do GitHub Pages**: IndexedDB está ligado à origem, e trocar de domínio/repositório pode parecer apagar a biblioteca. Backups privados não devem entrar no GitHub.
- Dados armazenados localmente **não são criptografados pelo aplicativo**. Limpar armazenamento do site pode excluí-los. O modo anônimo pode ser temporário.
- Não envia dados automaticamente à IA; exportações e cópias são iniciadas manualmente.
- O tempo é uma **aproximação baseada em uso do app** e não contabiliza pensamento fora da tela; diferenças entre criação de blocos não provam pausa.

## Publicar no GitHub Pages

Se você já tem o repositório `contraponto`, **substitua** os arquivos da raiz pelos do ZIP, incluindo pastas `src/`, `tests/`, `samples/`, `assets/` e `.github/`. Não copie a pasta `CONTRAPONTO-v0.3.1` como subdiretório extra. Não é necessário remover arquivos antigos, exceto arquivos temporários locais que não pertenciam ao repositório.

**Branch:** `fix/contraponto-v0.3.1-leitura-guiada`  
**Commit:** `fix: corrigir navegacao no desktop e adicionar modo leitura`  
**Tag:** `v0.3.1`  
**Release:** `CONTRAPONTO v0.3.1 — Leitura Guiada`

```bash
git checkout main
git pull
git checkout -b fix/contraponto-v0.3.1-leitura-guiada
# Copie o conteúdo descompactado para a raiz do clone
git add .
git commit -m "fix: corrigir navegacao no desktop e adicionar modo leitura"
git push -u origin fix/contraponto-v0.3.1-leitura-guiada
```

Abra um pull request, faça o merge para `main`, crie a tag `v0.3.1` e publique o release. Em **Settings → Pages → Source**, selecione **GitHub Actions**; o arquivo `.github/workflows/deploy.yml` executa a publicação. Após o deploy, atualize a página novamente se o service worker ainda mostrar uma interface anterior.

## Arquivos importantes

- `index.html`, `style.css`, `src/main.js`: interface e editor.
- `src/model.js`, `src/storage.js`: dados/backup e IndexedDB.
- `src/journey.js`: conexões, caminhos, pausas suspeitas e tempos.
- `src/metrics.js`: métricas e relatório Markdown.
- `src/fallacies.js`: catálogo local de falácias e estados.
- `src/chess.js`: prompt de xadrez (sem motor de IA/xadrez).
- `src/inference.js`, `src/batch.js`, `src/glossary.js`, `src/export.js`: classificação local, dicionário e exportações.
- `samples/reflexao-demonstrativa.json`: exemplo de mapa; não é um registro pessoal real.
- `tests/*.test.mjs`: testes unitários sem dependências externas.

## Verificações executadas

**Na v0.3.0, 30 testes automatizados de Node.js passaram**, incluindo caminhos com ramificações/ciclos, gaps temporais, relatórios, falácias e backup antigo. Também executamos **smoke tests da interface no Chromium** utilizando uma montagem inline e **IndexedDB simulado**, pois o navegador de teste bloqueia navegação para endereços HTTP/HTTPS locais. Testados: abertura da biblioteca, seleção e escolha de ramificação, retomada com ênfase temporária, detecção/inserção confirmada de pausa, relatório/conclusão, falácia e prompt de xadrez. Ainda **não** foram validados em um deploy real o IndexedDB persistente, o cache offline e a interação touch em dispositivo físico. Essas validações são recomendadas antes de considerar a versão estável.


## Testes específicos da v0.3.1

Executados **35 testes Node** (todos passaram), incluindo escolha de bifurcações, retorno pelo histórico de navegação e conexões circulares. Executados também testes de interface em Chromium com HTML/JS montado em memória e armazenamento simulado, nas dimensões **1280×780** e **390×640**: abertura por duplo clique e botão, leitura com texto integral, avançar, voltar, escolher alternativas, teclas ←/→ e 1, Esc, fechar, navegar usando os controles do mapa e setas no modo normal. Capturas em `samples/leitura-*.png`.

A execução direta por HTTP local no navegador automatizado é bloqueada por uma política do ambiente. Portanto ainda é preciso validar **IndexedDB real, service worker e teclado no deploy publicado**. A montagem de testes não equivale a uma validação de ponta a ponta no GitHub Pages.

Arquivos alterados/criados em relação à v0.3.0: `index.html`, `style.css`, `src/main.js`, `src/reading.js` (novo), `sw.js`, `package.json`, `tests/reading.test.mjs` (novo), README, CHANGELOG e capturas de exemplo. Mantenha os demais arquivos do projeto.
