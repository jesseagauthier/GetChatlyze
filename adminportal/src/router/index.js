import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Import your components
import LoginPage from '../views/LoginPage.vue'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  // Define other routes here
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Router guard to protect routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check if we already have user data, if not try to fetch it
  if (!authStore.isAuthenticated) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      // Handle error silently - user is not authenticated
    }
  }

  // Route requires auth but user is not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  }
  // User is authenticated but trying to access login page
  else if (authStore.isAuthenticated && to.name === 'Login') {
    next('/')
  }
  // Allow access
  else {
    next()
  }
})

export default router
