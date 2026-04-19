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
