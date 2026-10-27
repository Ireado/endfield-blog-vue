/**
 * <dialog> 的关闭动作。
 *
 * 套件里已经写好了退出动画：`.ef-dialog.is-closing > *` 跑 ef-shut 180ms
 * （入场 ef-power 是 280ms，退出约为它的 2/3）。但原生 close() 是瞬时的，
 * 动画必须由 JS 先挂上 is-closing、等它播完再关，否则面板直接消失。
 *
 * 减少动态效果时套件不给动画，这里直接关，不留空等。
 */
const CLOSE_MS = 180

const reduce =
  typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export function useDialogClose() {
  let timer: ReturnType<typeof setTimeout> | null = null

  /** 在动画途中重新打开时，把待关闭的状态撤掉 */
  function cancel(el: HTMLDialogElement | null) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    el?.classList.remove('is-closing')
  }

  function close(el: HTMLDialogElement | null) {
    if (!el?.open) return
    if (reduce?.matches) {
      el.close()
      return
    }
    if (timer) return
    el.classList.add('is-closing')
    timer = setTimeout(() => {
      timer = null
      el.classList.remove('is-closing')
      el.close()
    }, CLOSE_MS)
  }

  return { close, cancel }
}
