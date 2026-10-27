import { nextTick } from 'vue'
import type { Router } from 'vue-router'

/**
 * 把路由切换包进 View Transition，复用 endfield.css 里的斜切快门
 * （::view-transition-new(root) → ef-shutter 360ms）。
 * SPA 没有跨文档跳转，@view-transition 不会自动触发，必须手动 startViewTransition。
 */
export function installPageTransition(router: Router) {
  if (typeof document === 'undefined' || !document.startViewTransition) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let running = false

  const norm = (path: string) => path.replace(/\/+$/, '') || '/'

  router.beforeEach((to, from, next) => {
    // 首次进入、同路径（筛选/锚点）、reduced motion、已有转场时都直接放行
    if (reduce.matches || running || !from.name || norm(to.path) === norm(from.path)) {
      next()
      return
    }

    running = true
    const transition = document.startViewTransition(async () => {
      await new Promise<void>((resolve) => {
        let done = false
        let stop = () => {}
        const finish = () => {
          if (done) return
          done = true
          stop()
          resolve()
        }
        stop = router.afterEach(() => finish())
        next()
        // 导航被取消或重定向时不要一直挂着
        setTimeout(finish, 1500)
      })
      await nextTick()
      // 注意：VT 更新阶段里 rAF 可能被挂起，这里用 setTimeout 让 scrollBehavior 跑完
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    })

    transition.finished.finally(() => {
      running = false
    })
  })
}
