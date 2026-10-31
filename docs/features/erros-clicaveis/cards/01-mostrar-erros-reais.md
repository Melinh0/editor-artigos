---
id: 01
title: Mostrar os erros reais do LaTeX quando a compilação falha
blocked_by: []
labels: [feature:erros-clicaveis]
---

# Mostrar os erros reais do LaTeX quando a compilação falha

## O que construir

Quando o pdflatex sai com código diferente de zero (o que sempre acontece em `nonstopmode` quando há erro), o compilador extrai os erros do log acumulado e os devolve em `erros`, no lugar da mensagem genérica "pdflatex falhou na primeira passagem". O painel de log do editor já exibe `erros`, então a melhoria aparece sem mudar o front-end.

## Critérios de aceite

- [ ] Um artigo com `\foo` indefinido, ao compilar, mostra no painel `! Undefined control sequence.` seguido do contexto até `l.NN`.
- [ ] Se o log não tiver nenhuma linha `!`, a mensagem genérica atual continua aparecendo.
- [ ] Timeout continua devolvendo "A compilação excedeu o tempo limite.".
- [ ] O código inalcançável após o `return` no tratamento de exceção de `compilar` foi removido.
- [ ] `uv run python -m compileall editor` passa.

## Notas

Cobre as histórias 1, 5 e 6. Ponto exato: o `except (subprocess.TimeoutExpired, RuntimeError)` em `compilar`. `_extrair_erros` já existe e pode ser reaproveitada como está.
