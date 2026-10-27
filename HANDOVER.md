# HANDOVER · RHINE 笔记（Vue 3 静态博客）

更新：2026-10-27（旧静态版移除 / 弹窗关闭动画 / 页面自绘滚动条）· 版本：`endfield-blog-vue/`

---

## 0. 先看这 9 条

1. **站点只有一个目录：`endfield-blog-vue/`**。旧的纯 HTML 版已于 2026-10-27 移除，别再去找 `../endfield-blog/`（唯一备份是 `../.workbuddy/archive/endfield-blog-legacy-2026-10-27.tar.gz`，不在本仓库里）。
2. 构建是 **SSG**：`npm run build` 生成 12 个 prerender 页面 + `404.html` + 旧地址跳转桩 + sitemap/robots。产物在 `dist/`。
3. 站点**不能双击 `file://` 打开**：ES module + 带 hash 的资源，必须用静态服务器。`npm run preview` 后访问 **`http://localhost:4173`**（本机 vite preview 只监听 `::1`，`127.0.0.1` 会 502）。
4. 视觉规则来自 [`endfield-ui`](https://github.com/hhikr/endfield-ui-skill) 技能（仓库 <https://github.com/hhikr/endfield-ui-skill>）：**浅色纸面、墨线、唯一黄色只做填充**。不要把这里改回黑底霓虹/HUD。
5. 换页的斜切快门不在 CSS 里自动生效，靠 `src/page-transition.ts` 手动 `startViewTransition`。
6. 右侧目录的 sticky 起点必须与栏的上边距同值（`clamp(2rem,5vw,3.5rem)`），否则滚动前 24px 会漂移。
7. 数字凡是会变（乱码、计数、日期），**必须 `font-variant-numeric: tabular-nums`**，否则会把旁边文字推来推去。
8. 本机 **Chrome 156 已忽略 `::-webkit-scrollbar` 定制**；弹窗滚动条是自绘的 `ScrollArea.vue`，不要指望原生样式。
9. 提示条（toast）不是普通 fixed 元素，它是 `popover="manual"` 的 **top layer**。`z-index` 再大也压不过已打开的 `<dialog>`；新增浮层先判断它属于哪一层（见 6.11）。

---

## 1. 项目现状

| 项目 | 路径 | 说明 |
| --- | --- | --- |
| 站点 | `endfield-blog-vue/` | Vue 3 + Vite + vite-ssg，全部代码在这里 |
| 设计套件 | [endfield-ui](https://github.com/hhikr/endfield-ui-skill) | 终末地风格 UI 套件，仓库 <https://github.com/hhikr/endfield-ui-skill>，本地装在 `~/.workbuddy/skills/endfield-ui`；`src/styles/endfield.css` 是其 `assets/endfield.css` 的原样副本 |
| 截图 | `endfield-blog-vue/screenshots/` | 本地留档、不进仓库（已 gitignore）。13 张：浅/深、列表、文章、关于、404、搜索/成就（桌面 + 手机）、提示条压弹窗、移动端 |

**规模**：`dist/` 约 1.2 MB（含字体 81 KB）；`node_modules/` 约 113 MB。
**当前没有常驻预览服务**：按第 2 节命令自行启动。
**后端**：无。无统计脚本、无 Cookie、无第三方请求。状态全部在浏览器 localStorage。
**版本控制**：本目录就是仓库根（`git init -b main`），直接在 `endfield-blog-vue/` 里执行 git 命令即可；`screenshots/` 与 `node_modules/`、`dist/` 均在 `.gitignore` 里，不进仓库。旧静态版不在本仓库历史中。

---

## 2. 技术栈

| 依赖 | 版本 | 备注 |
| --- | --- | --- |
| Vue | 3.5.x | Composition API + `<script setup>` |
| vue-router | 4.6.x | **不要升 5**；vite-ssg 虽声明兼容，但本项目未验证 |
| vite | 7.3.x | |
| vite-ssg | 28.3.x | `dirStyle: 'nested'` |
| @unhead/vue | **2.1.x** | **必须与 vite-ssg 内置的 v2 对齐**，升 v3 可能导致 SSG head 丢标签 |
| TypeScript | 5.9.x | `npm run typecheck` = `vue-tsc --noEmit` |
| markdown-it + container | 14.x / 4.x | 仅构建期使用，不进客户端包 |
| gray-matter | 4.x | frontmatter |

`package.json` scripts：

```bash
npm run dev        # Vite 开发服务器，默认 5173
npm run build      # vite-ssg build + scripts/postbuild.mjs
npm run preview    # 预览 dist，4173（只监听 ::1）
npm run typecheck  # vue-tsc --noEmit
```

---

## 3. 目录与职责

```
endfield-blog-vue/
├─ index.html                 # 入口；预置主题脚本、字体 preload、variant.js
├─ vite.config.ts             # 别名、ssgOptions（dirStyle + includedRoutes）
├─ content/
│  ├─ posts/*.md              # 8 篇正文（000 为隐藏档案）+ frontmatter
│  └─ site.json               # 站名、上线日、更新日
├─ scripts/
│  ├─ content-plugin.ts       # 虚拟模块 virtual:blog：渲染 Markdown + 构建期统计
│  └─ postbuild.mjs           # 404.html、7 个旧地址跳转桩、sitemap、robots
├─ src/
│  ├─ main.ts                 # ViteSSG + 安装换页转场
│  ├─ App.vue                 # 骨架、路由钩子、三色条擦除、滚动锁、快捷键、音效
│  ├─ router.ts               # 路由 + scrollBehavior
│  ├─ page-transition.ts      # 换页斜切快门（startViewTransition）
│  ├─ views/                  # Home / Articles / Article / About / NotFound
│  ├─ components/
│  │  ├─ shell/               # RailNav、SiteFooter、PageScrollbar（页面自绘滚动条）
│  │  ├─ home/ArtFrame.vue    # 工作台俯视线稿（内联 SVG）
│  │  └─ ui/                  # RecordRow、ScrollArea、SearchPalette、AchievementDialog、ToastHost
│  ├─ composables/            # theme / sound / achievements / reading / scroll lock / scramble / toast / ui / dialogClose
│  ├─ styles/{endfield.css, site.css, site/, contours/}
│  │  # site.css 是 @import 入口（顺序=层叠顺序）；site/ 按模块拆分：
│  │  # base 全局地基 / scrollbar 页面滚动条 / shell 骨架·左栏·页脚 /
│  │  # home 首页 / articles 列表 / post 文章页 / pages 关于·404 / overlays 浮层
│  └─ assets/fonts/           # Saira.woff2（81 KB）+ OFL（ttf 回退已移除）
└─ screenshots/
```

**CSS 顺序很重要**：`main.ts` 先 import `endfield.css`，再 import `site.css`；后者做版式覆盖。不要调换。

---

## 4. 内容维护

### 4.1 新增一篇

在 `content/posts/` 新建 `NNN-slug.md`（`NNN` 三位数字，决定排序与编号）：

````md
---
no: "008"
title: "标题"
date: 2026-11-01          # 必须 YYYY-MM-DD
category: "前端"
categoryEn: "FRONTEND"
tags: ["css", "性能"]
abstract: "一句话摘要，会出现在列表与 SEO description。"
secret: false
---

正文。行内 `<code>`、`<strong>`、`<kbd>` 可以直接写。

## 小标题（自动生成目录 id）

:::note 经验
提示条，渲染成 .ef-notice。
:::

```js
// 代码块自动带语言角标
```
````

构建时自动：
- 计算字数（CJK 字符 + 拉丁词，排除代码块）、阅读分钟（`ceil(chars/400)`，最少 1）；
- 分类计数、每月篇数、首页总数；
- 生成 `/post/NNN/` 页面并加入 sitemap。

**不要手填字数/分钟**。首页的“第 N 天”由 `site.json` 的 `launch` 与 `updated` 计算。

### 4.2 隐藏档案

`content/posts/000-colophon.md` 的 `secret: true`。它不会进入文章列表/首页/ticker，但会生成 `/colophon/`（URL 由文件名 slug 推导，SSG 路由、sitemap、路由表、页脚入口全部同源，见 `content-plugin.ts` 的 `blogRoutes()` 与 `loadBlog()`，**不要在任何下游按编号 `000` 写特判**）；页脚 `No.000` 是唯一入口；该页自动带 `noindex`。以后要加第二个隐藏页：新建 `NNN-slug.md` + `secret: true` 即可，路由与入口自动生成。

### 4.3 站点信息

`content/site.json`：`name / zh / tagline / launch / updated`。
发布内容后记得把 `updated` 改成当天，否则页脚、sitemap、首页“第 N 天”都不会变。

---

## 5. 设计系统（不可随意改的部分）

套件来自 [`endfield-ui`](https://github.com/hhikr/endfield-ui-skill) —— 终末地风格 UI 技能，仓库 <https://github.com/hhikr/endfield-ui-skill>，本地装在 `~/.workbuddy/skills/endfield-ui`。`src/styles/endfield.css` 是该技能 `assets/endfield.css` 的原样副本。

变体：**标准**（yellow / warm / standard / contours / standard / full），落在 `<html data-ef-paper="warm">` 与 `<body class="ef ef-contours">` 上。
主视觉：RHINE 字标 + 自绘工作台俯视线稿。页面类型：首页展示，其余阅读。

**固定规则**：
- 纸面 `#F3F1EA`（warm）、板 `#FFFEFA`、墨 `#161616`；唯一强调色 `#FFFA00`。
- 浅色主题里黄色**只做填充**（当前、可点、注意），**不能当文字或线条**；深色是另一套完整主题（`--ef-trace` 变黄）。
- **切角 = 可点击**：只给标签、筛选块、按钮、当前项；正文/图片/栏目一律直角；圆角 0。
- 1px 细线分区，不用阴影、发光、渐变、卡片堆叠。
- 英文宽体大写（Saira，`font-stretch` 112%/125%）+ 中文粗黑体；数字等宽。
- 动效短、硬、机械；不要弹簧/果冻；`prefers-reduced-motion` 时全部关闭。
- 三色条只允许两个位置：页面最顶、文章标题下。滚动横幅是唯一允许持续运动的组件。
- 不编造数字/坐标/日志；文案不写风格术语，英文眉标是中文标题的直译。

`endfield.css` 视为第三方套件：需要改视觉时优先在 `site.css` 覆盖；若必须改套件，记录改动并注意未来同步技能更新。

字体：`Saira.woff2` 是从原始 `Saira.ttf` 子集化的（wght 100–900、wdth 50–125、tnum）；ttf 兜底格式已删（现代浏览器全覆盖 woff2，不值得为其多背 483 KB）。替换字体时必须保留可变宽度轴和 `tnum`，否则字标宽度与数字等宽都会坏。

---

## 6. 关键机制

### 6.1 内容管线（`scripts/content-plugin.ts`）

- 虚拟模块 `virtual:blog` 导出 `site / posts / secret / stats`。
- Markdown 渲染：`:::note 标题` → `.ef-notice`；代码围栏 → `.code` 结构；h2 自动加 `id="s1..."` 并收集目录。
- **路由单一数据源**：`blogRoutes()` 导出 `{ postRoutes, secretRoute }`——frontmatter `secret: true` 的文章走 `/<slug>/` 独立页（不进文章索引、不进 sitemap），其余走 `/post/<no>/`。`vite.config.ts`（SSG 路由）、`postbuild.mjs`（旧地址跳转 + sitemap，用 gray-matter 读同一份 frontmatter）、`router.ts`（`/${secret.slug}/`）全部由此推导。隐藏档案相关代码一律读 `secret.no / secret.slug`，**不要写字面量 `'000'`**。
- 开发时监听 `content/posts` 与 `site.json`，改动后整页刷新（`handleHotUpdate`）。
- 统计在构建期完成，客户端只拿到 HTML 字符串，不打包 markdown-it。

### 6.2 换页斜切快门（`src/page-transition.ts`）

- `router.beforeEach` 中 `document.startViewTransition(async () => { 等 afterEach → nextTick → setTimeout(0) })`。
- 动画复用 `endfield.css` 的 `::view-transition-new(root) → ef-shutter 360ms`。
- 跳过：首次进入（`!from.name`）、同路径（去尾斜杠比较，覆盖 `?cat=` 与锚点）、`prefers-reduced-motion`、已有转场。
- `running` 防重入；导航被取消/重定向时 1.5 s 兜底。
- **不要在更新回调里 `await requestAnimationFrame`**：VT 更新阶段 rAF 会被挂起，Chrome 会报 “Transition was aborted because of timeout in DOM update”。

### 6.3 主题（`useTheme.ts`）

- 键 `theme`（`light` / `dark`）；`index.html` 内联脚本在首帧前应用，避免闪白。
- 切换用 `startViewTransition` + 圆形 clip 揭幕；`html.ef-theming` 期间禁用 root 的换页动画（套件里已有规则）。
- 深色不是反色，`data-theme="dark"` 走完整 token 集。

### 6.4 成就（`useAchievements.ts`）

- 15 项，键 `rhine.v1`：`{ ach: string[], read: string[], lastPost: { no, ts } }`。
- 跨页判定统一在 `router.afterEach` 调用 `enter(to, from)`：首次阅读、全读完、略读（离开文章 <5 s）、隐藏页、404、深夜/清晨。
- 深度阅读（80%）由文章页 `useReading` 触发；主题/静音/键盘/Konami/字标连点各自调用。
- 解锁幂等；提示条与音效自动；最后一项触发 `full`（其余 14 项全解锁）。
- 改动成就数量时，`TOTAL - 1` 的满贯逻辑在 `unlock()` 内，注意同步。

### 6.5 搜索（`SearchPalette.vue`）

- `Ctrl/⌘ + K` 或左栏“搜索”；输入过滤页面 + 文章；↑↓ 移动、Enter 打开、Esc 关闭。
- 打开时 `html.modal-open` 锁页面滚动；路由变化会自动关闭。
- 页脚是 `.dialog-foot`：左“↑↓ 选择 · Enter 打开 · Esc 关闭”，右下「关闭」按钮；手机上两者仍同一行，按钮不会被折到屏外。

### 6.6 弹窗：高度、页脚、滚动锁

- 原生 `<dialog>` + `showModal()`；**必须保留 `id="ach-dialog"` / `id="palette"`**，`site.css` 用 `#ach-dialog > .ef-panel` / `#palette > .ef-panel` 限高。
- 面板是**三段 flex**：头部（eyebrow / 标题 / 搜索框）→ `ScrollArea` → `.dialog-foot`。中间 `flex:1 1 auto; min-height:0`，头尾 `flex:none`。
  **不要在面板与 `ScrollArea` 之间再包一层 div**：那层默认 `flex:0 1 auto` 且没有 `min-height:0`，限高会失效（实测面板撑到 1028px，关闭按钮被顶到屏幕外）。
- 高度：桌面/平板 `max-height: calc(100dvh - 3rem)`；`≤719px` 搜索 `62dvh`、成就 `74dvh`。手机原来几乎顶满整屏，四边只剩一条缝。
- 页脚统一 `.dialog-foot`：`display:flex; gap:1rem; flex:none`；按钮 `margin-left:auto` 贴右下。搜索面板左侧还有提示文字（`margin-right:auto`），按钮依然靠右。
- 打开后 `window.dispatchEvent(new Event('rhine:dialog-open'))`，唯一消费者是提示条（见 6.11）。
- dialog 自身 `overflow: visible`，滚动交给内部 `ScrollArea`；否则会多出一条系统滚动条。
- 锁滚动时 `--sbw` 只补偿经典滚动条；Chrome 覆盖式滚动条下为 0，不会横跳。

### 6.7 自绘滚动条（`ScrollArea.vue`）

- 原生条隐藏（`scrollbar-width: none` + `::-webkit-scrollbar{display:none}`）；8px 方头条：纸色轨道 + 1px 线、墨色 26% 滑块、悬停加深。
- 支持拖动、点击轨道、`has-more` 底边渐隐；内容不够长时自动隐藏。
- 本机 Chrome 156 已忽略 `::-webkit-scrollbar` 定制，不要再走原生方案。

### 6.8 三色条与页高

- `.ef-tri` **fixed** 在视口顶部（z 70），不占布局；`App.vue` 监听滚动，`scrollY/72` 写入 `--tri-wipe`，`clip-path: inset(0 calc(var(--tri-wipe)*100%) 0 0)` 从右向左擦除；回顶自动恢复。
- `.shell` 最小高度 `100dvh`；`.main { align-self: start; min-height: 100dvh }`，页脚在 `main` 内。
  这样网格行高包含页脚，粘性侧栏在页底不会被顶起。
- 左栏 `height: 100dvh; top: 0`；不要再给 `overflow-y: auto` 的容器加会横向溢出的 hover 动画（会被 `overflow-x: clip` 兜住）。

### 6.9 目录与阅读进度

- `.toc-wrap { position: sticky; top: clamp(2rem,5vw,3.5rem) }`，与 `.ef-margin` 上边距同值：1440 下 56px，滚动 0/40/400 都不动。
- ≤959px（单栏）时 `position: static`。
- `useReading` 用 IntersectionObserver 更新目录 `aria-current`，滚动计算“读到这里 %”；80% 解锁深度阅读。
- `<RouterView>` 按 `route.path` 加 key：文章之间切换必须重建观察器，否则目录/进度还是旧文章。

### 6.10 音效与彩蛋

- 音效全合成（无音频文件），键 `rhine.sound`；`AudioContext` 必须在首次手势后创建，`tone()` 只在 `ctx.state === 'running'` 时发声。
- Konami：只解锁成就，**不切主题**；字标连点 7 次解锁“连点”；深夜/清晨、404、隐藏页各有成就。
- 控制台没有统计脚本；页脚 `No.000` 是隐藏页入口。

### 6.11 提示条与层级（`ToastHost.vue`）

- 根节点是 `<div class="toast-layer" popover="manual">`，靠 `showPopover()` 进入 **top layer**。普通元素 `z-index` 再大也压不过已打开的 `<dialog>`——这不是数值问题，是层级机制。
- top layer 内按 raise 顺序叠放：弹窗后打开就会盖住提示条。所以弹窗打开时会派发 `rhine:dialog-open`，提示条收到后 `setTimeout(raise, 0)`（`hidePopover()` + `showPopover()` 重新入栈）。
- 容器只负责定位：全屏 `pointer-events:none`，实际元素是里面的 `.ef-toast`；不要给容器加背景、边框、居中文字——它会挡住整页点击。
- 能力检测 `'showPopover' in HTMLElement.prototype`；不支持时退化成普通 fixed 容器（会被 dialog 盖住，可接受）。
- 以后加任何全局浮层（快捷键提示、引导、通知）先问一句：它需要出现在 `<dialog>` 之上吗？需要就用 Popover，不要试图调 `z-index`。

### 6.12 弹窗关闭动画（`useDialogClose.ts`）

- 套件自带退出动画：`.ef-dialog.is-closing > *` 跑 ef-shut 180ms（入场 ef-power 280ms，退出正好 2/3）。但原生 `close()` 是瞬时的，必须由 JS 先挂 `.is-closing`、等动画播完再关。
- `useDialogClose()` 给 `close(el)` / `cancel(el)`：延迟 180ms 后 `close()`；动画途中又被打开时用 `cancel()` 撤掉待关闭状态。`prefers-reduced-motion` 下直接关，不留空等。
- 两个弹窗模板都加了 `@cancel.prevent`，否则 Esc 会走原生关闭、绕过动画。
- **套件的 `ef-shut` 只写了 `to`**：动画起点被当成 `none`，而 `none → inset()` 不能插值，前半段只淡出、后半段面板突然被裁空。`site.css` 补了 `@keyframes ef-shut-panel`（`from` 用 `inset(-6px)`，与 ef-power 严格互逆），用 `animation-name` 覆盖。

### 6.13 页面滚动条（`PageScrollbar.vue`）

- 原生条用 `html { scrollbar-width: none }` 彻底移除，**连占位一起拿掉**（Chrome 156 已不吃 `::-webkit-scrollbar` 定制）。
- **不要用 `scrollbar-color: transparent` 保留占位**：弹窗打开时 `html{overflow:hidden}` 会让占位消失，视口宽 1425 → 1440，`.ef-tri` 跟着跳 15px、居中 dialog 横移 7.5px；而关闭动画正好发生在 modal-open 撤销的那一刻，于是在动画中途抖。`body{padding-right:var(--sbw)}` 补不了 `position: fixed` 的元素。
- `PageScrollbar` 固定在右侧 8px，视觉同 `ScrollArea`（纸色轨道 + 1px 线 + 墨色滑块）；支持拖动滑块与点轨道跳转，`ResizeObserver` 盯 body 高度。
- 不可滚动时不出 `is-on`；`html.modal-open` 时 CSS 收起；`@media (pointer: coarse)` 整条 `display: none`。

---

## 7. 踩坑清单（按主题）

### 7.1 视觉与样式

| 症状 | 原因 | 修法 |
| --- | --- | --- |
| 面板边框变成一圈厚灰框 | 组件自己的 `padding` 覆盖了 `.panel` 的 `padding:1px`（双层切角靠外层当边框） | 组件 padding 一律写在 `.panel-in` 上 |
| 侧栏/列表悬浮时抖动、冒横向滚动条 | `overflow-y:auto` 会把另一轴也算成 `auto`；按钮 `::after` 亮边 `translateX(100%)` 扫出容器 | `.rail{overflow-x:clip}`；列表同理 |
| 数字乱码时右侧文字被推挤 | Saira 默认比例数字，111 比 888 窄四成 | `.ef-field`、`.ef-hollow-no`、成就编号加 `tabular-nums` |
| 深色下黄色文字/线条看不清 | 浅色规则被带进深色 | 深色用 `--ef-trace`（黄），浅色只用墨色线 |
| 弹窗里出现两条滚动条 | `<dialog>` 自身 `overflow:auto` + 面板超 `max-height`，或没隐藏原生条 | dialog `overflow:visible`；面板限高；列表用 `ScrollArea` |
| 页面右侧有 15px 灰边 | `scrollbar-gutter: stable` 在覆盖式滚动条下仍留槽 | 去掉；只在锁滚动时用 `--sbw` 补偿经典滚动条 |
| 移动端整页横向溢出，但 `scrollWidth==clientWidth` | `overflow-x: clip` 把溢出藏了 | 直接量元素 `getBoundingClientRect().right`，不要只看 scrollWidth |
| 顶部三色条把侧栏顶下 3px | 三色条在文档流里 | 改 fixed，配 `--tri-wipe` 擦除；`.shell` 用 `100dvh` |
| 文章底部侧栏被顶起 69px | grid 把 `main` 拉伸到不含页脚的高度，页脚溢出 | `.main{align-self:start;min-height:100dvh}` |
| 目录滚动时漂 24px | sticky 起点 `2rem` ≠ 栏上边距 | 两者都用 `clamp(2rem,5vw,3.5rem)` |
| 手机弹窗几乎顶满整屏、四边只剩缝隙 | 桌面限高 `calc(100dvh - 3rem)`，到手机上就是“视口减 24px” | `≤719px` 单独给 `62dvh`（搜索）/ `74dvh`（成就） |
| 弹窗列表撑破面板、关闭按钮跑到屏幕外 | 面板与 `ScrollArea` 之间多包了一层 div：`flex:0 1 auto` 又没有 `min-height:0`，高度按内容算 | 删掉包裹层，事件挂到 `ScrollArea`，列表直接做面板的 flex 子项 |
| 手机搜索列表每行被拆成两行 | 套件 `≤719px` 的记录行规则让标题跨两列 | `.palette .ef-record` 强制单行 + 隐藏分类列 + 标题 ellipsis |
| 开关弹窗时三色条变宽、居中弹窗横跳 | 原生滚动条占位在 `overflow:hidden` 时消失，视口宽 1425→1440 | `scrollbar-width:none` 连占位一起移除；`body` 的 padding 补偿救不了 fixed 元素 |

### 7.2 Vue / SSG

| 症状 | 原因 | 修法 |
| --- | --- | --- |
| 老文章日期变成 “Tue Aug 11 2026…” | js-yaml 把 `2026-08-11` 解析成 Date，`String()` 后排序/月份全错 | content plugin 里归一化 `toISOString().slice(0,10)` |
| 成就弹窗表头跑到屏幕外、面板撑出视口 | 组件漏了 `id="ach-dialog"`，`#ach-dialog > .ef-panel` 的 `max-height` 没生效 | 补 id（`palette` 同理） |
| 品牌链接多出一块黄底 | `RouterLink` 自动给激活链接加 `aria-current`，命中 `.ef-rail a[aria-current]` | 品牌用 `custom` 插槽渲染普通 `<a>` |
| 文章之间跳转后目录高亮不动、进度不重置 | Vue 复用同一组件，`onMounted` 不再执行 | `<RouterView>` 按 `route.path` 加 key |
| 筛选 `?cat=` 也触发整页快门 | `router.replace({query})` 把 `/articles/` 规范化成 `/articles`，路径比较失败 | 路由统一尾斜杠 + 比较时去尾斜杠 |
| `<html lang="en">` | Vite/vite-ssg 默认 | `useHead({ htmlAttrs: { lang: 'zh-CN' } })` |
| SSG 页面 head 没标题/描述 | 顶层装 `@unhead/vue@3`，vite-ssg 内部是 v2，两个 head 客户端不共享 | 锁 `@unhead/vue@^2.1.2` |
| 构建报 “didn't resolve at build time”（字体） | CSS 字体路径没被 Vite 处理 | 字体放 `src/assets`，CSS 用相对路径 |
| sitemap `<loc>` 是相对路径 | postbuild 直接用路由 | 用 `SITE_URL` 环境变量拼绝对地址 |
| 直接打开 `file://` 白屏 | ES module + 绝对 `/assets` | 必须 HTTP；子路径部署设 `base` |

### 7.3 动效与滚动

| 症状 | 原因 | 修法 |
| --- | --- | --- |
| SPA 不触发换页动画 | `@view-transition { navigation: auto }` 只对跨文档导航生效 | 手动 `startViewTransition` 包路由 |
| Chrome 报 “Transition was aborted … DOM update timed out” | VT 更新回调里等 `requestAnimationFrame`，rAF 被挂起 | 只等 `nextTick` + `setTimeout(0)` |
| 返回文章时滚动位置缓慢爬行 | 全局 `html{scroll-behavior:smooth}` 作用于 scrollBehavior | 移除全局 smooth；目录锚点单独 `scrollIntoView({behavior:'smooth'})` |
| 转场中再点主题会冲突 | 两个 View Transition 同时进行 | 目前 Chrome 能处理；套件 `.ef-theming` 会禁用 root 动画，如需严格可加全局 busy 锁 |
| 切主题时滚动横幅停住 | View Transition 快照冻结 CSS 动画 | 已知取舍：保留圆形揭幕就有 ~300ms 停顿；若要求连续滚动则改 `wireTheme({reveal:false})` |
| 时间/计数变化时布局抖 | 数字宽度变化 | tabular-nums + 固定容器宽度 |
| 关闭弹窗时面板先淡出、后半段突然消失 | `ef-shut` 只写了 `to`，起点被当作 `none`，无法插值 | 补 `ef-shut-panel`，`from` 用 `inset(-6px)` |

### 7.4 测试工具（本机环境）

| 现象 | 说明 |
| --- | --- |
| `playwright-cli` 两次 bash 调用之间浏览器被杀 | 每个 Bash 调用结束会回收进程。截图/交互必须写在**一次调用**里 |
| `eval` 多语句报语法错 | CLI 会包成 `() => (expr)`；多语句用 IIFE `(()=>{...})()` |
| 键盘事件没反应 | `window.dispatchEvent` 不会到达 `document` 监听；dispatch 到 `document.body` 或用真实 `press` |
| 截图里 toast / 转场看不到 | 截图会快进 CSS 动画；用 `getAnimations()` 或时间序列判断，不要靠截图判在途动画 |
| 判断“关闭按钮是否在屏内”不能靠截图 | 缩放预览里 1–2px 的出界肉眼看不出来；用 `getBoundingClientRect().bottom` 对比 `innerHeight`，面板高度对比 `innerHeight × 比例` |
| `playwright-cli` 不在 PATH，或报“Executable doesn't exist … chromium-1247” | 本机没装 CLI；`~/.workbuddy/binaries/node/workspace` 里的 playwright 要 1247，本机缓存只有 1228。直接用 workspace 的 playwright + `chromium.launch({ channel: 'chrome' })` 走系统 Chrome；ESM 不认 `NODE_PATH`，用 `createRequire('…/workspace/package.json')` 引包 |
| `playwright-cli open file://…` 被拒绝 | 用本地服务器 |
| `vite preview` 的 `127.0.0.1` 502 | 它只监听 `::1`，用 `localhost:4173` |
| 后台服务器随命令结束消失 | 需要常驻时用宿主后台任务；测试可临时起、用完 kill |

### 7.5 层级与浮层

| 症状 | 原因 | 修法 |
| --- | --- | --- |
| 成就提示条被搜索/成就弹窗盖住，`z-index: 9999` 无效 | `<dialog>` 在 top layer，普通定位元素永远在下层 | 提示条容器加 `popover="manual"` + `showPopover()` |
| 弹窗打开后提示条又被压下去 | 两者都在 top layer，后 raise 的在上 | 弹窗打开时派发 `rhine:dialog-open`，提示条收到后重新 raise |
| 提示条出现后整页点不动 | 全屏容器吃掉了 pointer 事件 | 容器与 `.ef-toast` 都 `pointer-events:none` |

---

## 8. 修改指南

| 想改什么 | 改哪里 |
| --- | --- |
| 文章/摘要/标签 | `content/posts/*.md`，然后 `npm run build` |
| 站名/更新日期 | `content/site.json`（`updated` 会影响页脚、sitemap、第 N 天） |
| 新增页面 | `src/views/*.vue` + `src/router.ts` + `vite.config.ts` 的 `includedRoutes`（SSG 必须列出来） |
| 新增成就 | `src/composables/useAchievements.ts` 的 `ACHIEVEMENTS` + 对应触发点；满贯逻辑基于总数 |
| 换页动画时长/形状 | `src/styles/endfield.css` 的 `ef-shutter`（360ms）；不要动 `page-transition.ts` 的等待逻辑，除非重新验证 timeout |
| 三色条擦除距离 | `src/App.vue` 的 `scrollY / 72`；`--tri-wipe` 由它驱动 |
| 目录粘性位置 | `src/styles/site.css` 的 `.toc-wrap`，必须与 `.ef-margin` 上边距同值 |
| 弹窗页脚 / 关闭按钮 | 两个弹窗都套 `.dialog-foot`，按钮 `margin-left:auto`；新增弹窗沿用同一结构 |
| 手机弹窗高度 | `site.css` 的 `@media (max-width:719px)`：`#palette>.ef-panel{62dvh}`、`#ach-dialog>.ef-panel{74dvh}` |
| 提示条层级 | `ToastHost.vue` 的 `popover="manual"` 与 `rhine:dialog-open` 重新 raise；不要改回 `z-index` |
| 主题色/纸色 | 优先 `endfield.css` 的 token；项目层面可在 `site.css` 覆盖 `--ef-*`；保持黄色填充规则 |
| 字体 | `src/assets/fonts/`；保留 wdth 轴与 tnum；更新 `@font-face` 与 `index.html` 的 preload |
| 部署地址 | `SITE_URL=https://域名 npm run build`；子路径另设 `base` |
| 截图 | 起临时服务器后按 1440/1024/768/390 + 浅/深重拍，放 `screenshots/` |

---

## 9. 验证清单（改完必跑）

```bash
npm run typecheck
npm run build
npm run preview   # http://localhost:4173
```

- [ ] `dist/` 有 12 个 `index.html`（首页、articles、about、404、colophon、post/001–007）。
- [ ] `dist/404.html`、`dist/articles.html`、`dist/post/006.html` 等跳转桩存在；`sitemap.xml`、`robots.txt` 存在。
- [ ] 1440 / 1024 / 768 / 390 四档：无横向溢出；`footer bottom == 文档高度`；左栏 `top = 0`。
- [ ] 1440 文章页：目录 top 在 0/40/400px 滚动位置都是 56px；≤959px 为 static。
- [ ] 换页：点导航/文章/页脚 000 有斜切快门；`?cat=` 筛选与目录锚点**不**触发；返回文章滚动位置立即恢复。
- [ ] 主题：圆形揭幕、刷新后保持；深色下黄色线/字可读。
- [ ] 弹窗：成就/搜索可开、锁页面滚动、无系统滚动条、拖动自绘滚动条有效。
- [ ] 弹窗页脚：两个面板右下角都有「关闭」；390 宽下搜索面板 ≤62dvh、成就 ≤74dvh，按钮 `bottom` 在视口内。
- [ ] 提示条：开着搜索/成就弹窗时触发成就解锁，提示条压在弹窗之上，且不挡点击。
- [ ] 成就：首次、阅读、读完、深度、略读、404、000、Konami、连点、静音、深夜/清晨。
- [ ] 减弱动效：换页转场 0 次、页面仍可导航；滚动横幅变可横滚。
- [ ] 弹窗关闭有 180ms 收起动画；Esc 走同一路径；减少动效时立即关闭。
- [ ] 页面滚动条是自绘的；开关弹窗时三色条宽度与 dialog 位置完全不变。
- [ ] 控制台零报错、无 hydration 警告。

本轮实测基线：目录 56px 恒定；返回滚动 800→800；四档 `scrollWidth==clientWidth`；`footer bottom==docH`；`vue-tsc` 与构建通过。
弹窗基线（1440 / 390）：桌面搜索面板 `[448,87,544,726]`，关闭按钮 `bottom=791`、`right=972`（面板右沿 992）；手机搜索面板 `[16,160,358,523]`（523 ≈ 62dvh）、按钮 `bottom=662`（屏高 844）；手机成就面板 `[16,110,358,625]`（≈74dvh）、按钮 `bottom=717`；弹窗开着时 `:popover-open=true`，提示条文字「成就 No.11 · 键盘用户」压在面板之上。

---

## 10. 已知限制 / 待办

- **无 RSS/Atom**；无评论、无统计（有意）。
- **没有自动化测试**：目前靠 `vue-tsc` + 构建 + 手工/Playwright 走查。
- **搜索是客户端内存过滤**；文章多了以后可考虑构建期索引。
- 换页快门依赖 View Transition API：Safari/Firefox 不支持时自动退化为普通跳转（无动画）。
- 提示条压过弹窗依赖 Popover API（Chrome 114+ / Safari 17+）；不支持时退化为普通 fixed 元素，会被 `<dialog>` 盖住。
- 隐藏页 `/colophon/` 仍是公开 URL，只是 `noindex` + 不在列表；真正保密需要服务端鉴权。
- sitemap 默认 `http://localhost:4173`，部署必须传 `SITE_URL`。
- 没有 OG/Twitter 卡片、canonical；SEO 目前只有 title/description/noindex/sitemap。
- 成就与主题存在 localStorage；换域名/端口会丢进度，清站点数据也会丢。
- `content/site.json` 的 `updated` 是手动维护；忘记改会导致日期类信息滞后。

---

## 11. 部署

1. `SITE_URL=https://你的域名 npm run build`
2. 上传 `dist/` 到静态托管（GitHub Pages / Netlify / Cloudflare Pages / 对象存储均可）。
3. 托管需支持**目录索引**：`/articles/` → `articles/index.html`；`/post/006/` → `post/006/index.html`。
4. 404 使用根目录 `404.html`（已生成）。
5. 若部署在子路径（`https://host/repo/`），在 `vite.config.ts` 设 `base: '/repo/'` 并重建；同时把 `SITE_URL` 写成完整子路径。
6. 不需要 SPA rewrite：每个路由都有真实 HTML；未知路径由 `404.html` 接管。

---

## 12. 交接检查表

- [ ] 能跑 `dev / build / preview / typecheck`。
- [ ] 知道内容在 `content/posts/*.md`，不动 `dist/`。
- [ ] 知道 `endfield.css` 是套件、`site.css` 是版式覆盖。
- [ ] 知道黄色只做填充、切角=可点、数字必须真实。
- [ ] 知道换页转场在 `page-transition.ts`，不能用 rAF 等 DOM。
- [ ] 知道三色条 fixed + `--tri-wipe`、目录 sticky 与栏边距同值。
- [ ] 知道弹窗 id、`ScrollArea`、`modal-open`/`--sbw` 的约束。
- [ ] 知道弹窗页脚 `.dialog-foot` 与手机高度，知道提示条靠 Popover 进 top layer（不是 `z-index`）。
- [ ] 知道旧静态版已移除、备份在哪，不要再去找 `../endfield-blog/`。
- [ ] 改完按第 9 节清单回归，并更新 `screenshots/`。
