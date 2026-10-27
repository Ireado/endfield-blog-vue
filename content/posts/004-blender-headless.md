---
no: "004"
title: "Blender 无头渲染管线实录"
date: 2026-08-30
category: "渲染"
categoryEn: "RENDERING"
tags: ["Blender", "颜色", "视频"]
abstract: "无头模式、颜色保真四开关、帧精确抽帧。让 #E6BB2F 进去，#E6BB2F 出来。"
secret: false
---

这是一条从三次返工里换来的管线记录：如何在无头模式下，让 Blender 输出像素级符合设计稿的平面帧。核心诉求只有一个——<code>#E6BB2F</code> 进去，<code>#E6BB2F</code> 出来。

## 基本式

```bash
blender -b scene.blend -P render.py -- --frames 1-120
```

<code>-b</code> 跳过界面，<code>-P</code> 注入调度脚本，<code>--</code> 之后的参数由脚本里的 sys.argv 接住。产出直接落到指定目录，适合放进定时任务。

## 颜色保真的四个开关

要让一个 HEX 值渲染后纹丝不动，四件事必须同时成立，缺一个都会漂：

- 材质用 <code>Emission</code>，强度锁 1.0——任何光源都会引入不可控的能量分配
- view_transform 设 <code>Standard</code>，look 设 <code>None</code>
- 曝光归零、gamma 归一
- 正交相机，<code>ortho_scale</code> 精确等于画幅宽度

:::note 教训
抽帧必须帧精确：用 select=eq(n\,N)，不要用 -ss 秒数。画面里有匀速移动的元素时，-ss 的累计误差能差出一整行——曾把这个误差记到编码头上，白调了一下午。
:::

## 量颜色和量编码要分开

颜色保真在渲染端用纯色块命中验证；编码保真才做逐像素比对。亚 2px 的细线本来就到不了纯色——1.7px 线的峰值覆盖率约 0.63，拿它当取样点只会误判。

## 批次与命名

一次渲染的产物按「工程名-版本-帧号」命名，目录结构固定，失败的一帧单独落到 <code>reject/</code>，附带当时的参数快照。这样两周后回来，还能知道那一帧为什么不对。

:::note 习惯
脚本不覆盖同名文件，而是报错。宁可在跑之前改名字，也不要在一小时后发现旧的结果被新的顶掉。
:::

> 管线的意义不是自动化，是让每一次失败都留下可检索的记录。
