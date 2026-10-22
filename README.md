# CONTRAPONTO — Meu Laboratório de Pensamentos

**Versão:** `v0.2.0 — Pensamento Livre` · **Licença:** MIT · **Plataforma:** Web/PWA estática · **Idioma:** português brasileiro

Um mapa visual, local e privado para raciocinar, debater perspectivas, explorar possibilidades e registrar sentimentos, perguntas, comentários, pausas e conclusões. **Sem cadastro, backend, chaves de API ou bibliotecas externas**. Implementação em JavaScript modular, CSS, SVG e IndexedDB.

## Começar no Ubuntu

```bash
unzip CONTRAPONTO-v0.2.0.zip
cd CONTRAPONTO-v0.2.0
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Não abra o HTML diretamente pelo explorador de arquivos (`file://`); os módulos, o IndexedDB e a PWA exigem um servidor HTTP local ou HTTPS. Offline após o primeiro carregamento bem-sucedido e cache do service worker instalado.

## O que mudou na v0.2

1. **Escrita livre com classificação sugerida.** Pressione `＋ Bloco`, `＋ Pensamento livre`, `Continuar` ou `Responder`. Comece a escrever. O painel indica o tipo provável, explica por que sugeriu e tenta inferir a natureza da frase. Quando o checkbox **Aplicar sugestões enquanto escrevo** estiver marcado, os menus acompanham a sugestão. Desmarque ou altere o menu para decidir manualmente. Em edições de nós antigos e ações com tipo explícito, o automático inicia desligado; nenhuma categorização existente é substituída silenciosamente.
2. **Dicionário contextual.** Use `? Dicionário` no cabeçalho ou `? Minidicionário` na barra lateral. No formulário, os menus **Tipo de bloco**, **Natureza da frase** e **Ligação** exibem uma explicação e exemplo logo abaixo. A busca filtra todos os termos.
3. **Tipos de bloco novos.** Comentário (fala livre), Pausa/marcador (onde parou), Concordância provisória, Metacomentário (sobre a conversa) e Organização/roteiro (ordem das questões).
4. **Notas laterais.** Toque num bloco e, no painel de detalhes, use `＋ Adicionar nota lateral`. Uma nota **não** vira nó do mapa. É possível remover, desfazer, consultar no histórico e levar no backup, Markdown e prompt.
5. **Pausar e retomar.** Clique em `⏸ Registrar pausa`, descreva o que falta explorar e salve. A reflexão recebe o status **pausado**. Quando voltar, clique em `↗ Retomar` para retornar ao último marcador. Os marcadores permanecem no mapa.
6. **Provocações ampliadas.** Agora há perguntas para distinguir sentimento, consequência, avaliação moral, autonomia, consentimento e confiança, sem apresentar análise psicológica como fato.

## Como publicar uma atualização no GitHub Pages

Se **já usa o repositório `contraponto`**, substitua os arquivos na mesma raiz; não crie um segundo repositório por obrigação. Antes de atualizar, faça um backup **Exportar → Backup completo (.json)** no app, especialmente se trocar de endereço.

```bash
# dentro do seu clone do repositório existente
git checkout main
git pull
git checkout -b feat/contraponto-v0.2.0-classificacao-assistida
# copie e substitua os arquivos do ZIP na raiz do clone
git add .
git commit -m "feat: adicionar minidicionario e classificacao assistida ao Contraponto"
git push -u origin feat/contraponto-v0.2.0-classificacao-assistida
```

Depois faça merge na `main`. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow em `.github/workflows/deploy.yml` publica a raiz quando há push em `main`.

Crie a **tag** `v0.2.0` e o **release** `CONTRAPONTO v0.2.0 — Pensamento Livre` na seção Releases. Se não usa Actions, as instruções podem mudar conforme a configuração do repositório. Após publicar, recarregue o site para atualizar o service worker e, se necessário, recarregue novamente. Não publique backups de reflexões pessoais no repositório.

> **Privacidade:** o GitHub Pages publica os arquivos estáticos e o código, mas não os pensamentos salvos no navegador. O IndexedDB permanece local ao perfil/origem do navegador. Ele **não é criptografado pelo app** e pode ser apagado ao limpar dados do site. Os backups e prompts só saem do aparelho quando você os exporta/copiar manualmente.

## Recursos preservados da v0.1

Biblioteca de reflexões, voz interna, nós posicionáveis, mapa com pan/zoom/minimapa, conexões semânticas, ramificações e retornos, histórico cronológico, recolhimento de caminhos, desfazer/refazer (até 50 mudanças do mapa por sessão), modo claro/escuro e exportações Markdown, SVG, PNG, JSON e prompt de IA. Tudo gratuito e sem backend.

## Exemplo e testes

- `samples/reflexao-demonstrativa.json` — mapa de 15 blocos, 16 conexões e uma nota lateral.
- `samples/mapa-demonstrativo.svg` — representação vetorial exportada, sem cortes.
- `src/inference.js` — motor de sugestões determinístico e local (heurísticas, **não uma IA**).
- `src/glossary.js` — definições e exemplos.
- `src/model.js`, `src/storage.js`, `src/main.js`, `src/export.js` — domínio, IndexedDB, editor e exportações.
- `tests/model.test.mjs`, `tests/inference.test.mjs` — testes automatizados executáveis com Node.js 20+:

```bash
npm test
```

### Limitações e cuidados

- O assistente **não entende de fato a intenção**, não valida premissas, não checa fontes, não detecta contradições lógicas automaticamente e não determina a moralidade de condutas. É apenas uma sugestão baseada em padrões de linguagem; texto ambíguo pode receber um rótulo inadequado. **Fato** nunca é classificado automaticamente: marque manualmente após verificação.
- Não existe sincronização entre celulares/computadores; exporte JSON para transferir seus dados.
- O funcionamento sem conexão começa após a instalação do cache em HTTPS ou localhost; não há garantia se o navegador limpar armazenamento.
- PNGs de mapas enormes podem exceder limites de memória/tamanho do navegador; SVG tende a ser mais robusto.
- Desfazer/refazer é por sessão e não cobre todas as operações da biblioteca/vozes. Evite editar o mesmo mapa em duas abas simultaneamente.
- Testes automatizados de lógica passaram; a navegação real no Chromium deste ambiente foi bloqueada por política de execução. Valide o formulário, edição, drag, toque, notas e importação em seu navegador/dispositivo antes de considerar produção estável.
