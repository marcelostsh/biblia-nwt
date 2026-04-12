# Bíblia NWT - Leitor Mobile

Leitor da Bíblia (Tradução do Novo Mundo) em formato web, mobile only, inspirado no visual do [jw.org/biblia](https://www.jw.org/pt/biblioteca/biblia/).

**Repo:** https://github.com/marcelostsh/biblia-nwt

## Stack

- **Vue 3** + **Quasar Framework** + **Vite 8**
- Componentes Quasar (Material Design): `q-card`, `q-btn`, `q-input`, `q-toolbar`, `q-layout`, etc.
- Dados extraídos do EPUB `nwt_T.epub` → `src/data/bible.json`
- Script de parsing: `parse-epub.js`

## Status

- [x] EPUB parseado (66 livros, 1189 capítulos, 31078 versículos)
- [x] Wizard horizontal com slide (Livro → Capítulo → Versículos)
- [x] Swipe entre capítulos (esquerda = próximo, direita = anterior)
- [x] Botão voltar no header → volta direto pra seleção de livros
- [x] Setas de navegação de capítulos no header
- [x] Input de busca fixo no rodapé
- [x] Filtro em tempo real com auto-avanço
- [x] Enter/OK pega primeiro da lista
- [x] Teclado texto (livros) / numérico (capítulos e versículos)
- [x] Filtro de livros com startsWith, ignora acentos e maiúsculas
- [x] Teclado sobrepõe conteúdo (não empurra)
- [x] Input continua aberto se navegou via busca, fecha se tocou na tela
- [x] Teclado fecha ao chegar no versículo

## Navegação

### Fluxo

```
[Livro] → [Capítulo] → [Versículos]
```

### Tela 1 - Seleção de Livro
- Cards Quasar em grid 2 colunas com ripple
- Separados por Escrituras Hebraicas / Gregas

### Tela 2 - Seleção de Capítulo
- Botões Quasar outline em grid 5 colunas

### Tela 3 - Versículos (Conteúdo)
- Texto do capítulo em q-card com versículos numerados
- Highlight temporário ao navegar via busca
- **Swipe horizontal** navega entre capítulos
- Setas no header para navegação sem swipe

### Gestos
- **Na leitura:** swipe esquerda/direita = próximo/anterior capítulo
- **Botão voltar** (header) = volta pra seleção de livros

## Input de Busca no Rodapé

Input Quasar (`q-input`) fixo no rodapé, sempre visível, posicionado para o polegar.

### Comportamento

- Filtra em **tempo real** conforme digita
- Livros: **startsWith**, ignora acentos e maiúsculas ("gen" → Gênesis)
- Se restar **1 ocorrência** → avança automaticamente
- **Enter/OK** → seleciona primeiro da lista e avança
- Navegou via **busca** → input continua aberto no próximo slide
- Navegou via **toque na lista** → input fecha
- Ao chegar no **versículo** → teclado fecha (blur)
- Input **limpa** a cada transição

### Teclado por Etapa

| Etapa | Teclado | Exemplo |
|-------|---------|---------|
| Livro | Texto | "gen" → Gênesis → avança |
| Capítulo | Numérico | "3" → avança |
| Versículo | Numérico | "16" → scroll + highlight → fecha |

### Fluxo Completo

```
"gen" → auto-avança → "3" → auto-avança → "16" → exibe versículo → teclado fecha
```

## Estrutura

```
src/
  App.vue              — layout Quasar, wizard, swipe entre capítulos, busca
  main.js              — entry point + setup Quasar
  components/
    BookSelector.vue   — grid de livros (q-card + v-ripple)
    ChapterSelector.vue — grid de capítulos (q-btn outline)
    VerseViewer.vue    — exibição dos versículos (q-card)
    SearchInput.vue    — input fixo no rodapé (q-input)
  data/
    bible.json         — dados parseados (66 livros, ~7MB)
parse-epub.js          — script Node que parseia o EPUB
```

## Setup

```sh
npm install
npm run dev
```

Para re-parsear o EPUB (se necessário):
```sh
node parse-epub.js
```
