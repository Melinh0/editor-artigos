---
title: Avisos de compilação
---

# Avisos de compilação

## Problema

Um artigo pode compilar com sucesso e ainda sair com `[?]` no lugar de citações, `??` no lugar de referências cruzadas, ou texto vazando da margem (overfull hbox). O editor só considera erros `!`: nesses casos ele mostra "PDF pronto", e o autor só descobre o problema lendo o PDF com atenção ou o log bruto. Num envio para evento, isso é retrabalho ou um artigo submetido com defeito.

## Solução

Depois de compilar, o editor mostra quantos avisos relevantes existem ("PDF pronto · 3 avisos") e o painel de log ganha uma seção "Avisos" listando cada um: tipo, mensagem e linha do `.tex` quando houver. Avisos não impedem o PDF.

## Histórias de usuário

1. Como autor, quero saber que há citações indefinidas depois de compilar, para não submeter um artigo com `[?]`.
2. Como autor, quero saber que há referências cruzadas indefinidas (`\ref`/`\label`), para corrigir os `??`.
3. Como autor, quero ver os overfull hbox com a linha correspondente, para ajustar o texto que vaza da coluna.
4. Como autor, quero ver os avisos do bibtex (entradas com campos faltando), para corrigir o `.bib`.
5. Como autor, quero ver a contagem de avisos no indicador mesmo com o PDF gerado, para não precisar abrir o log.
6. Como autor, não quero ver avisos falsos da primeira passagem (refs ainda não resolvidas), para confiar na lista.

## Decisões de implementação

- Os warnings do LaTeX são lidos só do log da **última passagem** do pdflatex, porque a primeira sempre acusa referências indefinidas. Os warnings do bibtex vêm da saída do bibtex.
- Tipos reconhecidos: citação indefinida, referência indefinida, overfull hbox, underfull hbox (ver questões em aberto) e `Warning--` do bibtex.
- A linha vem de "on input line N" ou "at lines N--M" (usa N). Sem linha, `null`.
- A resposta de compilar ganha `avisos: [{tipo, mensagem, linha}]`. `ok` não muda por causa de avisos.
- Avisos repetidos (mesma mensagem e linha) aparecem uma vez só.
- Sem dependências novas.

## Decisões de teste

- Seam: a rota `POST /api/artigos/{evento}/{ano}/{slug}/compilar`, com um artigo de teste contendo `\cite{inexistente}` e `\ref{inexistente}`. Verificar que `avisos` traz os dois com as linhas certas e que `ok` continua `true`.
- Validação padrão: `uv run python -m compileall editor`.

## Fora do escopo

- Tornar avisos clicáveis aqui. Se erros-clicaveis estiver pronto, o mesmo mecanismo vale e pode ser reaproveitado.
- Warnings de pacote genéricos (`Package xyz Warning`) e de fonte.

## Questões em aberto

- Incluir underfull hbox? Costumam ser muitos e pouco acionáveis. Sugestão: deixar de fora no início.
