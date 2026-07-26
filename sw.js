// A versão vem do ?v= usado no register(), então cada release instala
// um SW novo e um cache novo (o antigo é apagado no activate).
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const BASE = '/biblia-nwt/'
const CACHE_NAME = `biblia-nwt-${VERSION}`

const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'icon.svg',
  BASE + 'manifest.json'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// O build gera nomes com hash em assets/, então a URL nunca muda de conteúdo.
function isImmutable(pathname) {
  return pathname.startsWith(BASE + 'assets/')
}

async function putInCache(request, response) {
  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response)
}

// Usado no index.html: sempre busca a versão nova, cai pro cache só sem rede.
// É isso que garante que o HTML aponte para o bundle novo depois de um deploy.
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) putInCache(request, response.clone())
    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      const shell = await caches.match(BASE)
      if (shell) return shell
    }
    throw err
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) putInCache(request, response.clone())
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    isImmutable(url.pathname) ? cacheFirst(request) : networkFirst(request)
  )
})
