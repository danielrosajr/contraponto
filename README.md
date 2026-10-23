# CONTRAPONTO v0.4.0 — Apresentação Guiada

Um laboratório de pensamentos em português, mobile-first, 100% local. Crie debates internos com perguntas, objeções, hipóteses, emoções, ramificações e múltiplas vozes. Inclui editor gráfico real, histórico, cronômetro estimado, dicionário, classificação assistida, falácias anotadas e exportações.

**Esta versão não usa cadastro, backend, IA externa, chaves nem dependências npm para executar.**

## Começando

1. Extraia o ZIP. No Ubuntu, na pasta que contém `index.html`, rode `python3 -m http.server 8080`.
2. Abra `http://localhost:8080` no navegador. `file://` não oferece o mesmo suporte a módulos, IndexedDB ou PWA.
3. Clique **▶ Tutorial** para fazer oito passos guiados. Ou abra a **demonstração fictícia**; não representa uma pessoa real.
4. Para verificar o que mudou, toque em **v0.4.0 ▾** no cabeçalho: o aplicativo mostra as novidades desta versão e as anteriores.

## v0.4.0 — O que foi adicionado

### 1. Compartilhar → Apresentação interativa

Abra uma reflexão e clique **♧ Compartilhar**, ou **Exportar → Apresentação interativa (.html)**. O app permite:

- Trocar nomes de vozes por “Perspectiva 1, 2...” (opcional; NÃO anonimiza o texto).
- Incluir **notas privadas** e **marcações de possíveis falácias** opcionalmente (ambas desmarcadas por padrão).
- **Pré-visualizar** a apresentação dentro de um iframe isolado antes de baixar.
- **Baixar HTML independente** contendo todos os blocos e conexões. Não é um link público: é um arquivo enviado por você.
- **Baixar resumo Markdown para a sessão**, baseado literalmente nos seus trechos marcados, emoções e conclusões escritas.

Quem recebe o HTML pode abrir no navegador do celular/computador e ler em **História guiada**, explorar o **Mapa clicável** ou consultar **Resumo e tópicos**. Ao encontrar bifurcações, a pessoa escolhe qual caminho seguir. Há também índice com todos os pensamentos, para que nenhuma linha dependa de um caminho único. O botão **Imprimir/PDF** usa a função de impressão do navegador para gerar PDF ou papel. Este arquivo funciona offline quando o navegador permite abrir arquivos HTML locais.

**Privacidade:** um arquivo HTML compartilhado não é criptografado e não pode ser revogado após enviado. Qualquer pessoa com a cópia pode ler os dados incluídos. Os textos podem conter nomes e detalhes íntimos mesmo com nomes de vozes ocultados. Inspecione a prévia e a cópia final antes de enviar. Não faça upload da sua apresentação íntima ao GitHub Pages ou a outro site público. Para destinatários cujo celular bloqueie abrir HTML anexado, peça para salvar o arquivo e abrir pelo navegador ou envie o PDF gerado em um computador.

### 2. Marcadores para conversar

Selecione um pensamento no mapa → **★ Marcar para conversar**, no inspetor. Há cinco opções: “Quero conversar sobre isso”, “Não consegui responder”, “Esse pensamento me incomodou”, “Mudei de opinião aqui”, “Quero entender melhor o que senti”. Você pode incluir uma observação. Esses marcadores são preservados no backup JSON, aparecem na apresentação e no resumo. Excluir o marcador não exclui o pensamento. Falácias continuam sendo uma anotação separada, não verificada automaticamente.

### 3. Encerramento com motivo

Clique **✓ Concluir**, escolha se parou para continuar, terminou sem resposta, chegou a conclusão provisória ou considerou a reflexão concluída, e escreva observação se desejar. Pausa mantém status **pausado**; os demais motivos marcam **concluído**. O motivo fica armazenado independentemente do status, preservado em `closures` e exibido no relatório. Você pode continuar uma reflexão depois; encerrar não impede revisões.

### 4. Prompt avançado e devolução de sugestões da IA

Em **Exportar → Prompt crítico aprofundado**, copie texto para IA de sua escolha. Ele inclui IDs de blocos, ramificações, objeções, falácias marcadas e instruções para diferenciar afirmações explícitas, inferências e hipóteses. Há também opção de **Prompt para resumo de sessão**.

O prompt pede que a IA coloque um objeto JSON `suggestions` na resposta. Se houver propostas interessantes, vá em **Organizar → Importar sugestões da IA** e cole o JSON. Cada proposta deve conter quatro campos:

```json
{
  "suggestions": [
    {
      "sourceId": "ID_VERDADEIRO_DE_UM_BLOCO",
      "type": "pergunta",
      "relation": "contesta",
      "text": "Será que estou confundindo sofrimento com consentimento?"
    }
  ]
}
```

O app rejeita IDs inexistentes, tipos/relações inválidos e mais de 20 sugestões por vez. Mostra as válidas lado a lado antes de criar novos blocos. Você escolhe quais importar; nada é editado sem confirmação. O lote é reversível com desfazer. **Não há chamada de IA no aplicativo.**

### 5. Tutorial e controle de versão

**▶ Tutorial** está disponível no cabeçalho, na biblioteca e nas ferramentas. O guia destaca elementos da própria interface e abre a demonstração para mostrar o mapa. Não acessa informações externas nem precisa de um cadastro. Você pode pular ou reiniciar a qualquer momento.

**v0.4.0 ▾** abre a lista do que foi implementado nas versões 0.1.0 a 0.4.0. A indicação de novidades aparece após atualizar até você consultar a área. O histórico completo também está em `CHANGELOG.md`. A versão está sincronizada com `package.json` e `src/release.js`.

## Executar testes

Node.js 20 ou superior:

```bash
node --test tests/*.test.mjs
```

Os testes Node verificam importações antigas, preservação de novos dados, segurança de serialização em HTML, prompts, parsing de sugestões, caminhos, inferência, métricas e exportações. Há um arquivo de exemplo fictício em `samples/apresentacao-demonstrativa.html` e `samples/reflexao-demonstrativa.json`.

## Atualizar o GitHub Pages

**Versão:** `0.4.0`  
**Branch:** `feat/contraponto-v0.4.0-apresentacao-guiada`  
**Tag:** `v0.4.0`  
**Release:** `CONTRAPONTO v0.4.0 — Apresentação Guiada`  
**Commit:** `feat: adicionar apresentacao guiada tutorial changelog e analise aprimorada`

Substitua os arquivos da versão anterior **na raiz do repositório**, sem acrescentar uma pasta extra. Mantenha `.github/workflows/deploy.yml`, `assets/`, `src/`, `tests/` e `samples/`. Adicione os módulos novos `src/presentation.js`, `src/analysis.js`, `src/release.js` e `tests/presentation.test.mjs`. Não exclua os módulos antigos.

```bash
git checkout main
git pull
git switch -c feat/contraponto-v0.4.0-apresentacao-guiada
# copie os arquivos da pasta CONTRAPONTO-v0.4.0 para a raiz do clone
git add .
git commit -m "feat: adicionar apresentacao guiada tutorial changelog e analise aprimorada"
git push -u origin feat/contraponto-v0.4.0-apresentacao-guiada
```

Abra um pull request para `main` e crie o release/tag `v0.4.0`. O workflow existente publica os arquivos no GitHub Pages com **Settings → Pages → Source → GitHub Actions**.

### Compatibilidade e segurança

- **Faça backup JSON antes de atualizar.** Continue usando a mesma URL do Pages para conservar o IndexedDB de origem; ele não sincroniza entre domínios/dispositivos.
- A normalização atual usa **schemaVersion 4**, reconhece campos anteriores e preserva conteúdos, vozes, conexões, notas, sessões, tempos, falácias e dados antigos; os campos novos começam vazios.
- Cache offline: `contraponto-0.4.0`. Após publicar, atualize a página caso o service worker ainda mostre a versão anterior.
- Seus dados **não são criptografados** pelo app. Não faça commit de backups íntimos ou exportações pessoais.
- Exportar, pré-visualizar, copiar e baixar são ações locais voluntárias. Enviar o texto a uma IA externa ou a uma pessoa é uma decisão separada.
- Cronômetro mede **tempo aproximado de uso ativo**, não todo o tempo efetivo de reflexão.

## Testes e limitações

Os testes automatizados de lógica e os testes de interface **com armazenamento simulado** cobriram o editor, tutorial, changelog, marcação de pontos, importação seletiva de sugestões, encerramento e prévia. O HTML de apresentação também foi verificado no Chromium em telas de 390 e 1280 pixels, com navegação, escolhas, mapa e resumo. A política de navegação do ambiente bloqueou testes diretos por HTTP/file no navegador automatizado; os testes de UI foram feitos por montagem em memória. **É necessário testar no seu GitHub Pages o IndexedDB real, instalação offline, downloads e abertura de HTML em aparelhos físicos (inclusive iPhone).**
