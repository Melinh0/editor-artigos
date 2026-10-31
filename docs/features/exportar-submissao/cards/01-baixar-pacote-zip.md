---
id: 01
title: Baixar pacote de submissão .zip pelo editor
blocked_by: []
labels: [feature:exportar-submissao]
---

# Baixar pacote de submissão .zip pelo editor

## O que construir

Com um artigo aberto, o autor clica em "Exportar .zip" na barra do artigo e baixa um pacote com os arquivos da pasta do artigo (sem `artigo.meta.json`), os `.cls/.bst/.sty` do modelo do artigo e o `artigo.bbl` da última compilação, se houver. O back-end serve o pacote numa rota nova, montado em memória com a stdlib.

## Critérios de aceite

- [ ] `GET /api/artigos/cnc/2026/01-cloud-integrated-iot-mesh/exportar` devolve um `.zip` com `artigo.tex`, `Mybib.bib`, `IEEEtran.cls` e `IEEEtran.bst`, sem `artigo.meta.json`, `novo-artigo.tex` ou `modelo.json`.
- [ ] Depois de compilar, o zip também contém `artigo.bbl`. Sem compilação prévia, o zip vem sem ele e sem erro.
- [ ] Subpastas do artigo (ex.: `figuras/`) aparecem com a mesma estrutura no zip.
- [ ] Artigo inexistente devolve 404, e evento/slug inválidos devolvem 400, como as outras rotas.
- [ ] O botão "Exportar .zip" fica desabilitado sem artigo aberto e dispara o download com um artigo aberto.
- [ ] Descompactado numa pasta vazia, o pacote compila com pdflatex + bibtex (testar no container Docker).
- [ ] O README lista a rota nova na tabela de API.
- [ ] `uv run python -m compileall editor` passa.

## Notas

Cobre as histórias 1 a 6. Reaproveitar `_validar_evento_ano`, `_validar_slug`, `_caminho_pasta_artigo`, `_ler_meta` (main.py) e `caminho_modelo` (modelos.py). O artigo `artigos/wpmc-2026/01-…` não tem `artigo.meta.json` (ver backlog). Nesse caso a rota deve responder com erro claro em vez de 500. Resolver antes as questões em aberto do spec (PDF no zip, nome do arquivo).
