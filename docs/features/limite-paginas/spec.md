---
title: Limite de páginas por modelo
---

# Limite de páginas por modelo

## Problema

Cada evento tem um limite de páginas (WPMC e CNC têm regras próprias), e um artigo acima do limite pode ser rejeitado sem revisão. Hoje a prévia mostra "N páginas", mas o autor precisa lembrar o limite de cada evento e comparar de cabeça, e o mesmo artigo existe em versões para modelos diferentes.

## Solução

Cada modelo pode declarar seu limite de páginas. Com um artigo aberto e o PDF na prévia, o contador passa a mostrar "7 / 6 páginas" e fica em destaque de alerta quando o PDF passa do limite. Modelos sem limite declarado continuam mostrando só "N páginas".

## Histórias de usuário

1. Como autor, quero ver o limite de páginas do evento ao lado da contagem do PDF, para saber quanto espaço ainda tenho.
2. Como autor, quero um alerta visual quando o PDF passa do limite, para cortar texto antes de submeter.
3. Como mantenedor de modelos, quero declarar o limite no `modelo.json`, para configurar cada evento sem mexer no código.
4. Como autor de um artigo cujo modelo não declara limite, quero que a prévia continue como hoje.

## Decisões de implementação

- Novo campo opcional `limite_paginas` (inteiro) no `modelo.json`. A listagem de modelos já devolve o JSON inteiro, então o back-end não muda.
- O front-end, que já carrega os modelos, cruza o modelo do artigo aberto com o total de páginas do PDF ao atualizar o contador.
- O alerta é só visual (classe CSS de alerta no contador). Não bloqueia compilação nem download.
- Sem dependências novas.

## Decisões de teste

- Seam: navegador. Com `limite_paginas` menor que o total do PDF, o contador mostra "N / L páginas" em alerta. Com limite maior ou igual, mostra "N / L páginas" sem alerta. Sem o campo, mostra "N páginas".
- `GET /api/modelos` devolve o campo novo.

## Fora do escopo

- Descontar páginas de referências ou apêndices no cálculo.
- Limites de palavras ou de tamanho do resumo.

## Questões em aberto

- Quais são os limites reais do WPMC 2026 e do CNC 2026? Precisam ser confirmados nas chamadas dos eventos antes de preencher os `modelo.json`.
- O limite dos eventos inclui as referências? Se não incluir, a contagem simples pode gerar falso alerta. Por enquanto fica fora do escopo.
