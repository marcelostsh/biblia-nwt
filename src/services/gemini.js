const BOOK_LIST = [
  'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes',
  'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas',
  'Esdras', 'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes',
  'Cântico de Salomão', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel',
  'Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque',
  'Sofonias', 'Ageu', 'Zacarias', 'Malaquias', 'Mateus', 'Marcos', 'Lucas', 'João',
  'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses',
  'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo',
  'Tito', 'Filêmon', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João',
  '3 João', 'Judas', 'Apocalipse'
]

export async function searchBibleTopics(query) {
  const apiKey = localStorage.getItem('gemini_api_key')
  const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash'

  if (!apiKey) throw new Error('API key do Gemini não configurada')

  const prompt = `Você é um especialista na Bíblia (Tradução do Novo Mundo das Escrituras Sagradas).

O usuário quer encontrar textos bíblicos sobre: "${query}"

Retorne tópicos agrupando referências bíblicas relevantes. Use APENAS os nomes exatos de livros desta lista:
${BOOK_LIST.join(', ')}

Regras:
- De 2 a 6 tópicos, cada um com título curto e descritivo
- Cada tópico com 2 a 8 referências
- Use somente referências que você tem certeza que existem
- Para passagens, use verseEnd; para versículo único, deixe verseEnd = verseStart`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  references: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        book: { type: 'string' },
                        chapter: { type: 'integer' },
                        verseStart: { type: 'integer' },
                        verseEnd: { type: 'integer' }
                      },
                      required: ['book', 'chapter', 'verseStart', 'verseEnd']
                    }
                  }
                },
                required: ['title', 'references']
              }
            }
          },
          required: ['topics']
        }
      }
    })
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Erro ${res.status}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Resposta vazia do Gemini')

  return JSON.parse(text)
}

export async function summarizeChapter(bookName, chapterNumber, versesText) {
  const apiKey = localStorage.getItem('gemini_api_key')
  const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash'

  if (!apiKey) throw new Error('API key do Gemini não configurada')

  const prompt = `Você é um estudioso da Bíblia (Tradução do Novo Mundo das Escrituras Sagradas) e sabe explicar com força e clareza.

Analise o capítulo ${bookName} ${chapterNumber} e produza DUAS coisas.

1) overview: divida o capítulo em 3 a 8 blocos de versículos por assunto.
- Cobrem o capítulo inteiro, em ordem, sem sobrepor faixas
- Cada bloco: verseStart, verseEnd e um resumo de 1 ou 2 frases
- Bloco de um único versículo: verseEnd = verseStart

2) themes: de 2 a 5 temas espirituais fortes que atravessam o capítulo (ex.: Esperança, Fé, Justiça, Vida eterna, Arrependimento, Amor de Deus).
- name: o tema em 1 palavra (ou 2 no máximo)
- emoji: um emoji que represente o tema
- insight: 2 a 4 frases DIRETAS e com impacto, mostrando o que o capítulo ensina sobre esse tema e por que importa para a vida de quem lê. Fale com convicção, sem ser morno nem genérico. Nunca invente nada fora do texto.
- refs: as faixas de versículos (verseStart/verseEnd) que sustentam o tema

Português do Brasil. Seja fiel ao texto; não invente.

Texto do capítulo:
${versesText}`

  const rangeSchema = {
    type: 'object',
    properties: {
      verseStart: { type: 'integer' },
      verseEnd: { type: 'integer' }
    },
    required: ['verseStart', 'verseEnd']
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            overview: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  verseStart: { type: 'integer' },
                  verseEnd: { type: 'integer' },
                  summary: { type: 'string' }
                },
                required: ['verseStart', 'verseEnd', 'summary']
              }
            },
            themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  emoji: { type: 'string' },
                  insight: { type: 'string' },
                  refs: { type: 'array', items: rangeSchema }
                },
                required: ['name', 'insight', 'refs']
              }
            }
          },
          required: ['overview', 'themes']
        }
      }
    })
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Erro ${res.status}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Resposta vazia do Gemini')

  const parsed = JSON.parse(text)
  return { overview: parsed.overview || [], themes: parsed.themes || [] }
}
