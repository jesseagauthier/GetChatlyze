import { defineStore } from 'pinia'
import { Account } from 'appwrite'
import { client } from '../lib/appWrite.js'

const account = new Account(client)

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    authStatus: (state) => state.isAuthenticated,
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        const session = await account.createEmailPasswordSession(email, password)
        const user = await account.get()

        this.user = user
        this.isAuthenticated = true
        return user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null

      try {
        await account.deleteSession('current')
        this.user = null
        this.isAuthenticated = false
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async checkAuth() {
      this.loading = true

      try {
        const user = await account.get()
        this.user = user
        this.isAuthenticated = true
        return user
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
      } finally {
        this.loading = false
      }
    },
  },
})
