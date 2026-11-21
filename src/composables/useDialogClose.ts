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

  /**
   * 立刻关，不播退出动画。
   *
   * 只用于「被另一个浮层顶掉」：退出动画是给用户主动关闭看的，
   * 换成新窗时再播 180ms，旧窗就会和新窗叠在一起 —— <dialog> 一旦 showModal
   * 就进 top layer，两个同时开着是两层实打实的面板，不是变暗的遮罩。
   */
  function closeNow(el: HTMLDialogElement | null) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!el?.open) return
    el.classList.remove('is-closing')
    el.close()
  }

  return { close, cancel, closeNow }
}
