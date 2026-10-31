# Backlog de features

Ideias levantadas no brainstorm de 2026-10-30 que não entraram na primeira leva.

## Ideias

- **Duplicar artigo para outro modelo**: criar uma cópia de um artigo existente com outro modelo (ex.: wpmc-2026 → cnc-2026), em vez de copiar a pasta à mão.
- **Sumário de seções clicável**: listar os `\section`/`\subsection` do `.tex` na lateral e pular para a linha ao clicar.
- **Autosave**: salvar automaticamente após alguns segundos sem digitar (cuidado com a interação com compilar).
- **Contagem de palavras**: palavras do resumo e do corpo, para eventos com limite de palavras.

## Bugs observados

- `artigos/wpmc-2026/01-cloud-integrated-iot-mesh/` não tem `artigo.meta.json`: `compilar` lança `FileNotFoundError` (HTTP 500) e `GET /api/artigos/wpmc/2026/...` responde 404 "Metadados não encontrados".
- Código inalcançável após o `return` no tratamento de exceção de `compilar` (coberto pelo card `erros-clicaveis/01`).
