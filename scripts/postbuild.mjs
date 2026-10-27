// 构建后处理：404、旧地址跳转、sitemap、robots
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = path.join(ROOT, 'dist')
const site = JSON.parse(readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'))
const origin = (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '')
// 与 content-plugin 同一条分流规则：frontmatter secret:true 的文章是独立页面（colophon），
// 不进 sitemap、也不需要旧地址跳转。这里不要按编号写特判。
const posts = readdirSync(path.join(ROOT, 'content/posts'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => matter(readFileSync(path.join(ROOT, 'content/posts', f), 'utf8')).data)
  .filter((data) => !data.secret)
  .map((data) => String(data.no))

// 404.html —— 交给静态托管
const notFound = path.join(DIST, '404/index.html')
if (existsSync(notFound)) {
  copyFileSync(notFound, path.join(DIST, '404.html'))
} else {
  console.warn('! 未找到 404/index.html，跳过 404.html')
}

// 旧地址 → 新地址
const redirect = (from, to) => {
  const file = path.join(DIST, from)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(
    file,
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>跳转 · ${site.name}</title>
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
</head><body><p>这一页换地址了：<a href="${to}">${to}</a></p>
<script>location.replace(${JSON.stringify(to)})</script></body></html>\n`,
    'utf8',
  )
}

redirect('articles.html', '/articles/')
redirect('about.html', '/about/')
for (const no of posts) redirect(`post/${no}.html`, `/post/${no}/`)

// sitemap
const urls = ['/', '/articles/', '/about/', ...posts.map((no) => `/post/${no}/`)]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${origin}${u}</loc><lastmod>${site.updated}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8')
writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, 'utf8')

console.log(`✓ postbuild: 404.html / ${posts.length} 个旧地址跳转 / sitemap / robots`)
