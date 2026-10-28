# Editor de Artigos

Editor web em LaTeX para editar e recompilar artigos destinados a diferentes eventos e periódicos, com suporte a modelos de artigo intercambiáveis.

## Estrutura

```
editor-artigos/
├── artigos/                 # artigos organizados por evento/ano (nao versionados)
├── modelos/                 # modelos de artigo intercambiaveis
│   ├── wpmc-2026/
│   │   ├── IEEEtran.cls
│   │   ├── novo-artigo.tex
│   │   └── modelo.json
│   └── cnc-2026/
│       ├── IEEEtran.cls
│       ├── novo-artigo.tex
│       └── modelo.json
├── editor/
│   ├── __init__.py
│   ├── main.py              # API FastAPI
│   ├── compiler.py          # compilacao LaTeX, erros e SyncTeX
│   ├── modelos.py           # modelos de artigo
│   └── static/              # interface (CodeMirror e PDF.js)
├── build/                   # saidas de compilacao (nao versionadas)
├── Dockerfile               # imagem com Python + TeX Live completo
├── docker-compose.yml
├── pyproject.toml
├── uv.lock
├── README.md
├── AGENTS.md
├── .gitignore
└── .dockerignore
```

Cada pasta de artigo contém um `artigo.tex` autocontido e um `artigo.meta.json` que declara o modelo, título e data de atualização.

## Modelos de artigo

Um modelo define a classe/estilo LaTeX e o arquivo base usado ao criar um novo artigo. Os modelos disponíveis são:

- `wpmc-2026`: baseado na classe `IEEEtran`, para submissão ao WPMC 2026.
- `cnc-2026`: baseado na classe `IEEEtran`, adaptado para o jornal CNC (Universal Wiser Publisher).

Ao criar um artigo pelo editor, você escolhe o modelo. O arquivo `novo-artigo.tex` do modelo é copiado com os marcadores `{TITULO}` e `{AUTORES}` preenchidos, e o `artigo.meta.json` grava qual modelo o artigo segue. Na compilação, a pasta do modelo é adicionada ao `TEXINPUTS`, de modo que cada artigo é compilado com o estilo correto.

## Requisitos

- [uv](https://docs.astral.sh/uv/) (Python 3.11+)
- Para compilar PDF: `pdflatex` no host **ou** Docker (recomendado)

## Executar o editor

### Com Docker (recomendado — já inclui o TeX Live)

```bash
docker compose up --build
```

Acesse <http://localhost:8000>.

### Sem Docker (precisa de pdflatex local)

```bash
uv sync
uv run uvicorn editor.main:app --reload
```

Acesse <http://localhost:8000>. Sem `pdflatex` no PATH a interface funciona normalmente, mas a compilação avisa que está indisponível.

## Usando o editor

- **Editar**: clique num artigo na lateral e edite o código LaTeX (destaque de sintaxe via CodeMirror).
- **Salvar**: botão *Salvar* ou `Ctrl+S`.
- **Compilar**: botão *Compilar* ou `Ctrl+Enter` — a saída do `pdflatex` aparece no painel inferior e o **PDF compilado abre em prévia ao lado do editor**. O botão *Baixar PDF* baixa o arquivo quando quiser; *Prévia* na barra superior reabre a visualização.
- **Painéis redimensionáveis**: arraste as divisórias entre a lista, o editor e a prévia (duplo clique restaura a largura padrão; setas do teclado ajustam quando a divisória está em foco). As larguras ficam salvas no navegador.
- **Zoom da prévia**: os botões *−*, *Ajustar* e *+* no cabeçalho da prévia controlam o tamanho das páginas; *Ajustar* volta a encaixar o PDF na largura do painel.
- **Tema**: botão *Tema* na lateral alterna entre modo claro e escuro (a preferência fica salva no navegador).
- **Prévia do PDF em claro/escuro**: no cabeçalho da prévia, os botões *PDF: Claro | Escuro* alternam a exibição do PDF (inversão de cores aplicada via CSS às páginas em canvas, sem recarregar). A preferência fica salva no navegador (`tema-pdf`); por padrão segue o tema do editor.
- **Sincronia PDF ↔ texto (SyncTeX)**: clique numa página do PDF para levar o cursor à linha correspondente do `.tex`; clique numa linha do editor para rolar a prévia até o ponto correspondente e destacá-lo. A sincronia exige `pdflatex -synctex=1` (o compilador do editor já usa essa opção) e o comando `synctex` no PATH. Depois de mudar o texto, compile novamente para atualizar os dados de sincronização.
- **Novo artigo**: botão *+ Novo artigo* cria uma pasta a partir do modelo escolhido, preenchendo os marcadores `{TITULO}` e `{AUTORES}`.
- **Gerenciar arquivos**: painel lateral permite criar pastas, fazer upload de arquivos, baixar, renomear e deletar arquivos dentro da pasta do artigo.
- **Deletar artigo**: botão *Deletar artigo* remove permanentemente a pasta do artigo (exige confirmação).

Também é possível editar os `.tex` diretamente (inclusive com o opencode) — o editor web só lê e grava os mesmos arquivos.

## Compilação manual (sem a interface)

```bash
pdflatex -interaction=nonstopmode -synctex=1 -output-directory=build/<evento>-<ano>/<slug> artigos/<evento>-<ano>/<slug>/artigo.tex
```

O `modelos/<modelo>/` precisa estar no `TEXINPUTS` (o `editor/compiler.py` cuida disso automaticamente; cada compilação roda duas passagens para resolver `\cite`).

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | verificação simples de disponibilidade (`{"ok": true}`) |
| GET | `/api/status` | disponibilidade do `pdflatex` e do `synctex`, nº de artigos |
| GET | `/api/modelos` | lista de modelos de artigo disponíveis |
| GET | `/api/modelos/{nome}` | detalhe de um modelo (campos, marcadores) |
| GET | `/api/artigos` | lista de artigos com evento, ano, título e modelo |
| GET/PUT | `/api/artigos/{evento}/{ano}/{slug}` | ler/salvar o `.tex` |
| POST | `/api/artigos` | criar artigo a partir de um modelo (`modelo`, `slug`, `título`) |
| POST | `/api/artigos/{evento}/{ano}/{slug}/compilar` | compilar e retornar log/erros |
| GET | `/api/artigos/{evento}/{ano}/{slug}/synctex/ida` | linha do `.tex` → página e caixas no PDF |
| GET | `/api/artigos/{evento}/{ano}/{slug}/synctex/volta` | ponto do PDF → linha do `.tex` |
| GET | `/api/artigos/{evento}/{ano}/{slug}/pdf` | servir o PDF gerado (inline; `?download=1` para baixar) |
| GET | `/api/artigos/{evento}/{ano}/{slug}/files` | listar arquivos e pastas do artigo |
| GET | `/api/artigos/{evento}/{ano}/{slug}/files/{caminho}` | baixar arquivo ou listar subpasta |
| PUT | `/api/artigos/{evento}/{ano}/{slug}/files/{caminho}` | upload/sobrescrever arquivo |
| POST | `/api/artigos/{evento}/{ano}/{slug}/files` | criar nova pasta |
| DELETE | `/api/artigos/{evento}/{ano}/{slug}/files/{caminho}` | deletar arquivo ou pasta vazia |
| POST | `/api/artigos/{evento}/{ano}/{slug}/files/move` | renomear ou mover arquivo/pasta |
| DELETE | `/api/artigos/{evento}/{ano}/{slug}` | deletar artigo completo |
