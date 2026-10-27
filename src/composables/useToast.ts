import { ref } from 'vue'

interface Item {
  id: number
  text: string
  closing: boolean
}

const queue: string[] = []
const current = ref<Item | null>(null)
let seq = 0
let timer: ReturnType<typeof setTimeout> | null = null

function pump() {
  if (current.value || !queue.length) return
  const text = queue.shift()!
  current.value = { id: ++seq, text, closing: false }
  timer = setTimeout(() => {
    if (current.value) current.value.closing = true
    setTimeout(() => {
      current.value = null
      timer = null
      pump()
    }, 160)
  }, 2400)
}

export function toast(text: string) {
  queue.push(text)
  pump()
}

export function useToast() {
  return { current, stop: () => timer && clearTimeout(timer) }
}
