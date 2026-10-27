# RHINE 笔记 · Vue 3 静态博客

原 `endfield-blog/` 纯 HTML 版本的 Vue 3 + Vite 重构。维护、踩坑与交接细节见 [HANDOVER.md](./HANDOVER.md)。视觉与交互按原站 1:1 迁移，`src/styles/endfield.css` 保持套件原样。

## 开发与构建

```bash
npm install
npm run dev         # 开发服务器（默认 http://localhost:5173）
npm run build       # 静态生成到 dist/
npm run typecheck   # vue-tsc 类型检查
npm run preview     # 预览 dist（默认 http://localhost:4173）
```

构建是 **SSG**：`vite-ssg` 为每个路由生成独立 HTML，浏览器端由 Vue hydration 接管交互。

## 目录

```
content/
  posts/*.md        # 文章正文 + frontmatter（000 为隐藏档案）
  site.json         # 站名、上线日、更新日
src/
  views/            # 首页 / 列表 / 文章 / 关于 / 404 / 隐藏档案
  components/
    shell/          # 左栏导航、页脚
    home/           # 首页部件（线稿、字标区）
    ui/             # 记录行、自绘滚动条、搜索面板、成就面板、提示条
  composables/      # 主题、音效、成就、阅读进度、滚动锁、乱码
  styles/           # endfield.css（套件，不改）+ site.css（版式）
  router.ts         # 路由与滚动行为
  page-transition.ts # 路由切换的斜切快门（View Transition）
scripts/
  content-plugin.ts # 构建期解析 Markdown → virtual:blog
  postbuild.mjs     # 404、旧地址跳转、sitemap、robots
  migrate-content.mjs # 一次性：旧站 content.mjs → Markdown
```

## 内容写法

```md
---
no: "008"
title: "标题"
date: 2026-11-01
category: "前端"
categoryEn: "FRONTEND"
tags: ["css", "性能"]
abstract: "一句话摘要。"
secret: false
---

正文段落。行内 `<code>` 与 `<strong>` 可以直接写。

## 小标题（自动生成目录锚点）

:::note 经验
提示条，对应 .ef-notice。
:::

```js
// 代码块会自动带上语言角标
```
```

字数、阅读分钟、分类计数、每月篇数都在构建期统计；没有手填数字。

## 路由与产物

| 路由 | 产物 | 说明 |
| --- | --- | --- |
| `/` | `dist/index.html` | 首页 |
| `/articles/` | `dist/articles/index.html` | 支持 `?cat=前端` |
| `/post/006/` | `dist/post/006/index.html` | 文章 |
| `/about/` | `dist/about/index.html` | 关于 |
| `/colophon/` | `dist/colophon/index.html` | 隐藏档案（noindex） |
| 其它 | `dist/404.html` | 静态托管的 404 |

旧的 `/articles.html`、`/post/006.html` 等会生成跳转桩，书签不失效。

## 部署

构建产物是纯静态目录，可直接放到任意静态托管。

- **子路径部署**：在 `vite.config.ts` 里设置 `base: '/repo/'`，并把 `index.html` 里的资源路径交给 Vite 处理即可。
- **sitemap 域名**：默认使用 `http://localhost:4173`，部署时通过环境变量生成正确地址：

```bash
SITE_URL=https://your-domain.com npm run build
```

- 开发预览说明：`vite preview` 监听 `localhost`（IPv6），用 `http://localhost:4173` 访问。

## 交互细节

- **换页**：用 `document.startViewTransition` 包住路由切换，复用 `endfield.css` 的斜切快门（360ms）；同路径筛选、锚点、`prefers-reduced-motion` 下自动跳过。
- **顶部三色条**：固定在视口顶部、不占布局；滚动 0–72px 内从右向左擦除，侧栏不再被顶 3px。
- **文章目录**：粘性起点与页边距同值（`clamp(2rem,5vw,3.5rem)`），滚动时完全不动；单栏（≤959px）下改为静态。
- **弹窗**：搜索与成就共用 `.dialog-foot`，右下角统一「关闭」；手机上搜索面板限高 `62dvh`、成就 `74dvh`，不再顶满整屏。
- **提示条**：`popover="manual"` 进 top layer，弹窗打开后会重新入栈，所以成就提示始终压在弹窗之上。
- **路由**：统一带尾斜杠（`/articles/`、`/post/006/`），旧 `.html` 地址生成跳转桩。

## 与纯 HTML 版的差异

- 不再支持双击 `file://` 打开：产物是 ES module + 带 hash 的资源，需要静态服务器。
- 站内跳转改为 SPA 路由，主题切换保留圆形揭幕（`startViewTransition`）。
- 成就、音效、主题、阅读进度仍在浏览器本地，键名沿用 `rhine.v1` / `rhine.sound` / `theme`。

## 校验

- `npm run build` 生成 12 个页面；`dist/404.html`、`sitemap.xml`、`robots.txt`、7 个旧地址跳转。
- 浅色/深色、390/768/1024/1440 四档宽度走查通过；控制台无报错、无 hydration 警告。
- 截图见 `screenshots/`：桌面 1440×900、手机 390×844；弹窗与提示条层级的样张为 `palette.png`、`achievements.png`、`mobile-palette.png`、`mobile-achievements.png`、`toast-over-dialog.png`。
