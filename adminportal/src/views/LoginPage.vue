<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
    <!-- Background decorative elements -->
    <div
      class="fixed top-0 right-0 pointer-events-none opacity-20 w-64 h-64 md:w-96 md:h-96 bg-indigo-500 rounded-full blur-3xl">
    </div>
    <div
      class="fixed bottom-0 left-0 pointer-events-none opacity-10 w-64 h-64 md:w-96 md:h-96 bg-purple-500 rounded-full blur-3xl">
    </div>

    <div class="w-full max-w-md z-10">
      <!-- Logo and header section -->
      <div class="text-center mb-8">
        <div
          class="mx-auto h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Admin Portal
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to access your dashboard
        </p>
      </div>

      <!-- Login form card -->
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div class="relative">
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input id="email" name="email" type="email" v-model="email" required
                class="pl-10 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="you@example.com" />
            </div>
          </div>

          <!-- Password field -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="#" class="text-xs text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>
            <div class="relative">
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input id="password" name="password" type="password" v-model="password" required
                class="pl-10 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="••••••••" />
            </div>
          </div>

          <!-- Remember me toggle -->
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox"
              class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <!-- Error message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start"
            role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500 mt-0.5 flex-shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div>

          <!-- Submit button -->
          <div>
            <button type="submit"
              class="relative w-full flex justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              :disabled="loading">
              <span v-if="loading" class="absolute left-4 inset-y-0 flex items-center">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
              </span>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Additional links -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Need access?
          <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">
            Contact administrator
          </a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-xs text-gray-500">
      &copy; 2025 ChatLyze. All rights reserved.
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  setup() {
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)
    const authStore = useAuthStore()
    const router = useRouter()

    const handleLogin = async () => {
      loading.value = true
      error.value = ''

      try {
        await authStore.login(email.value, password.value)
        router.push('/')
      } catch (err) {
        error.value = err.message || 'Failed to login. Please check your credentials.'
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      error,
      loading,
      handleLogin
    }
  }
}
</script>

<style>
@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0px);
  }
}

.float-animation {
  animation: float 6s ease-in-out infinite;
}
</style>
