// Guarda as análises de capítulo já geradas pela IA, pra não pagar/esperar duas vezes.
// Cada capítulo é uma chave própria — assim uma análise corrompida não derruba as outras.

const PREFIX = 'summary:'
const VERSION = 1

function key(bookName, chapterNumber) {
  return `${PREFIX}${VERSION}:${bookName}:${chapterNumber}`
}

export function getSummary(bookName, chapterNumber) {
  try {
    const raw = localStorage.getItem(key(bookName, chapterNumber))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.overview) || !Array.isArray(data.themes)) return null
    return data
  } catch {
    return null
  }
}

export function saveSummary(bookName, chapterNumber, data) {
  const payload = JSON.stringify({ overview: data.overview, themes: data.themes })
  try {
    localStorage.setItem(key(bookName, chapterNumber), payload)
  } catch {
    // Espaço estourou: descarta metade das análises antigas e tenta de novo.
    if (!evictHalf()) return
    try {
      localStorage.setItem(key(bookName, chapterNumber), payload)
    } catch {
      // Desiste em silêncio — a análise já está na tela, só não fica guardada.
    }
  }
}

export function clearSummary(bookName, chapterNumber) {
  localStorage.removeItem(key(bookName, chapterNumber))
}

function evictHalf() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  if (!keys.length) return false
  keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k))
  return true
}
