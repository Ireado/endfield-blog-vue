import { computed, ref } from 'vue'

const MECH = 'cubic-bezier(0.7, 0, 0.2, 1)'
const reduceMotion = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
const systemQuery = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null

const mode = ref<'light' | 'dark' | 'system'>('system')
const systemDark = ref(Boolean(systemQuery?.matches))

const isDark = computed(() => (mode.value === 'system' ? systemDark.value : mode.value === 'dark'))

function persist(next: 'light' | 'dark') {
  document.documentElement.dataset.theme = next
  mode.value = next
  try {
    localStorage.setItem('theme', next)
  } catch {}
}

export function initTheme() {
  if (typeof document === 'undefined') return
  const saved = document.documentElement.dataset.theme
  mode.value = saved === 'light' || saved === 'dark' ? saved : 'system'
  systemDark.value = Boolean(systemQuery?.matches)
  systemQuery?.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
}

export function useTheme() {
  function toggle(event?: MouseEvent) {
    if (typeof document === 'undefined') return
    const next = isDark.value ? 'light' : 'dark'
    const target = (event?.currentTarget as HTMLElement | null) ?? document.querySelector('[data-theme-toggle]')
    const box = target?.getBoundingClientRect()
    const x = event?.clientX || (box ? box.left + box.width / 2 : window.innerWidth / 2)
    const y = event?.clientY || (box ? box.top + box.height / 2 : window.innerHeight / 2)
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    if (!document.startViewTransition || reduceMotion?.matches) {
      persist(next)
      return
    }
    document.documentElement.classList.add('ef-theming')
    const transition = document.startViewTransition(() => persist(next))
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: Math.max(240, Math.min(600, radius / 3)),
          easing: MECH,
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
    transition.finished.finally(() => document.documentElement.classList.remove('ef-theming'))
  }

  return { mode, isDark, toggle }
}
