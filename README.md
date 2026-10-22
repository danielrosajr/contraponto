# CONTRAPONTO — Meu Laboratório de Pensamentos

**Versão:** `v0.1.0` · **Licença:** MIT · **Plataforma:** Web/PWA estática · **Idioma:** pt-BR

Editor visual de raciocínios, perguntas, contrapontos e conclusões. Sem cadastro, servidor, analytics ou APIs externas. O app utiliza **JavaScript modular + CSS + SVG + IndexedDB** e não possui dependências de npm. Os dados permanecem no armazenamento do navegador utilizado, salvo quando você exporta/copiar um conteúdo por conta própria.

## Executar no Ubuntu

```bash
cd CONTRAPONTO-v0.1.0
python3 -m http.server 8080
```

Acesse **http://localhost:8080** no Chrome/Chromium/Firefox. Evite abrir `index.html` diretamente via `file://` porque módulos ES, IndexedDB e service workers podem não funcionar corretamente. É necessário abrir online ao menos uma vez para instalar o cache offline da PWA. Para instalar como app, use **Instalar app** no navegador quando disponível.

## GitHub Pages

1. Crie um repositório, por exemplo `contraponto` (sugestão: **privado** para o código em desenvolvimento; o site publicado pode ser acessível publicamente).
2. Suba **todos** os arquivos e pastas deste ZIP na raiz do repositório.
3. `git checkout -b feat/contraponto-mvp-v0.1.0`, `git add .`, `git commit -m "feat: lançar MVP do Contraponto com mapa visual e exportações"`.
4. Faça push e abra um Pull Request para `main`, ou mescle a branch localmente.
5. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Após merge em `main`, o workflow publica automaticamente.
6. Abra `https://SEU-USUARIO.github.io/contraponto/`. O endereço real depende do nome do repositório.
7. Em **Releases → Draft a new release**, crie a tag `v0.1.0`, título `CONTRAPONTO v0.1.0 — Primeiro Pensamento` e anexe o ZIP se desejar.

**Importante:** GitHub Pages publica **código e arquivos estáticos**, nunca os pensamentos salvos no IndexedDB dos visitantes. Não adicione backups JSON pessoais ao repositório, mesmo que ele seja privado.

## Recursos da versão 0.1

- Biblioteca com criação, edição, duplicação, arquivamento, exclusão, etiquetas e estado da reflexão.
- Mapa visual de blocos realmente posicionáveis, com conexões semânticas (também para pensamentos antigos), pan, zoom, minimapa, centralização e reorganização automática.
- 12 tipos de blocos, vozes internas personalizadas, natureza da afirmação e estados contestado/revisado/abandonado.
- Ações rápidas, objeções, ramificações, retorno explícito à pergunta, provocações socráticas e recolhimento de subárvores.
- Histórico em ordem cronológica navegável; desfazer/refazer (até 50 alterações de **mapa**, na sessão atual).
- Exportações Markdown, SVG, PNG, prompt para IA e backup JSON. Importação JSON para substituir ou acrescentar reflexões.
- Salvamento automático no IndexedDB; PWA com cache offline após primeira visita por HTTPS/localhost; modo claro/escuro.
- Exemplo fictício carregado na primeira abertura.

## Gestos e atalhos

- **Mapa:** arraste um bloco para movê-lo; arraste o fundo para navegar; scroll do mouse / botões `+` e `−` para zoom. Duplo clique em um bloco para editá-lo; duplo clique no contador de ramificações para recolher/expandir.
- **Celular:** toque num bloco para selecionar e usar ações; arraste para mover; use `+` e `−` para zoom. É possível conectar blocos por menus, sem precisar desenhar uma linha com o dedo.
- `N` cria um bloco, `Delete` exclui o bloco selecionado com confirmação, `Ctrl+Z` desfaz, `Ctrl+Y` ou `Ctrl+Shift+Z` refaz, `Escape` fecha a janela.
- **Backup:** menu Exportar → Backup JSON; Importar JSON disponível na biblioteca.

## Limites conhecidos

- O cache offline é instalado apenas após uma visita bem-sucedida em HTTPS/localhost; não houve implementação de sincronização entre dispositivos nem criptografia em repouso. A privacidade depende também de proteger seu dispositivo/perfil de navegador.
- O histórico de desfazer/refazer é volátil (não persiste após fechar/atualizar a aba) e não cobre operações na biblioteca nem alterações nas vozes.
- O PNG é gerado a partir de SVG sem depender de serviços externos; mapas extremamente grandes podem exceder limites do navegador. O SVG permanece mais leve.
- Edição simultânea em múltiplas abas não possui reconciliação: prefira uma aba por vez.
- O mapa possui expansão/colapso por relações direcionais; nós com outras rotas de entrada podem permanecer visíveis.
- A interface não realiza análise automática de contradições nem avaliações psicológicas; os rótulos são atribuídos pelo usuário.

## Projeto

`index.html` — interface principal; `style.css` — estilos; `src/main.js` — interação/editor; `src/model.js` — dados e amostra; `src/storage.js` — IndexedDB; `src/export.js` — formatos; `sw.js` — cache offline; `samples/reflexao-demonstrativa.json` — exemplo importável; `samples/mapa-demonstrativo.svg` — amostra exportada; `.github/workflows/deploy.yml` — deploy GitHub Pages.

## Atenção à privacidade

**Exportar um prompt para IA não envia conteúdo automaticamente.** Colar esse prompt em qualquer serviço externo é uma ação explícita sua. Se limpar os dados do site, usar navegação anônima ou trocar de dispositivo, os dados locais podem desaparecer: exporte backups periodicamente.

## Executar testes do modelo e das exportações

```bash
npm test
```

Os testes automatizados cobrem o modelo, a demonstração, validação de importações e a geração de Markdown/prompt/SVG. Os testes de interação em um navegador real devem ser executados manualmente nos dispositivos-alvo antes de divulgar como versão estável; a versão `0.1.0` é um MVP inicial.
