---
id: 01
title: Alertar na prévia quando o PDF passa do limite de páginas do modelo
blocked_by: []
labels: [feature:limite-paginas]
---

# Alertar na prévia quando o PDF passa do limite de páginas do modelo

## O que construir

Os `modelo.json` ganham o campo opcional `limite_paginas`. Ao compilar e abrir a prévia, o contador de páginas do artigo aberto mostra "N / L páginas" quando o modelo do artigo declara limite, e fica em estilo de alerta quando N > L. Trocar de artigo atualiza o limite de acordo com o modelo do novo artigo.

## Critérios de aceite

- [ ] `GET /api/modelos` devolve `limite_paginas` para os modelos que o declaram.
- [ ] Com o PDF abaixo ou igual ao limite, `#info-pdf` mostra "N / L páginas" sem alerta.
- [ ] Com o PDF acima do limite, `#info-pdf` mostra "N / L páginas" com estilo de alerta, visível em tema claro e escuro.
- [ ] Um artigo cujo modelo não tem `limite_paginas` mostra "N páginas", como hoje.
- [ ] O percentual de zoom continua aparecendo quando não está em "Ajustar".

## Notas

Cobre as histórias 1 a 4. Mudar `atualizarInfoPdf` em `app.js`. `abrirArtigo` precisa guardar o `modelo` que `GET /api/artigos/...` já devolve. Os modelos já são carregados por `carregarModelos`. Preencher os valores reais só depois de responder à questão em aberto do spec; sem confirmação, deixar o campo de fora dos `modelo.json`.
