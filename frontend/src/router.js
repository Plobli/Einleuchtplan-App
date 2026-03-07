import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue')
  },
  {
    path: '/',
    name: 'Shows',
    component: () => import('./views/Shows.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trash',
    name: 'Trash',
    component: () => import('./views/Trash.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('./views/Archive.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/show/:slug',
    name: 'ShowDetail',
    component: () => import('./views/ShowDetail.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
