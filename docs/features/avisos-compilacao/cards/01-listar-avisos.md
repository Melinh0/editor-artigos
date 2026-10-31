---
id: 01
title: Listar avisos da compilação no indicador e no painel de log
blocked_by: []
labels: [feature:avisos-compilacao]
---

# Listar avisos da compilação no indicador e no painel de log

## O que construir

O compilador extrai os warnings relevantes do log da última passagem do pdflatex e da saída do bibtex, e a resposta de compilar ganha `avisos`. No editor, o indicador mostra "PDF pronto · N avisos" quando há avisos, e o painel de log mostra a seção "Avisos" (tipo, mensagem, linha) antes do log bruto. Sem avisos, a interface fica como hoje.

## Critérios de aceite

- [ ] Um artigo com `\cite{inexistente}` compila, `ok` é `true` e `avisos` contém uma citação indefinida com a linha do `\cite`.
- [ ] `\ref{inexistente}` gera um aviso de referência indefinida com a linha.
- [ ] Um overfull hbox gera aviso com a primeira linha de "at lines N--M".
- [ ] Uma entrada do `.bib` sem campo obrigatório gera aviso `Warning--` do bibtex.
- [ ] Avisos que só aparecem na primeira passagem e somem na última não são listados.
- [ ] O indicador mostra "PDF pronto · N avisos" e o painel de log abre com a seção "Avisos".
- [ ] Um artigo sem avisos mostra só "PDF pronto", como hoje.
- [ ] `uv run python -m compileall editor` passa.

## Notas

Cobre as histórias 1 a 6. Em `compilar`, guardar separadamente o texto da última chamada a `_executar_passe` e o do bibtex, em vez de extrair os avisos de `log_completo`. Decidir a questão do underfull hbox antes de começar.
