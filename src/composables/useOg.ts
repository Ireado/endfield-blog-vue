import { computed, unref, type MaybeRef } from 'vue'
import { useHead } from '@unhead/vue'

interface OgOptions {
  title: MaybeRef<string>
  desc: MaybeRef<string>
  type?: 'website' | 'article'
}

/**
 * 分享卡片（Open Graph / Twitter）的逐页字段。
 * 全站不变的 og:site_name / og:image / twitter:card 写在 index.html；
 * og:image 的相对地址由 postbuild 替换成绝对地址（社交爬虫要求绝对 URL）。
 */
export function useOg(opts: OgOptions) {
  useHead({
    meta: computed(() => [
      { property: 'og:type', content: opts.type ?? 'website' },
      { property: 'og:title', content: unref(opts.title) },
      { property: 'og:description', content: unref(opts.desc) },
      { name: 'twitter:title', content: unref(opts.title) },
      { name: 'twitter:description', content: unref(opts.desc) },
    ]),
  })
}
