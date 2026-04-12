<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import bible from './data/bible.json'
import BookSelector from './components/BookSelector.vue'
import ChapterSelector from './components/ChapterSelector.vue'
import VerseViewer from './components/VerseViewer.vue'
import SearchInput from './components/SearchInput.vue'

const step = ref(0) // 0=book, 1=chapter, 2=verses
const selectedBook = ref(null)
const selectedChapter = ref(null)
const searchQuery = ref('')
const searchInputRef = ref(null)
const inputOpen = ref(true)
const direction = ref('forward') // 'forward' or 'back'

// Touch handling for swipe back
const touchStartX = ref(0)
const touchDeltaX = ref(0)
const isSwiping = ref(false)
const panelEl = ref(null)

const books = computed(() => bible.books)

const chapters = computed(() => {
  if (!selectedBook.value) return []
  return selectedBook.value.chapters
})

const verses = computed(() => {
  if (!selectedChapter.value) return []
  return selectedChapter.value.verses
})

// Normalize: remove accents and lowercase
function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Filtered items for search
const filteredBooks = computed(() => {
  const q = normalize(searchQuery.value.trim())
  if (!q) return books.value
  return books.value.filter(b =>
    normalize(b.name).startsWith(q) ||
    normalize(b.abbrev).startsWith(q)
  )
})

const filteredChapters = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return chapters.value
  return chapters.value.filter(c =>
    c.number.toString().startsWith(q)
  )
})

const filteredVerses = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return verses.value
  return verses.value.filter(v =>
    v.number.toString().startsWith(q)
  )
})

// Watch filtered results for auto-advance
watch(filteredBooks, (val) => {
  if (step.value === 0 && val.length === 1 && searchQuery.value.trim()) {
    selectBook(val[0], true)
  }
})

watch(filteredChapters, (val) => {
  if (step.value === 1 && val.length === 1 && searchQuery.value.trim()) {
    selectChapter(val[0], true)
  }
})

watch(filteredVerses, (val) => {
  if (step.value === 2 && val.length === 1 && searchQuery.value.trim()) {
    scrollToVerse(val[0].number)
  }
})

function selectBook(book, fromSearch = false) {
  selectedBook.value = book
  selectedChapter.value = null
  searchQuery.value = ''
  direction.value = 'forward'
  step.value = 1
  if (!fromSearch) {
    inputOpen.value = false
  }
}

function selectChapter(chapter, fromSearch = false) {
  selectedChapter.value = chapter
  searchQuery.value = ''
  direction.value = 'forward'
  step.value = 2
  if (!fromSearch) {
    inputOpen.value = false
  }
}

function scrollToVerse(verseNum) {
  inputOpen.value = false
  searchQuery.value = ''
  // Fecha o teclado
  document.activeElement?.blur()
  nextTick(() => {
    const el = document.getElementById(`verse-${verseNum}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight')
      setTimeout(() => el.classList.remove('highlight'), 2000)
    }
  })
}

function goBack() {
  if (step.value > 0) {
    direction.value = 'back'
    searchQuery.value = ''
    step.value--
    if (step.value < 2) {
      inputOpen.value = true
    }
  }
}

function handleEnter() {
  if (step.value === 0 && filteredBooks.value.length > 0) {
    selectBook(filteredBooks.value[0], true)
  } else if (step.value === 1 && filteredChapters.value.length > 0) {
    selectChapter(filteredChapters.value[0], true)
  } else if (step.value === 2 && filteredVerses.value.length > 0) {
    scrollToVerse(filteredVerses.value[0].number)
  }
}


// Swipe handling
function onTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
  touchDeltaX.value = 0
  isSwiping.value = false
}

function onTouchMove(e) {
  const delta = e.touches[0].clientX - touchStartX.value
  // Only allow swipe right (back) when not on step 0
  if (delta > 10 && step.value > 0) {
    isSwiping.value = true
    touchDeltaX.value = Math.min(delta, window.innerWidth)
  }
}

function onTouchEnd() {
  if (isSwiping.value && touchDeltaX.value > window.innerWidth * 0.3) {
    goBack()
  }
  touchDeltaX.value = 0
  isSwiping.value = false
}

const currentInputMode = computed(() => {
  return step.value === 0 ? 'text' : 'numeric'
})

const currentPlaceholder = computed(() => {
  if (step.value === 0) return 'Buscar livro...'
  if (step.value === 1) return `Capítulo de ${selectedBook.value?.name}...`
  return 'Ir para versículo...'
})

const headerTitle = computed(() => {
  if (step.value === 0) return 'Bíblia'
  if (step.value === 1) return selectedBook.value?.name || ''
  return `${selectedBook.value?.name} ${selectedChapter.value?.number}`
})
</script>

<template>
  <div class="app-container"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Header -->
    <header class="app-header">
      <button v-if="step > 0" class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1 class="header-title">{{ headerTitle }}</h1>
    </header>

    <!-- Slides container -->
    <div class="slides-wrapper">
      <div
        class="slides-track"
        :style="{
          transform: `translateX(calc(${-step * 100}% + ${touchDeltaX}px))`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease'
        }"
      >
        <!-- Slide 0: Books -->
        <div class="slide">
          <BookSelector
            :books="inputOpen ? filteredBooks : books"
            @select="selectBook"
          />
        </div>

        <!-- Slide 1: Chapters -->
        <div class="slide">
          <ChapterSelector
            v-if="selectedBook"
            :chapters="inputOpen ? filteredChapters : chapters"
            :book-name="selectedBook?.name"
            @select="selectChapter"
          />
        </div>

        <!-- Slide 2: Verses -->
        <div class="slide">
          <VerseViewer
            v-if="selectedChapter"
            :verses="verses"
            :book-name="selectedBook?.name"
            :chapter-number="selectedChapter?.number"
          />
        </div>
      </div>
    </div>

    <!-- Search Input -->
    <SearchInput
      v-model="searchQuery"
      :input-mode="currentInputMode"
      :placeholder="currentPlaceholder"
      :is-open="inputOpen"
      @enter="handleEnter"
      @open="inputOpen = true"
      ref="searchInputRef"
    />
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #4a6da7;
  color: white;
  min-height: 56px;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  padding: 4px;
  margin-right: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 500;
}

.slides-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.slides-track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.slide {
  min-width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
