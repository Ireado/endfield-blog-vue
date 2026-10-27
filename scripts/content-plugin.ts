import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import type { Plugin } from 'vite'
import type { BlogData, Post } from '../src/types/blog'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const POSTS_DIR = ROOT + 'content/posts'
const SITE_FILE = ROOT + 'content/site.json'
const VIRTUAL_ID = 'virtual:blog'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const md = new MarkdownIt({ html: true, linkify: false, typographer: false })

md.use(container, 'note', {
  validate: (params: string) => params.trim().startsWith('note'),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      const flag = token.info.trim().replace(/^note\s*/, '') || '注意'
      return `<p class="ef-notice" data-flag="${md.utils.escapeHtml(flag)}">`
    }
    return '</p>\n'
  },
})

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const lang = (token.info.trim().split(/\s+/)[0] || 'text')
  const code = md.utils.escapeHtml(token.content.replace(/\n$/, ''))
  return `<div class="code"><span class="code-lang">${md.utils.escapeHtml(lang)}</span><pre><code>${code}</code></pre></div>\n`
}

const plainText = (body: string) =>
  body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^>\s?/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/[`*_~|]/g, ' ')

const countChars = (text: string) => {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const latin = (text.match(/[A-Za-z0-9][A-Za-z0-9._+#-]*/g) || []).length
  return cjk + latin
}

const slugOf = (file: string) => file.replace(/^\d+-/, '').replace(/\.md$/, '')

function renderPost(file: string, raw: string): Post {
  const { data, content } = matter(raw)
  const tokens = md.parse(content, {})
  const headings: { id: string; text: string }[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'heading_open' && t.tag === 'h2') {
      headings.push({ id: `s${headings.length + 1}`, text: (tokens[i + 1]?.content || '').replace(/<[^>]+>/g, '') })
    }
  }
  let hIdx = 0
  const prevHeading = md.renderer.rules.heading_open
  md.renderer.rules.heading_open = (tokens2, idx, options, env, self) => {
    const t = tokens2[idx]
    if (t.tag === 'h2') {
      hIdx += 1
      t.attrSet('id', `s${hIdx}`)
    }
    return prevHeading ? prevHeading(tokens2, idx, options, env, self) : self.renderToken(tokens2, idx, options)
  }
  const html = md.render(content)
  md.renderer.rules.heading_open = prevHeading

  const chars = countChars(plainText(content))
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)
  return {
    no: String(data.no),
    slug: slugOf(file),
    title: String(data.title),
    date,
    category: String(data.category),
    categoryEn: String(data.categoryEn || ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    abstract: String(data.abstract || ''),
    secret: Boolean(data.secret),
    html,
    headings,
    chars,
    minutes: Math.max(1, Math.ceil(chars / 400)),
  }
}

function loadBlog(): BlogData {
  const site = JSON.parse(readFileSync(SITE_FILE, 'utf8'))
  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort()
  const all = files.map(f => renderPost(f, readFileSync(`${POSTS_DIR}/${f}`, 'utf8')))
  all.sort((a, b) => a.date.localeCompare(b.date) || a.no.localeCompare(b.no))

  const secret = all.find(p => p.secret)!
  const posts = all.filter(p => !p.secret)

  const catMap = new Map<string, number>()
  for (const p of posts) catMap.set(p.category, (catMap.get(p.category) || 0) + 1)

  const months: { label: string; count: number }[] = []
  if (posts.length) {
    const first = posts[0].date.slice(0, 7)
    const last = posts[posts.length - 1].date.slice(0, 7)
    const [fy, fm] = first.split('-').map(Number)
    const [ly, lm] = last.split('-').map(Number)
    let y = fy
    let m = fm
    while (y < ly || (y === ly && m <= lm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      months.push({ label: String(m).padStart(2, '0'), count: posts.filter(p => p.date.startsWith(key)).length })
      m += 1
      if (m > 12) { m = 1; y += 1 }
    }
  }

  const totalChars = posts.reduce((n, p) => n + p.chars, 0)
  const days = Math.round((new Date(site.updated).getTime() - new Date(site.launch).getTime()) / 86400000) + 1

  return {
    site,
    posts,
    secret,
    stats: {
      count: posts.length,
      totalChars,
      cats: [...catMap.entries()].map(([name, count]) => ({ name, count })),
      months,
      days,
      first: posts[0]?.date || '',
      latest: posts[posts.length - 1]?.date || '',
    },
  }
}

export function blogContent(): Plugin {
  return {
    name: 'endfield-blog-content',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const data = loadBlog()
      return `export const site = ${JSON.stringify(data.site)}
export const posts = ${JSON.stringify(data.posts)}
export const secret = ${JSON.stringify(data.secret)}
export const stats = ${JSON.stringify(data.stats)}
`
    },
    configureServer(server) {
      server.watcher.add(POSTS_DIR)
      server.watcher.add(SITE_FILE)
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.startsWith(POSTS_DIR) && ctx.file !== SITE_FILE) return
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID)
      if (mod) ctx.server.moduleGraph.invalidateModule(mod)
      ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

