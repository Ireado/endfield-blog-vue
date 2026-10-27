// 一次性迁移：把旧站的 content.mjs 转成 Markdown（正文不改）
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE, POSTS, SECRET } from '../../endfield-blog/tools/content.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url)) + '/';

const fence = lang => '```' + (lang || 'text');

const toMarkdown = blocks => blocks.map(b => {
  switch (b.t) {
    case 'p': return `${b.x}\n`;
    case 'h2': return `## ${b.x}\n`;
    case 'h3': return `### ${b.x}\n`;
    case 'ul': return b.items.map(i => `- ${i}`).join('\n') + '\n';
    case 'ol': return b.items.map((i, n) => `${n + 1}. ${i}`).join('\n') + '\n';
    case 'quote': return `> ${b.x}\n`;
    case 'note': return `:::note ${b.flag || '注意'}\n${b.x}\n:::\n`;
    case 'code': return `${fence(b.lang)}\n${b.x}\n\`\`\`\n`;
    default: return '';
  }
}).join('\n');

const matter = p => `---
no: "${p.no}"
title: ${JSON.stringify(p.title)}
date: ${p.date}
category: ${JSON.stringify(p.cat)}
categoryEn: ${JSON.stringify(p.catEn)}
tags: [${p.tags.map(t => JSON.stringify(t)).join(', ')}]
abstract: ${JSON.stringify(p.abstract)}
secret: ${p.no === SECRET.no}
---

`;

for (const p of [...POSTS, SECRET]) {
  const file = `${ROOT}content/posts/${p.no}-${p.slug}.md`;
  writeFileSync(file, matter(p) + toMarkdown(p.blocks), 'utf8');
  console.log('✓', file.replace(ROOT, ''));
}

writeFileSync(`${ROOT}content/site.json`, JSON.stringify(SITE, null, 2) + '\n', 'utf8');
console.log('✓ content/site.json');
