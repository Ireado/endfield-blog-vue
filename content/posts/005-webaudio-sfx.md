---
no: "005"
title: "Web Audio API：用振荡器合成界面音效"
date: 2026-09-18
category: "前端"
categoryEn: "FRONTEND"
tags: ["音频", "交互", "合成"]
abstract: "六种提示音，一百行代码，零音频文件。方波、包络，和一条不打扰人的音量线。"
secret: false
---

站点的提示音全部由振荡器实时合成，没有一个音频文件。六种声音——点击、确认、打开、关闭、出错、成就——代码一百行出头。

## 惰性初始化是铁律

<code>AudioContext</code> 在用户首次手势之前创建会被浏览器挂起。策略是首次 <code>pointerdown</code> 时初始化一次，之后每次播放只做状态检查。

```js
const ctx = new AudioContext();
const master = ctx.createGain();
master.gain.value = .14;   // 总音量压在「刚好注意到」之下
master.connect(ctx.destination);
```

## 一个提示音的解剖

所谓「嘀」声，就是一个 2kHz 方波：5ms 起音，30ms 指数衰减。方波的谐波带数字味；正弦太软，像催眠曲；锯齿太凶，像警报。

```js
const o = ctx.createOscillator(), g = ctx.createGain();
o.type = 'square';
o.frequency.value = 2000;
g.gain.setValueAtTime(0, t);
g.gain.linearRampToValueAtTime(.2, t + .005);      // 起音
g.gain.exponentialRampToValueAtTime(.001, t + .03); // 衰减
o.connect(g); g.connect(master);
o.start(t); o.stop(t + .05);
```

## 克制

- 只在点击时响，悬停不响——鼠标扫过一排链接时安静
- 总音量压在阈值下，戴耳机不刺耳，外放不吵到人
- 开关在一秒内可达：侧栏的「音效」

## 为什么没有悬停音

试过在导航上做悬停音，两分钟就删了。鼠标从屏幕左上角移到右上角，会顺路触发四五个链接，声音连成一串，像坏掉的计数器。界面音效的前提是「一次明确的动作」，悬停不是动作。

现在只有按下才响，而且同一时刻最多一声。成就音是唯一的多音——解锁值得一个琶音，但也只有三个音，间隔 90ms。

> 好的界面音效是潜意识里的确认，不是存在感的宣告。
