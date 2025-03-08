<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button @click="logout"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Sign Out
        </button>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4 flex items-center justify-center">
            <div class="text-center">
              <h2 class="text-xl font-semibold mb-2">Welcome, {{ user?.name || 'Admin' }}</h2>
              <p>This is your protected dashboard.</p>
              <NewCompany />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Components
import NewCompany from '@/components/companies/NewCompany.vue'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
