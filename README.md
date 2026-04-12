# Bíblia NWT - Leitor Mobile

Leitor da Bíblia (Tradução do Novo Mundo) em formato web, mobile only, inspirado no visual do [jw.org/biblia](https://www.jw.org/pt/biblioteca/biblia/).

**Repo:** https://github.com/marcelostsh/biblia-nwt

## Stack

- **Vue 3** + **Vite 8**
- Dados extraídos do EPUB `nwt_T.epub` → `src/data/bible.json`
- Script de parsing: `parse-epub.js`

## Status

- [x] EPUB parseado (66 livros, 1189 capítulos, 31078 versículos)
- [x] Wizard horizontal com slide (Livro → Capítulo → Versículos)
- [x] Swipe back (arrastar pra direita volta)
- [x] Input de busca fixo no rodapé
- [x] Filtro em tempo real com auto-avanço
- [x] Enter/OK pega primeiro da lista
- [x] Teclado texto (livros) / numérico (capítulos e versículos)
- [x] Filtro de livros com startsWith, ignora acentos e maiúsculas
- [x] Teclado sobrepõe conteúdo (não empurra)
- [x] Input continua aberto se navegou via busca, fecha se tocou na tela
- [x] Teclado fecha ao chegar no versículo

## Conceito

Aplicação **mobile only**, pensada para uso com uma mão. Navegação simples e rápida até qualquer versículo da Bíblia.

## Navegação - Wizard com Slide Horizontal

Fluxo linear em 3 etapas com transição de slide horizontal:

```
[Livro] → [Capítulo] → [Versículo/Conteúdo]
```

### Tela 1 - Seleção de Livro
- Lista dos 66 livros em grid 2 colunas
- Separados por Escrituras Hebraicas / Gregas

### Tela 2 - Seleção de Capítulo
- Grid 5 colunas com números dos capítulos

### Tela 3 - Versículos (Conteúdo)
- Texto do capítulo com versículos numerados
- Highlight temporário ao navegar via busca

### Gestos (Swipe)
- **Swipe para direita (voltar):** sempre permitido
- **Avançar:** somente selecionando uma opção

## Input de Busca no Rodapé

Input fixo no rodapé, sempre visível, posicionado para o polegar.

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

## Visual

Inspirado no jw.org:
- Design limpo, fundo #f5f5f5
- Header azul #4a6da7
- Cards brancos com bordas suaves
- Tipografia sóbria, versículos com número em azul superscript

## Estrutura

```
src/
  App.vue              — lógica principal, wizard, swipe, busca
  main.js              — entry point
  assets/main.css      — reset e estilos globais
  components/
    BookSelector.vue   — grid de livros
    ChapterSelector.vue — grid de capítulos
    VerseViewer.vue    — exibição dos versículos
    SearchInput.vue    — input fixo no rodapé
  data/
    bible.json         — dados parseados (66 livros, ~7MB)
parse-epub.js          — script Node que parseia o EPUB
epub_temp/             — EPUB extraído (não vai pro git)
nwt_T.epub             — EPUB original (não vai pro git)
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
