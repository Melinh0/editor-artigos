---
id: 02
title: Pular para a linha do erro ao clicar
blocked_by: [01]
labels: [feature:erros-clicaveis]
---

# Pular para a linha do erro ao clicar

## O que construir

Cada erro devolvido pela compilação passa a carregar o número da linha lido de `l.NN`. O painel de log mostra, acima do log bruto, uma lista com um item por erro, com a mensagem e "linha NN". Clicar no item rola o editor até a linha, posiciona o cursor e a destaca, como a sincronia do SyncTeX já faz.

## Critérios de aceite

- [ ] A resposta de compilar traz, para cada erro, a mensagem e a linha (`null` quando não há `l.NN`).
- [ ] No painel de log, cada erro com linha é clicável e leva cursor e destaque para a linha correta do `artigo.tex`.
- [ ] Erros sem linha aparecem na lista, mas sem link.
- [ ] O log bruto continua visível abaixo da lista.
- [ ] Com o formato novo de `erros`, o caso "sem erro explícito no log" continua sendo exibido.

## Notas

Cobre as histórias 2, 3 e 4. Reaproveitar `destacarLinhaEditor(linha)` em `app.js`. O `<pre id="log">` atual não comporta itens clicáveis: a lista precisa de um elemento próprio no `#painel-log`. Antes de começar, resolver a questão em aberto do spec sobre o formato de `erros`.
