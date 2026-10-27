import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes, scrollBehavior } from './router'
import { installPageTransition } from './page-transition'
import './styles/endfield.css'
import './styles/site.css'

export const createApp = ViteSSG(App, { routes, scrollBehavior }, ({ router }) => {
  if (typeof document !== 'undefined') installPageTransition(router)
})
