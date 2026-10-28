# AGENTS.md

Instruções para agentes (opencode/IA) que trabalham neste repositório.

## O que é este repositório

Editor web de artigos LaTeX para WPMC 2026 e CNC 2026, com modelos de artigo intercambiáveis. Todo o conteúdo é em português (pt-BR).

## Estrutura e convenções

- `artigos/<evento>-<ano>/<NN-slug>/artigo.tex` — um artigo por pasta.
- `artigos/<evento>-<ano>/<NN-slug>/artigo.meta.json` — declara o modelo, título e data de atualização.
- `modelos/<evento>-<ano>/` — estilo LaTeX + novo-artigo.tex com marcadores + modelo.json.
- `editor/` — código Python do servidor (`main.py` = rotas, `compiler.py` = pdflatex, `modelos.py` = modelos). `editor/static/` é o front-end sem build step (vanilla JS).
- `build/` — saídas de compilação (gitignored). Nunca versione.
- Arquivos `.tex` são UTF-8 sem BOM; mantenha a codificação ao editar.
- Código Python: sem comentários internos e sem docstrings.
- Artigos são autocontidos: bibliografia inline, sem imagens externas fora da pasta do artigo.

## Modelo de artigo

Cada artigo declara o modelo em `artigo.meta.json` (campo `modelo`). A compilação adiciona `modelos/<modelo>/` ao `TEXINPUTS`, então o mesmo editor compila artigos WPMC 2026 e CNC 2026 com estilos diferentes.

## Como executar

```bash
uv sync
uv run uvicorn editor.main:app --reload   # http://localhost:8000
```

Compilação LaTeX: a máquina local pode não ter `pdflatex` — usar `docker compose up --build` (imagem já inclui o TeX Live). A API responde `pdflatex: false` em `/api/status` quando indisponível; isso não é bug.

## Validação

Não há testes automatizados. Antes de concluir mudanças em Python:

```bash
uv run python -m compileall editor
```

E suba o servidor uma vez para checar `GET /api/artigos` e `GET /api/status`. Mudanças em `editor/static/` podem ser validadas pelo navegador (sem etapa de build).

## Regras importantes

- Nunca apague ou sobrescreva um `artigos/**/artigo.tex` sem confirmação explícita do usuário.
- Não introduza dependências novas sem necessidade; o projeto é intencionalmente enxuto (FastAPI + uvicorn apenas).
- `pyproject.toml` e `uv.lock` devem permanecer consistentes: após mudar dependências, rode `uv lock` (ou `uv sync`).
- Commits: mensagens curtas em português.
