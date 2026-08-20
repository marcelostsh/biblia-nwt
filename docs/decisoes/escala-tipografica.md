# Escala tipográfica única

**Data:** 2026-08-20

## Problema

Cada tela escolhia o tamanho de fonte no olho: `0,8rem` no cabeçalho de
testamento, `0,875rem` no nome do livro, `1,1rem` no número do capítulo,
`1,15rem` no breadcrumb e no campo de busca, `21px` cravado no título da barra.

Duas consequências:

1. **A hierarquia estava invertida.** O nome do livro — o que a pessoa abriu o
   app pra encontrar — era o texto *menor* da tela (14px). O breadcrumb, que só
   informa onde ela está, era o *maior* (18,4px).
2. **Ajustar a fonte piorava.** Como os tamanhos eram múltiplos diferentes da
   base, aumentar a base afastava ainda mais os extremos: o breadcrumb ganhava
   mais pixels que o nome do livro a cada passo. E o que era `px` fixo (título,
   ícones, altura da barra) não acompanhava nada.

## Decisão

Uma escala só, em `App.vue`, derivada de `--font-size-ui`:

| token      | fator  | uso                                          |
| ---------- | ------ | -------------------------------------------- |
| `--fs-xs`  | 0,75×  | rótulos de seção, legenda ("50 cap.")        |
| `--fs-sm`  | 0,875× | texto secundário                             |
| `--fs-md`  | 1×     | padrão de interface, breadcrumb              |
| `--fs-lg`  | 1,125× | nome do livro, número do capítulo, busca     |
| `--fs-xl`  | 1,3×   | título da barra                              |

Regra de hierarquia: **conteúdo acima de navegação.** O item principal de cada
tela usa `--fs-lg`; a navegação fica em `--fs-md`.

Ícones e alturas de barra passaram a `em` / `max(56px, …)`: o alvo de toque de
56px continua sendo o piso, mas cresce junto quando a fonte cresce.

`--font-size-text` (leitura do versículo) segue separado de propósito — é o
único tamanho que a pessoa quer mexer sem mexer no resto do app.

## Alternativa descartada

Deixar cada tela com seu tamanho e só "acertar os números" uma vez. Resolveria a
foto de hoje e voltaria a quebrar no primeiro componente novo, porque não existe
regra escrita pra ele seguir.
