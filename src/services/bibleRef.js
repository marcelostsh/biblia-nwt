import bible from '../data/bible.json'

function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const bookIndex = bible.books.map(b => ({
  book: b,
  normName: normalize(b.name),
  normAbbrev: normalize(b.abbrev)
}))

export function findBook(name) {
  const n = normalize(name)
  return bookIndex.find(b => b.normName === n || b.normAbbrev === n)?.book
    || bookIndex.find(b => b.normName.startsWith(n) || n.startsWith(b.normName))?.book
    || null
}

export function resolveReference(ref) {
  const book = findBook(ref.book)
  if (!book) return null

  const chapter = book.chapters.find(c => c.number === ref.chapter)
  if (!chapter) return null

  const start = ref.verseStart
  const end = ref.verseEnd || start
  const verses = chapter.verses.filter(v => v.number >= start && v.number <= end)
  if (verses.length === 0) return null

  return {
    book,
    chapter,
    verses,
    verseStart: start,
    verseEnd: end,
    label: `${book.abbrev} ${chapter.number}:${start}${end > start ? '-' + end : ''}`
  }
}
