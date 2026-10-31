---
title: Exportar pacote de submissão (.zip)
---

# Exportar pacote de submissão (.zip)

## Problema

Para submeter o fonte LaTeX a um evento ou periódico, o autor precisa juntar à mão o `artigo.tex`, o `.bib`, as figuras, os arquivos de estilo do modelo (`.cls`, `.bst`, `.sty`, que ficam fora da pasta do artigo) e muitas vezes o `.bbl` gerado. Esquecer um arquivo quebra a compilação do lado do evento.

## Solução

Um botão "Exportar .zip" na barra do artigo baixa um pacote autocontido que compila sozinho: os arquivos da pasta do artigo, os arquivos de estilo do modelo e o `.bbl` da última compilação, quando existir.

## Histórias de usuário

1. Como autor, quero baixar um `.zip` com o fonte completo do artigo num clique, para enviar ao evento.
2. Como autor, quero que o `.zip` inclua os arquivos de estilo do modelo, para que o pacote compile fora do editor.
3. Como autor, quero que o `.zip` inclua o `.bbl` quando o artigo já foi compilado, porque alguns sistemas de submissão não rodam bibtex.
4. Como autor, não quero arquivos internos do editor (`artigo.meta.json`) nem o template (`novo-artigo.tex`, `modelo.json`) no pacote.
5. Como autor, quero exportar mesmo sem ter compilado, recebendo o pacote sem `.bbl`.
6. Como autor, quero uma mensagem clara se o artigo não existe mais.

## Decisões de implementação

- Nova rota `GET /api/artigos/{evento}/{ano}/{slug}/exportar`, que usa as validações de evento/ano/slug já existentes e responde 404 para artigo inexistente.
- O `.zip` é montado em memória com `zipfile` + `io` da stdlib. Sem dependência nova.
- Conteúdo: todos os arquivos da pasta do artigo, com subpastas, exceto `artigo.meta.json`. Arquivos `.cls`, `.bst` e `.sty` da pasta do modelo declarado no meta. `artigo.bbl` do diretório de build, se existir. Tudo na raiz do zip, mantendo as subpastas do artigo.
- Botão na barra do artigo, habilitado quando há artigo aberto, com o mesmo padrão do "Baixar PDF".
- A tabela de API do README ganha a rota nova.

## Decisões de teste

- Seam: a rota. `curl -o pacote.zip .../exportar` e `unzip -l pacote.zip` mostram os arquivos esperados. Descompactar numa pasta vazia e rodar pdflatex + bibtex lá deve produzir o PDF (no container Docker).
- Validação padrão: `uv run python -m compileall editor` e subir o servidor uma vez.

## Fora do escopo

- Achatar `\input`/`\include` num único `.tex`.
- Remover comentários do `.tex` (alguns eventos pedem; pode virar opção depois).

## Questões em aberto

- Incluir o PDF compilado no zip? Sugestão: não, porque o PDF costuma ser enviado em outro campo do sistema de submissão.
- Nome do arquivo: `<slug>-<evento>-<ano>.zip` está bom?
