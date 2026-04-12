# Bíblia NWT - Leitor Mobile

Leitor da Bíblia (Tradução do Novo Mundo) em formato web, mobile only, inspirado no visual do [jw.org/biblia](https://www.jw.org/pt/biblioteca/biblia/).

## Stack

- **Vue 3** + **Vite**
- Dados extraídos do EPUB `nwt_T.epub` (já extraído em `epub_temp/`)

## Conceito

Aplicação **mobile only**, pensada para uso com uma mão. Navegação simples e rápida até qualquer versículo da Bíblia.

## Navegação - Wizard com Slide Horizontal

Fluxo linear em 3 etapas com transição de slide horizontal:

```
[Livro] → [Capítulo] → [Versículo/Conteúdo]
```

### Tela 1 - Seleção de Livro
- Lista dos 66 livros da Bíblia
- Ao selecionar um livro, avança com slide para a próxima tela

### Tela 2 - Seleção de Capítulo
- Grid com os números dos capítulos do livro selecionado
- Ao selecionar um capítulo, avança com slide para a próxima tela

### Tela 3 - Versículos (Conteúdo)
- Exibe o texto do capítulo com os versículos

### Gestos (Swipe)
- **Swipe para direita (voltar):** sempre permitido, volta para a tela anterior
- **Avançar:** somente selecionando uma opção (não é possível avançar com swipe sem escolher)

## Input de Busca no Rodapé

Input fixo no rodapé da tela, posicionado para fácil acesso com o polegar.

### Comportamento

- Filtra as opções **em tempo real** conforme o usuário digita
- Se restar **apenas uma ocorrência**, avança automaticamente para o próximo slide
- **Enter/OK no teclado** seleciona o **primeiro item da lista filtrada** e avança (não anula o auto-avanço, são dois caminhos complementares)
- O autocomplete, uma vez acionado, **permanece aberto** durante toda a navegação
- O input **limpa automaticamente** a cada transição de slide, pronto para o próximo filtro
- O input só **fecha** quando o conteúdo final (versículos) é exibido

### Teclado por Etapa

| Etapa | Teclado | Exemplo |
|-------|---------|---------|
| Livro | Texto | digitar "gên" → filtra → "Gênesis" → avança |
| Capítulo | Numérico | digitar "3" → filtra → avança |
| Versículo | Numérico | digitar "16" → abre conteúdo → fecha input |

### Fluxo Completo com Input

```
"gên" → auto-avança → "3" → auto-avança → "16" → exibe versículo → input fecha
```

Chegar em qualquer versículo com poucos toques, sem precisar dar scroll na lista.

## Visual

Inspirado no jw.org:
- Design limpo, fundo claro
- Tipografia sóbria e legível
- Cores neutras com destaques em azul/cinza

## Dados

- EPUB original: `nwt_T.epub`
- Conteúdo extraído: `epub_temp/OEBPS/` (3940 arquivos XHTML)
- Os XHTMLs precisam ser parseados para extrair a estrutura de livros, capítulos e versículos

## Setup

```sh
npm install
npm run dev
```
