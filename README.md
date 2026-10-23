# CONTRAPONTO v0.5.1 — Debate Bilíngue

Aplicativo web de mapa de raciocínios, mobile-first, interface em português brasileiro e captura em português ou inglês, sem cadastro e sem backend obrigatório. **Esta versão amplia a conversa falada para português e inglês dentro do próprio mapa**, sem remover o editor, a apresentação HTML, os relatórios, as exportações, o tutorial ou o changelog.

## Instalação rápida (Ubuntu)

Extraia o ZIP e abra um terminal na pasta que contém `index.html`:

```bash
python3 -m http.server 8080
```

Acesse **http://localhost:8080**. O modo gravação exige permissão de microfone e contexto seguro (`https://` ou `localhost`). Para publicar, mantenha o workflow de GitHub Pages já incluído em `.github/workflows/deploy.yml`.

## Novo recurso: Debate ao Vivo

1. Abra uma reflexão. Na barra do editor toque **🎙 Ao vivo** ou, com um bloco selecionado, abra o inspetor e toque **🎙 Iniciar daqui**. A barra lateral contém o botão **🎙 Debates ao Vivo**, usado para consultar gravações anteriores ou começar uma nova.
2. Escolha o ponto de partida: **um bloco existente** (o marcador vivo ficará conectado a ele) ou **um novo trecho** independente no mesmo mapa.
3. Escolha o idioma do debate: **Português (Brasil)** (`pt-BR`), **English (United States)** (`en-US`) ou **English (United Kingdom)** (`en-GB`). A última escolha é sugerida na próxima sessão e não altera o idioma da interface. Em seguida, se desejar, ative **transcrição automática** e/ou **gravação local do áudio**. Ambas começam **desativadas**. Leia o aviso de privacidade antes de optar pela transcrição do navegador.
4. Troque de perspectiva tocando nos botões grandes **1 · Eu inicial**, **2 · Eu crítico**, **3 · Observador**. Use `1`–`9` no computador quando não estiver editando texto. Você pode criar quantas vozes precisar, até 60 por reflexão, inclusive durante o debate.
5. As falas reconhecidas (quando disponíveis) aparecem na conversa. Também é possível **digitar uma fala** e clicar em **Salvar fala escrita**, ou usar **Nova fala da mesma voz** para segmentar sem trocar de perspectiva.
6. Use **⏸ Pausar** e **▶ Retomar**. Para encerrar escolha um motivo: interrompido, sem resposta, conclusão provisória ou final. O motivo da sessão ao vivo não altera automaticamente a conclusão da reflexão inteira.
7. Corrija uma transcrição, opcionalmente marque uma possível falácia e pressione **↗ Transformar em mapa**. A prévia permite selecionar falas, corrigir o texto e escolher o tipo de bloco e a relação. Apenas a confirmação cria blocos.
8. O mapa receberá um **bloco marcador 🎙 Debate ao Vivo**, conectado ao bloco de origem (se houver), seguido pelos blocos derivados da conversa. **A captura original não é apagada**. Novas conversas podem continuar a partir de qualquer bloco manual ou convertido.

### Idioma e classificação assistida (v0.5.1)

- **Um idioma por sessão ao vivo:** o reconhecimento recebe `recognition.lang` conforme a escolha. Cada nova sessão pode utilizar um idioma diferente; não é necessário mudar a língua do aplicativo.
- **Texto original preservado:** falas em inglês não são traduzidas. Turnos e blocos importados conservam `language`, que é mantido no backup JSON, Markdown e relatório.
- **Conversão local bilíngue:** o classificador agora reconhece expressões em inglês como `What if...` (cenário), `I disagree...` (objeção), `I feel scared...` (emoção), `I think that...` (premissa), `I need a break...` (pausa), além das regras anteriores em português. Há detecção heurística para textos manuais quando você não escolhe um idioma.
- **Pistas de falácias em inglês:** termos como `everyone`, `never` e `either...or` podem gerar avisos para revisar; **não são veredictos**, nem causam marcações automáticas.
- **Duas variantes de inglês:** `en-US` e `en-GB` selecionam a preferência regional do reconhecimento; não há garantia de reconhecimento de sotaques, gramática ou pontuação específica.
- **Sessões antigas:** mapas e debates existentes sem campo de idioma são tratados como `pt-BR`. Não se perde conteúdo.
- **Misturar português e inglês dentro de uma mesma sessão:** esta versão usa um idioma por sessão. Para capturas alternadas, encerre ou pause a atual e comece uma nova sessão com outro idioma.

### Métricas

- **Tempo da sessão ao vivo:** soma do tempo dos turnos enquanto a sessão estava ativa, sem contar pausas.
- **Tempo por voz:** quanto tempo cada perspectiva ficou selecionada na captura. Isso não significa que a pessoa falou continuamente.
- **Som detectado:** estimativa por intensidade sonora, **somente se a captura com microfone estiver ativa**. Não é uma medida confiável de fala humana, pois também detecta ruídos.
- **Tempo ativo no CONTRAPONTO:** métrica de uso da interface já existente. Ele pode coincidir com o tempo ao vivo, portanto **não some essas métricas**. No relatório são mostradas separadamente.

### Falácias

O modo ao vivo oferece marcadores manuais como *espantalho*, *falso dilema* e *generalização*. Um detector muito simples de expressões recorrentes pode sinalizar **o que vale conferir**, nunca validar automaticamente a existência de uma falácia. Marcações feitas pelo usuário são importadas com o bloco e incluídas nos prompts de análise crítica existentes para revisão por outra IA.

### Audio e privacidade

- **Gravação local:** usa `MediaRecorder` e salva fragmentos em um armazenamento IndexedDB separado. O app permite baixar o áudio, ouvir trechos aproximados ou excluí-lo. O áudio **não é incluído nos backups JSON, nem na apresentação HTML compartilhada**. O áudio fica no navegador, não num servidor administrado pelo CONTRAPONTO.
- **Transcrição automática:** depende de `SpeechRecognition`/`webkitSpeechRecognition`. O navegador pode usar processamento remoto e **enviar áudio a servidores terceiros**; mesmo com GitHub Pages o aplicativo não transmite deliberadamente o texto para seu próprio backend. Requer consentimento e conexão em implementações que não processam localmente. Em navegadores incompatíveis, use texto digitado e/ou áudio local para futura transcrição.
- **Gravação de outra pessoa:** obtenha consentimento antes de gravar; o app foi projetado para debates internos, mas permite adicionar participantes.
- O áudio pode ocupar bastante espaço e não é criptografado. Para levar a outro aparelho, baixe-o separadamente e armazene-o com cuidado.
- Para evitar gravações inesperadas, a captura **pausa quando a aba fica oculta**. O navegador também pode encerrar acesso ao microfone por conta própria. Seu texto confirmado é salvo periodicamente.
- A transcrição pode conter erros. O sistema não garante reconhecimento offline, transcrição em aparelhos físicos ou captura contínua no segundo plano.

### Importar dados antigos

**Antes de atualizar, exporte um backup JSON em v0.4.0.** Mantenha a mesma origem do site no GitHub Pages para conservar o IndexedDB local. A aplicação normaliza os backups antigos sem perder nós, relações, falácias, sessões, marcações e históricos existentes. O schema passa a **6**; a base IndexedDB é migrada de versão **1 para 2**, para guardar áudio separadamente.

Ao duplicar uma reflexão com debates ao vivo, a transcrição é copiada, mas a gravação **não** é duplicada (evita confundir áudio de duas reflexões). Excluir uma reflexão também solicita exclusão dos áudios que pertencem às sessões dela. Substituir toda a biblioteca solicita limpeza dos áudios locais anteriores.

### Tutorial e novidades

- O botão **▶ Tutorial** continua disponível e agora inclui as etapas **Debate ao Vivo** e **Idioma da conversa**.
- Dentro da própria tela ao vivo, toque **? Como usar** para ver instruções curtas de alternância de vozes, transcrição, pausas, classificação e privacidade.
- O botão **v0.5.1 ▾** mostra as mudanças desta versão e das anteriores. Consulte `CHANGELOG.md` para o registro completo.

## Testes

```bash
node --test tests/*.test.mjs
```

Os testes automatizados cobrem compatibilidade, criação, métricas, conversão em blocos, exportação textual e falácias. A interface foi verificada com armazenamento e reconhecimento de fala **simulados**, tanto em desktop (1280×800) quanto em celular (390×640), incluindo escolha de `en-GB`, troca de voz, transcrição simulada, classificação, conversão e persistência lógica. Também há testes unitários para `pt-BR`, `en-US`, `en-GB` e importação de backups antigos.

**Não foi possível validar o microfone físico, a transcrição real em inglês, o áudio persistido no IndexedDB real ou a abertura de HTML/anexos em aparelhos físicos neste ambiente.** São testes de aceitação importantes após publicar.

## GitHub / release

- **Repositório:** seu repositório atual do CONTRAPONTO.
- **Branch:** `feat/contraponto-v0.5.1-debate-bilingue`
- **Versão e tag:** `0.5.1` / `v0.5.1`
- **Release:** `CONTRAPONTO v0.5.1 — Debate Bilíngue`
- **Commit:** `feat: adicionar transcricao e classificacao bilingue no debate ao vivo`

Substitua os arquivos anteriores pelo conteúdo do ZIP, sem colocar uma pasta extra na raiz do repositório. Mantenha `src/`, `assets/`, `samples/`, `tests/` e `.github/workflows/`. **Arquivos novos nesta atualização:** `src/language.js`, `src/inference-en.js`, `tests/bilingual.test.mjs`. **Arquivos atualizados:** `src/live.js`, `src/live-ui.js`, `src/inference.js`, `src/model.js`, `src/main.js`, `src/export.js`, `src/metrics.js`, `src/release.js`, `index.html`, `sw.js`, `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `package.json` e testes de versão/schema. Os demais arquivos existentes devem ser preservados.

Para publicar, crie um pull request da branch para `main`, e então o release `v0.5.1`. A configuração de Pages deve usar **GitHub Actions** e o workflow já existente. Se aparecer a versão antiga após o deploy, atualize a página para receber o cache `contraponto-0.5.1`.


## Exemplo em inglês

O arquivo `samples/english-debate-demo.json` contém uma sessão simulada em `en-US` com três falas e os blocos correspondentes; pode ser importado pelo menu **Importar JSON**. Faça backup da sua biblioteca primeiro.

## Limitações conhecidas do reconhecimento

1. O reconhecimento de fala depende do navegador e, em algumas implementações, de servidores externos. Usar `en-US`/`en-GB` configura uma preferência, não garante suporte nem reconhecimento fiel.
2. O aplicativo não detecta automaticamente a troca de idioma dentro de uma gravação. É possível criar sessões diferentes em português e inglês na mesma reflexão.
3. Gravação de áudio não transcreve automaticamente gravações passadas; se o navegador não oferecer reconhecimento, o áudio pode ser baixado e os turnos podem ser corrigidos manualmente.
4. A classificação bilíngue usa expressões regulares transparentes e pode errar com frases curtas, ironia, informalidade ou *code-switching*. Nenhuma classificação deve ser confundida com validação lógica ou moral.
