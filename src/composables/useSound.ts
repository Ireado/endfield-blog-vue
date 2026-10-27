import { ref } from 'vue'

const KEY = 'rhine.sound'

export const soundOn = ref(true)

let ctx: AudioContext | null = null
let master: GainNode | null = null

export function ensureAudio() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.12
      master.connect(ctx.destination)
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.4, when = 0, slideTo: number | null = null) {
  if (!soundOn.value || !ctx || !master || ctx.state !== 'running') return
  const t = ctx.currentTime + when
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export function play(name: 'tick' | 'confirm' | 'achieve') {
  if (!soundOn.value) return
  if (name === 'tick') tone(1700, 0.025, 'square', 0.22)
  else if (name === 'confirm') {
    tone(660, 0.06, 'square', 0.4)
    tone(880, 0.08, 'square', 0.4, 0.06)
  } else {
    tone(523, 0.09, 'sine', 0.5)
    tone(784, 0.12, 'sine', 0.45, 0.09)
  }
}

export function initSound() {
  try {
    soundOn.value = localStorage.getItem(KEY) !== 'off'
  } catch {}
  if (typeof window === 'undefined') return
  window.addEventListener('pointerdown', () => ensureAudio(), { once: true })
  window.addEventListener('keydown', () => ensureAudio(), { once: true })
}

export function toggleSound() {
  soundOn.value = !soundOn.value
  try {
    localStorage.setItem(KEY, soundOn.value ? 'on' : 'off')
  } catch {}
  if (soundOn.value) {
    ensureAudio()
    play('confirm')
  }
}
