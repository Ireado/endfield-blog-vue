declare module 'virtual:blog' {
  export const site: import('./blog').SiteInfo
  export const posts: import('./blog').Post[]
  export const secret: import('./blog').Post
  export const stats: import('./blog').Stats
}

declare module 'markdown-it-container'
