import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useReading(onDepth?: () => void) {
  const pct = ref(0)
  const current = ref('')
  let io: IntersectionObserver | null = null
  let raf = 0

  const update = () => {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1
    pct.value = p
    if (p >= 0.8) onDepth?.()
  }

  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      update()
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    const heads = [...document.querySelectorAll<HTMLElement>('.ef-prose h2[id]')]
    if (heads.length && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        entries => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) current.value = visible[0].target.id
        },
        { rootMargin: '-12% 0px -68% 0px' },
      )
      heads.forEach(h => io!.observe(h))
      current.value = heads[0].id
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    io?.disconnect()
    if (raf) cancelAnimationFrame(raf)
  })

  return { pct, current }
}
