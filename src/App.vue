<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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
const currentPanel = ref(null)

// Touch handling for selection slides (step 0-1)
const selectionTouchStartX = ref(0)
const selectionTouchStartY = ref(0)
const selectionDeltaX = ref(0)
const selectionSwiping = ref(false)
const selectionSwipeDir = ref(null)
const selectionAnimating = ref(false)

// Touch handling for chapter carousel (step 2)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchDeltaX = ref(0)
const isSwiping = ref(false)
const swipeDirection = ref(null)
const isAnimating = ref(false)
const skipTransition = ref(false)

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
  if (book.chapters.length === 1) {
    selectedChapter.value = book.chapters[0]
    step.value = 2
    inputOpen.value = false
    history.pushState({ step: 2 }, '')
  } else {
    step.value = 1
    if (!fromSearch) inputOpen.value = false
    history.pushState({ step: 1 }, '')
  }
}

function selectChapter(chapter, fromSearch = false) {
  selectedChapter.value = chapter
  searchQuery.value = ''
  step.value = 2
  if (!fromSearch) inputOpen.value = false
  history.pushState({ step: 2 }, '')
}

function scrollToVerse(verseNum) {
  inputOpen.value = false
  searchQuery.value = ''
  document.activeElement?.blur()
  nextTick(() => {
    const container = currentPanel.value || document
    const el = container.querySelector(`#verse-${verseNum}`)
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

function goToChapters() {
  selectedChapter.value = null
  searchQuery.value = ''
  step.value = 1
  inputOpen.value = true
}

function openInput() {
  if (!inputOpen.value && step.value === 2) {
    history.pushState({ step: 2, input: true }, '')
  }
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

// Selection slides touch handling
function onSelectionTouchStart(e) {
  if (selectionAnimating.value) return
  selectionTouchStartX.value = e.touches[0].clientX
  selectionTouchStartY.value = e.touches[0].clientY
  selectionDeltaX.value = 0
  selectionSwiping.value = false
  selectionSwipeDir.value = null
}

function onSelectionTouchMove(e) {
  if (selectionAnimating.value) return
  const deltaX = e.touches[0].clientX - selectionTouchStartX.value
  const deltaY = e.touches[0].clientY - selectionTouchStartY.value

  if (!selectionSwipeDir.value) {
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      selectionSwipeDir.value = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
  }

  if (selectionSwipeDir.value !== 'horizontal') return
  e.preventDefault()

  // Only allow swipe right (back) when on chapters (step 1)
  if (step.value === 0 || deltaX < 0) {
    selectionDeltaX.value = deltaX * 0.2 // rubber band
    selectionSwiping.value = true
    return
  }

  selectionSwiping.value = true
  selectionDeltaX.value = deltaX
}

function onSelectionTouchEnd() {
  if (!selectionSwiping.value) {
    selectionSwipeDir.value = null
    return
  }

  const threshold = window.innerWidth * 0.25

  if (selectionDeltaX.value > threshold && step.value === 1) {
    // Swipe back to books
    selectionAnimating.value = true
    selectionDeltaX.value = window.innerWidth
    setTimeout(() => {
      selectedBook.value = null
      selectedChapter.value = null
      searchQuery.value = ''
      step.value = 0
      selectionDeltaX.value = 0
      selectionAnimating.value = false
    }, 300)
  } else {
    // Snap back
    selectionDeltaX.value = 0
  }

  selectionSwiping.value = false
  selectionSwipeDir.value = null
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
      skipTransition.value = true
      goToChapter(currentChapterIndex.value - 1)
      touchDeltaX.value = 0
      isAnimating.value = false
      nextTick(() => { skipTransition.value = false })
    }, 300)
  } else if (touchDeltaX.value < -threshold && hasNextChapter.value) {
    // Animate to next
    isAnimating.value = true
    touchDeltaX.value = -window.innerWidth
    setTimeout(() => {
      skipTransition.value = true
      goToChapter(currentChapterIndex.value + 1)
      touchDeltaX.value = 0
      isAnimating.value = false
      nextTick(() => { skipTransition.value = false })
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

function closeInput() {
  inputOpen.value = false
  searchQuery.value = ''
  document.activeElement?.blur()
}

function onPopState() {
  if (inputOpen.value && step.value === 2) {
    closeInput()
    return
  }
  if (step.value === 2) {
    if (chapters.value.length <= 1) {
      goHome()
    } else {
      goToChapters()
    }
  } else if (step.value === 1) {
    goHome()
  }
}

onMounted(() => {
  history.replaceState({ step: 0 }, '')
  window.addEventListener('popstate', onPopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState)
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
          @click="step === 1 || chapters.length <= 1 ? goHome() : goToChapters()"
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
        <div
          v-if="step < 2"
          class="slides-wrapper"
          @touchstart="onSelectionTouchStart"
          @touchmove="onSelectionTouchMove"
          @touchend="onSelectionTouchEnd"
        >
          <div
            class="slides-track"
            :style="{
              transform: `translateX(calc(${-step * 100}% + ${selectionDeltaX}px))`,
              transition: selectionSwiping ? 'none' : 'transform 0.3s ease'
            }"
          >
            <div class="slide">
              <BookSelector
                :books="inputOpen ? filteredBooks : books"
                @select="selectBook"
                @clear="searchQuery = ''"
              />
            </div>

            <div class="slide">
              <ChapterSelector
                v-if="selectedBook"
                :chapters="inputOpen ? filteredChapters : chapters"
                :book-name="selectedBook?.name"
                @select="selectChapter"
                @clear="searchQuery = ''"
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
              transition: (isSwiping || skipTransition) ? 'none' : 'transform 0.3s ease'
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
            <div class="carousel-panel" ref="currentPanel">
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
          :step="step"
          :book-name="selectedBook?.abbrev || selectedBook?.name || ''"
          :chapter-number="selectedChapter?.number || 0"
          :total-verses="verses.length"
          :multi-chapter="chapters.length > 1"
          @enter="handleEnter"
          @open="openInput"
          @close="closeInput"
          @goto-books="goHome"
          @goto-chapters="goToChapters"
          @goto-verse="openInput"
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
