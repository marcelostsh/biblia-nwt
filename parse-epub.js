import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OEBPS = path.join(__dirname, 'epub_temp', 'OEBPS');

// Simple HTML tag stripper
function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

// Read file as string
function readFile(name) {
  return fs.readFileSync(path.join(OEBPS, name), 'utf-8');
}

// Extract all href/text pairs matching a regex from HTML
function extractLinks(html, hrefPattern) {
  const results = [];
  const re = new RegExp(`<a[^>]+href="(${hrefPattern})"[^>]*>([^<]+)</a>`, 'g');
  let m;
  while ((m = re.exec(html)) !== null) {
    results.push({ href: m[1], text: m[2].trim() });
  }
  return results;
}

// ---- Step 1: Parse biblebooknav.xhtml to get book order, abbreviations, and links ----
const booknavHtml = readFile('biblebooknav.xhtml');

// Determine testament boundaries
const hebrewStart = booknavHtml.indexOf('Escrituras Hebraicas');
const greekStart = booknavHtml.indexOf('Escrituras Gregas');

// Extract all book links in order
const bookLinks = extractLinks(booknavHtml, '[^"]+\\.xhtml');

// ---- Step 2: Parse toc.xhtml to build a map from chapternav href -> full name ----
const tocHtml = readFile('toc.xhtml');

// Build map: href -> full book name (from biblechapternav or direct content links)
const tocLinks = extractLinks(tocHtml, '[^"]+\\.xhtml');

// Map chapternav file -> full name, and also direct content file -> full name
const fullNameMap = {};
for (const link of tocLinks) {
  if (link.href.startsWith('biblechapternav') || link.href.match(/^\d+\.xhtml$/)) {
    // Skip "Conteúdo de ..." entries - we want the actual book name entries
    if (!link.text.startsWith('Conteúdo ')) {
      fullNameMap[link.href] = link.text;
    }
  }
}

// ---- Step 3: Parse chapter content files to extract verses ----
function parseChapterFile(filename) {
  let html;
  try {
    html = readFile(filename);
  } catch (e) {
    console.error(`  WARNING: Could not read ${filename}: ${e.message}`);
    return null;
  }

  // Get chapter number from title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const titleText = titleMatch ? titleMatch[1] : '';

  // Extract chapter number from title (e.g., "Gênesis 1" -> 1, "Obadias" -> 1)
  const chNumMatch = titleText.match(/\s+(\d+)\s*$/);
  const chapterNum = chNumMatch ? parseInt(chNumMatch[1]) : 1;

  // Find all verse markers and extract text
  const verses = [];

  // Strategy: find all chapter{N}_verse{N} markers and collect text until next verse or end
  // We work with the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  if (!bodyMatch) return { number: chapterNum, verses: [] };

  let body = bodyMatch[1];

  // Remove footnote sections
  body = body.replace(/<div class="groupFootnote">[\s\S]*?<\/div>\s*(<\/div>)?/g, '');

  // Remove navigation paragraph
  body = body.replace(/<p class="w_navigation[^"]*">[\s\S]*?<\/p>/g, '');

  // Remove header
  body = body.replace(/<header>[\s\S]*?<\/header>/g, '');

  // Now extract verses by splitting on verse markers
  // Verse markers look like: <span id="chapter{C}_verse{V}"></span>
  const versePattern = /<span id="chapter\d+_verse(\d+)"><\/span>/g;

  // Find all verse positions
  const versePositions = [];
  let vm;
  while ((vm = versePattern.exec(body)) !== null) {
    versePositions.push({
      verseNum: parseInt(vm[1]),
      index: vm.index,
      matchEnd: vm.index + vm[0].length
    });
  }

  for (let i = 0; i < versePositions.length; i++) {
    const start = versePositions[i].matchEnd;
    const end = i + 1 < versePositions.length ? versePositions[i + 1].index : body.length;
    let verseHtml = body.substring(start, end);

    // Remove the verse number marker (sup tag or w_ch span)
    verseHtml = verseHtml.replace(/<span class="w_ch"><strong>\d+<\/strong>\s*<\/span>/g, '');
    verseHtml = verseHtml.replace(/<strong><sup>\d+<\/sup><\/strong>/g, '');

    // Remove footnote markers (* links)
    verseHtml = verseHtml.replace(/<span id="footnotesource\d+"><\/span>/g, '');
    verseHtml = verseHtml.replace(/<a[^>]*epub:type="noteref"[^>]*>\*<\/a>/g, '');

    // Remove page number spans
    verseHtml = verseHtml.replace(/<span[^>]*class="pageNum"[^>]*>[^<]*<\/span>/g, '');

    // Remove position spans
    verseHtml = verseHtml.replace(/<span id="pos\d+"><\/span>/g, '');

    // Remove chapter marker spans (like <span id="chapter1"></span>)
    verseHtml = verseHtml.replace(/<span id="chapter\d+"><\/span>/g, '');

    // Strip remaining HTML tags
    let text = stripTags(verseHtml);

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    if (text) {
      verses.push({
        number: versePositions[i].verseNum,
        text: text
      });
    }
  }

  return { number: chapterNum, verses };
}

// ---- Step 4: Process each book ----
const books = [];
let bookId = 0;
let currentTestament = 'hebrew';

for (const bookLink of bookLinks) {
  bookId++;
  const { href, text: abbrev } = bookLink;

  // Determine testament based on position in HTML
  const linkPos = booknavHtml.indexOf(`href="${href}"`);
  if (linkPos > greekStart) {
    currentTestament = 'greek';
  }

  // Get full name
  let fullName = fullNameMap[href] || abbrev;

  // For single-chapter books that link directly to content, we need to get the name
  // from the content file's title or from the toc
  const isSingleChapter = !href.startsWith('biblechapternav');

  console.log(`[${bookId}] ${fullName} (${abbrev}) - ${isSingleChapter ? 'single chapter' : 'multi chapter'}`);

  const chapters = [];

  if (isSingleChapter) {
    // Direct link to content file
    const chapter = parseChapterFile(href);
    if (chapter) {
      chapter.number = 1; // Force chapter 1
      chapters.push(chapter);
    }
  } else {
    // Parse chapter navigation file
    const chapNavHtml = readFile(href);
    const chapterLinks = extractLinks(chapNavHtml, '[^"]+\\.xhtml');

    for (const chLink of chapterLinks) {
      // Skip non-chapter links (like the book nav link in h2)
      if (chLink.href.startsWith('biblebooknav') || chLink.href.startsWith('bibleversenav')) continue;
      // The link text is the chapter number
      const chNum = parseInt(chLink.text);
      if (isNaN(chNum)) continue;

      const chapter = parseChapterFile(chLink.href);
      if (chapter) {
        chapter.number = chNum;
        chapters.push(chapter);
      }
    }
  }

  books.push({
    id: bookId,
    name: fullName,
    abbrev: abbrev,
    testament: currentTestament,
    chapters: chapters
  });
}

// ---- Step 5: Write output ----
const outputPath = path.join(__dirname, 'src', 'data', 'bible.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ books }, null, 2), 'utf-8');

// ---- Summary ----
let totalChapters = 0;
let totalVerses = 0;
for (const book of books) {
  totalChapters += book.chapters.length;
  for (const ch of book.chapters) {
    totalVerses += ch.verses.length;
  }
}

console.log('\n===== SUMMARY =====');
console.log(`Books: ${books.length}`);
console.log(`Total chapters: ${totalChapters}`);
console.log(`Total verses: ${totalVerses}`);
console.log(`Output: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

// Show first few verses of Genesis as sanity check
console.log('\n--- Genesis 1:1-3 ---');
const gen = books[0];
if (gen && gen.chapters[0]) {
  gen.chapters[0].verses.slice(0, 3).forEach(v => {
    console.log(`  v${v.number}: ${v.text.substring(0, 80)}...`);
  });
}

// Show books with potential issues (0 chapters or 0 verses)
const issues = books.filter(b => b.chapters.length === 0 || b.chapters.some(c => c.verses.length === 0));
if (issues.length > 0) {
  console.log('\n--- Potential issues ---');
  for (const b of issues) {
    const emptyChs = b.chapters.filter(c => c.verses.length === 0);
    if (b.chapters.length === 0) {
      console.log(`  ${b.name}: NO CHAPTERS`);
    } else if (emptyChs.length > 0) {
      console.log(`  ${b.name}: ${emptyChs.length} empty chapter(s): ${emptyChs.map(c => c.number).join(', ')}`);
    }
  }
}
