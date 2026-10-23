# Histórico de versões

## v0.3.0 — Fio do Raciocínio (2026-10-22)

- `feat`: navegação por conexões com setas ←/→ e botões de toque; escolha explícita nas bifurcações.
- `feat`: retomada guiada a partir da pausa, recapitulação das vozes e destaque temporário do caminho percorrido.
- `feat`: registro local de sessões com horários e tempo ativo estimado, limite de 5 minutos sem interação e interrupção quando o app fica oculto.
- `feat`: varredura de possíveis pausas por intervalo ≥ 1h entre blocos ligados; inserção confirmada, reversível e explicitamente marcada como sugestão retrospectiva.
- `feat`: marcação manual de falácias nos blocos, com status e justificativa.
- `feat`: relatório final/parcial com contagem de tipos, vozes, conexões, tempo, sessões, pausas e distribuição aproximada por cenário.
- `feat`: prompt de xadrez para copiar ou salvar, com restrições de PGN e apresentação simbólica de lances.
- `fix`: apresentação do dicionário — definição e exemplo completos para cada termo.
- `fix`: evitar que o arraste do fundo capture clique no botão "Encerrar destaque".
- `compat`: schemaVersion 3 com importação não destrutiva de reflexões antigas; cache offline `contraponto-0.3.0`.
- `test`: 30 testes automatizados (10 adicionais) e smoke tests de interface com armazenamento simulado.

## v0.2.2 — Feedback de Classificação

- Janela-resumo e toast após classificação em lote, mostrando analisados, alterados e mantidos.

## v0.2.1 — Revisão em Lote

- Modal adaptado a telas menores; seleção e revisão individual de classificações em lote; menus alfabéticos.

## v0.2.0 — Pensamento Livre

- Assistente local de classificação, minidicionário, comentários, metacomentários, pausas, notas laterais e concordâncias provisórias.

## v0.1.0 — Primeiro Pensamento

- Mapa visual, editor de nós/conexões, múltiplas vozes, histórico, exportação e armazenamento local.
