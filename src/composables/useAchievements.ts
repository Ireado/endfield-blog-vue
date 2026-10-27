import { computed, ref } from 'vue'
import { secret, stats } from 'virtual:blog'
import { toast } from './useToast'
import { play } from './useSound'

export interface Achievement {
  id: string
  no: string
  name: string
  desc: string
  secret?: boolean
  hint?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'boot', no: '01', name: '首次到访', desc: '打开这个站点。' },
  { id: 'reader', no: '02', name: '第一篇', desc: '打开任意一篇文章。' },
  { id: 'archivist', no: '03', name: '全部读完', desc: '读过全部七篇文章。' },
  { id: 'deepscan', no: '04', name: '深度阅读', desc: '一篇文章读到 80%。' },
  { id: 'skimmer', no: '05', name: '匆匆一瞥', desc: '打开一篇，五秒内就离开。' },
  { id: 'secret', no: '06', name: '目录之外', desc: `找到隐藏的 No.${secret.no}。`, secret: true, hint: '线索：页脚最右下角那串编号。' },
  { id: 'night', no: '07', name: '深夜', desc: '在 00:00 到 05:00 之间来访。' },
  { id: 'early', no: '08', name: '清晨', desc: '在 05:00 到 07:00 之间来访。' },
  { id: 'silence', no: '09', name: '静音', desc: '关掉音效。' },
  { id: 'theme', no: '10', name: '反色', desc: '切换一次深浅主题。' },
  { id: 'keyboard', no: '11', name: '键盘用户', desc: '用 Ctrl / ⌘ + K 打开搜索。' },
  { id: 'konami', no: '12', name: '上上下下', desc: '输入那段古老的代码。', secret: true, hint: '↑ ↑ ↓ ↓ ← → ← → B A' },
  { id: 'wordmark', no: '13', name: '连点', desc: '连点首页的字标七次。', secret: true, hint: '线索：首页那个很大的名字。' },
  { id: 'lost', no: '14', name: '迷路', desc: '打开一个不存在的地址。' },
  { id: 'full', no: '15', name: '全部达成', desc: '解锁其余全部成就。' },
]

const TOTAL = ACHIEVEMENTS.length
const KEY = 'rhine.v1'

interface Store {
  ach: string[]
  read: string[]
  lastPost: { no: string; ts: number } | null
}

function load(): Store {
  if (typeof localStorage === 'undefined') return { ach: [], read: [], lastPost: null }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      ach: Array.isArray(raw.ach) ? raw.ach : [],
      read: Array.isArray(raw.read) ? raw.read : [],
      lastPost: raw.lastPost || null,
    }
  } catch {
    return { ach: [], read: [], lastPost: null }
  }
}

const store = load()
const unlocked = ref<string[]>(store.ach)
const read = ref<string[]>(store.read)
const enteredAt = ref(0)

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ach: unlocked.value, read: read.value, lastPost: store.lastPost }))
  } catch {}
}

const has = (id: string) => unlocked.value.includes(id)
const count = computed(() => unlocked.value.length)
const total = TOTAL

function unlock(id: string) {
  if (has(id)) return
  const def = ACHIEVEMENTS.find(a => a.id === id)
  if (!def) return
  unlocked.value = [...unlocked.value, id]
  persist()
  toast(`成就 No.${def.no} · ${def.name}`)
  play('achieve')
  if (id !== 'full' && unlocked.value.filter(x => x !== 'full').length === TOTAL - 1 && !has('full')) {
    setTimeout(() => unlock('full'), 800)
  }
}

type RouteLike = { name?: string | symbol | null; params?: Record<string, string | string[]> }

export function useAchievements() {
  function begin() {
    unlock('boot')
    const hour = new Date().getHours()
    if (hour < 5) unlock('night')
    else if (hour < 7) unlock('early')
  }

  function enter(to: RouteLike, from?: RouteLike | null) {
    const leavingPost = from?.name === 'post' || from?.name === 'colophon'
    if (leavingPost && enteredAt.value && Date.now() - enteredAt.value < 5000) unlock('skimmer')

    const rawNo = to.params?.no
    const no = Array.isArray(rawNo) ? rawNo[0] : rawNo
    if (to.name === 'post' && no) {
      enteredAt.value = Date.now()
      store.lastPost = { no, ts: Date.now() }
      persist()
      if (!read.value.includes(no)) {
        read.value = [...read.value, no]
        persist()
      }
      unlock('reader')
      /* archivist：读完全部正式文章。数量与隐藏档案编号都取自内容数据，不写死。 */
      if (read.value.filter(n => n !== secret.no).length >= stats.count) unlock('archivist')
    } else if (to.name === 'colophon') {
      enteredAt.value = Date.now()
      store.lastPost = { no: secret.no, ts: Date.now() }
      persist()
      unlock('secret')
    } else if (to.name === 'not-found') {
      unlock('lost')
    }
  }

  function checkReload(currentName?: string | symbol | null, currentNo?: string) {
    const saved = store.lastPost
    if (!saved) return
    const same = currentName === 'post' && currentNo === saved.no
    if (!same && Date.now() - saved.ts < 5000) unlock('skimmer')
  }

  return {
    defs: ACHIEVEMENTS,
    total,
    count,
    has,
    unlock,
    begin,
    enter,
    checkReload,
    theme: () => unlock('theme'),
    keyboard: () => unlock('keyboard'),
    deepscan: () => unlock('deepscan'),
    silence: () => unlock('silence'),
    konami: () => unlock('konami'),
    wordmark: () => unlock('wordmark'),
  }
}
