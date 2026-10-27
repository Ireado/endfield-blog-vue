export interface SiteInfo {
  name: string
  zh: string
  tagline: string
  launch: string
  updated: string
  secretNo: string
}

export interface Heading {
  id: string
  text: string
}

export interface Post {
  no: string
  slug: string
  title: string
  date: string
  category: string
  categoryEn: string
  tags: string[]
  abstract: string
  secret: boolean
  html: string
  headings: Heading[]
  chars: number
  minutes: number
}

export interface Stats {
  count: number
  totalChars: number
  cats: { name: string; count: number }[]
  months: { label: string; count: number }[]
  days: number
  first: string
  latest: string
}

export interface BlogData {
  site: SiteInfo
  posts: Post[]
  secret: Post
  stats: Stats
}
