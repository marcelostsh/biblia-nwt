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
const inputOpen = ref(true)

// Touch handling for selection slides (step 0-1)
const selectionTouchStartX = ref(0)
const selectionDeltaX = ref(0)
const selectionSwiping = ref(false)

// Touch handling for chapter carousel (step 2)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchDeltaX = ref(0)
const isSwiping = ref(false)
const swipeDirection = ref(null)
const isAnimating = ref(false)

const books = computed(() => bible.books)

const chapters = computed(() => {
  if (!selectedBook.value) return []
  return selectedBook.value.chapters
})

const verses = computed(() => {
  if (!selectedChapter.value) return []
  return selectedChapter.value.verses
})

const currentChapterIndex = computed(() => {
  if (!selectedBook.value || !selectedChapter.value) return -1
  return chapters.value.findIndex(c => c.number === selectedChapter.value.number)
})

const hasPrevChapter = computed(() => currentChapterIndex.value > 0)
const hasNextChapter = computed(() => currentChapterIndex.value < chapters.value.length - 1)

// Carousel: previous, current, next chapter data
const prevChapter = computed(() => {
  if (!hasPrevChapter.value) return null
  return chapters.value[currentChapterIndex.value - 1]
})

const nextChapter = computed(() => {
  if (!hasNextChapter.value) return null
  return chapters.value[currentChapterIndex.value + 1]
})

function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

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
  step.value = 1
  if (!fromSearch) inputOpen.value = false
}

function selectChapter(chapter, fromSearch = false) {
  selectedChapter.value = chapter
  searchQuery.value = ''
  step.value = 2
  if (!fromSearch) inputOpen.value = false
}

function scrollToVerse(verseNum) {
  inputOpen.value = false
  searchQuery.value = ''
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

function goHome() {
  selectedBook.value = null
  selectedChapter.value = null
  searchQuery.value = ''
  step.value = 0
  inputOpen.value = true
}

function goToChapter(index) {
  if (index >= 0 && index < chapters.value.length) {
    selectedChapter.value = chapters.value[index]
    searchQuery.value = ''
    nextTick(() => {
      // Scroll all carousel panels to top
      document.querySelectorAll('.carousel-panel').forEach(el => {
        el.scrollTop = 0
      })
    })
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

// Chapter carousel touch handling
function onCarouselTouchStart(e) {
  if (isAnimating.value) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  touchDeltaX.value = 0
  isSwiping.value = false
  swipeDirection.value = null
}

function onCarouselTouchMove(e) {
  if (isAnimating.value) return
  const deltaX = e.touches[0].clientX - touchStartX.value
  const deltaY = e.touches[0].clientY - touchStartY.value

  if (!swipeDirection.value) {
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      swipeDirection.value = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
  }

  if (swipeDirection.value !== 'horizontal') return

  e.preventDefault()

  // Block swipe if no chapter in that direction
  if (deltaX > 0 && !hasPrevChapter.value) {
    touchDeltaX.value = deltaX * 0.2 // rubber band effect
    isSwiping.value = true
    return
  }
  if (deltaX < 0 && !hasNextChapter.value) {
    touchDeltaX.value = deltaX * 0.2
    isSwiping.value = true
    return
  }

  isSwiping.value = true
  touchDeltaX.value = deltaX
}

function onCarouselTouchEnd() {
  if (!isSwiping.value) {
    swipeDirection.value = null
    return
  }

  const threshold = window.innerWidth * 0.25

  if (touchDeltaX.value > threshold && hasPrevChapter.value) {
    // Animate to prev
    isAnimating.value = true
    touchDeltaX.value = window.innerWidth
    setTimeout(() => {
      goToChapter(currentChapterIndex.value - 1)
      touchDeltaX.value = 0
      isAnimating.value = false
    }, 300)
  } else if (touchDeltaX.value < -threshold && hasNextChapter.value) {
    // Animate to next
    isAnimating.value = true
    touchDeltaX.value = -window.innerWidth
    setTimeout(() => {
      goToChapter(currentChapterIndex.value + 1)
      touchDeltaX.value = 0
      isAnimating.value = false
    }, 300)
  } else {
    // Snap back
    touchDeltaX.value = 0
  }

  isSwiping.value = false
  swipeDirection.value = null
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
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn
          v-if="step > 0"
          flat
          dense
          round
          icon="arrow_back"
          @click="goHome"
        />
        <q-toolbar-title>{{ headerTitle }}</q-toolbar-title>
        <template v-if="step === 2">
          <q-btn
            flat dense round
            icon="chevron_left"
            :disable="!hasPrevChapter"
            @click="goToChapter(currentChapterIndex - 1)"
          />
          <q-btn
            flat dense round
            icon="chevron_right"
            :disable="!hasNextChapter"
            @click="goToChapter(currentChapterIndex + 1)"
          />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="app-content">
        <!-- Selection mode: books & chapters -->
        <div v-if="step < 2" class="slides-wrapper">
          <div
            class="slides-track"
            :style="{
              transform: `translateX(${-step * 100}%)`,
              transition: 'transform 0.3s ease'
            }"
          >
            <div class="slide">
              <BookSelector
                :books="inputOpen ? filteredBooks : books"
                @select="selectBook"
              />
            </div>

            <div class="slide">
              <ChapterSelector
                v-if="selectedBook"
                :chapters="inputOpen ? filteredChapters : chapters"
                :book-name="selectedBook?.name"
                @select="selectChapter"
              />
            </div>
          </div>
        </div>

        <!-- Reading mode: chapter carousel -->
        <div
          v-else
          class="carousel-wrapper"
          @touchstart="onCarouselTouchStart"
          @touchmove="onCarouselTouchMove"
          @touchend="onCarouselTouchEnd"
        >
          <div
            class="carousel-track"
            :style="{
              transform: `translateX(calc(-100% + ${touchDeltaX}px))`,
              transition: isSwiping ? 'none' : 'transform 0.3s ease'
            }"
          >
            <!-- Prev chapter panel -->
            <div class="carousel-panel">
              <VerseViewer
                v-if="prevChapter"
                :verses="prevChapter.verses"
                :book-name="selectedBook?.name"
                :chapter-number="prevChapter.number"
              />
            </div>

            <!-- Current chapter panel -->
            <div class="carousel-panel">
              <VerseViewer
                v-if="selectedChapter"
                :verses="verses"
                :book-name="selectedBook?.name"
                :chapter-number="selectedChapter?.number"
              />
            </div>

            <!-- Next chapter panel -->
            <div class="carousel-panel">
              <VerseViewer
                v-if="nextChapter"
                :verses="nextChapter.verses"
                :book-name="selectedBook?.name"
                :chapter-number="nextChapter.number"
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
        />
      </div>
    </q-page-container>
  </q-layout>
</template>

<style>
* {
  -webkit-tap-highlight-color: transparent;
}

html, body {
  height: 100%;
  height: 100dvh;
  overflow: hidden;
  position: fixed;
  width: 100%;
}

.app-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.q-page-container {
  height: 100vh;
  height: 100dvh;
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

/* Chapter carousel */
.carousel-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.carousel-track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.carousel-panel {
  min-width: 100vw;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
