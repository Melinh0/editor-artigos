---
title: Erros de compilação clicáveis
---

# Erros de compilação clicáveis

## Problema

Quando a compilação falha, quem está editando o artigo vê "pdflatex falhou na primeira passagem" e um log bruto de milhares de linhas. Como o pdflatex roda em `nonstopmode`, qualquer erro faz o processo sair com código diferente de zero, e nesse caminho o compilador devolve só a mensagem genérica, sem os erros já extraídos do log. Para achar o erro a pessoa rola o log procurando `!` e depois procura a linha `l.NN` no editor manualmente.

## Solução

O painel de log passa a mostrar, no topo, a lista dos erros reais do LaTeX (`! Undefined control sequence`, `! Missing $ inserted` etc.) com o contexto e o número da linha. Clicar num erro leva o cursor do editor para a linha e a destaca. O log bruto continua disponível abaixo.

## Histórias de usuário

1. Como autor, quero ver a mensagem real do erro do LaTeX quando a compilação falha, para saber o que corrigir sem ler o log inteiro.
2. Como autor, quero ver o número da linha de cada erro, para localizá-lo no `.tex`.
3. Como autor, quero clicar num erro e ter o cursor posicionado e destacado na linha, para corrigir rapidamente.
4. Como autor, quero que um erro sem número de linha (ou vindo de outro arquivo via `\input`) apareça na lista sem link, para não ser levado a uma linha errada.
5. Como autor, quero continuar tendo acesso ao log bruto completo, para os casos que a lista não cobre.
6. Como autor, quero que um timeout continue mostrando a mensagem de tempo limite excedido, para não confundir com erro de sintaxe.

## Decisões de implementação

- O compilador aplica a extração de erros também quando o pdflatex sai com código diferente de zero. Se nada for extraído, cai na mensagem genérica atual. O código morto após o `return` em `compilar` sai junto.
- A extração de erros passa a devolver o número da linha lido de `l.NN`.
- Proposta de contrato: `erros` vira uma lista de objetos `{mensagem, linha}` (`linha` pode ser `null`). Ver questões em aberto.
- O front-end renderiza os erros como itens clicáveis no painel de log e reaproveita o destaque de linha que o SyncTeX já usa.
- Sem dependências novas.

## Decisões de teste

- Seam: a rota `POST /api/artigos/{evento}/{ano}/{slug}/compilar`, com um artigo de teste contendo `\foo` indefinido numa linha conhecida. Verificar que a resposta traz a mensagem do erro e a linha certa.
- No navegador: clicar no erro posiciona o cursor na linha esperada.
- Validação padrão do projeto: `uv run python -m compileall editor`.

## Fora do escopo

- Abrir outro arquivo quando o erro vem de `\input`/`\include`. O artigo é autocontido, e o editor só edita `artigo.tex`.
- Tradução ou explicação das mensagens de erro.

## Questões em aberto

- Trocar o formato de `erros` (de `list[str]` para objetos) ou manter `erros` e adicionar um campo novo (ex.: `erros_detalhados`)? O único consumidor hoje é o próprio front-end, então trocar parece seguro.
