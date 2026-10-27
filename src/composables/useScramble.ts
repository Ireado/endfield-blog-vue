import type { Directive } from 'vue'

const still = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
const running = new WeakMap<HTMLElement, number>()

const stand = (ch: string) => {
  if (/\d/.test(ch)) return String(Math.floor(Math.random() * 10))
  if (/[A-Za-z]/.test(ch)) return String.fromCharCode((ch < 'a' ? 65 : 97) + Math.floor(Math.random() * 26))
  return ch
}

export function scramble(el: HTMLElement, ms = 360) {
  if (still?.matches) return
  const before = running.get(el)
  if (before) cancelAnimationFrame(before)
  const text = el.textContent || ''
  if (!/[0-9A-Za-z]/.test(text)) return
  const final = text
  const started = performance.now()
  const step = (now: number) => {
    const done = Math.min(1, (now - started) / ms)
    const locked = Math.floor(done * final.length)
    el.textContent = final.slice(0, locked) + [...final.slice(locked)].map(stand).join('')
    if (done < 1) running.set(el, requestAnimationFrame(step))
    else {
      el.textContent = final
      running.delete(el)
    }
  }
  running.set(el, requestAnimationFrame(step))
}

interface ScrambleOptions {
  delay?: number
  hover?: boolean
}

export const vScramble: Directive<HTMLElement, ScrambleOptions | undefined> = {
  mounted(el, binding) {
    const opts = binding.value || {}
    if (opts.delay != null) setTimeout(() => scramble(el), opts.delay)
    if (opts.hover) {
      el.addEventListener('pointerenter', () => scramble(el))
      el.addEventListener('focus', () => scramble(el))
    }
  },
}
