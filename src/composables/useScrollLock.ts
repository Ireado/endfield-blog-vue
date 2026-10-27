export function setScrollLock(locked: boolean) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (locked) {
    if (html.classList.contains('modal-open')) return
    const sbw = Math.max(0, window.innerWidth - html.clientWidth)
    html.style.setProperty('--sbw', `${sbw}px`)
    html.classList.add('modal-open')
  } else {
    html.classList.remove('modal-open')
    html.style.removeProperty('--sbw')
  }
}
