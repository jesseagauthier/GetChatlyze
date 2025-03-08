import { defineStore } from 'pinia'
import { appwrite, ID, Query } from '@/lib/appWrite.js'

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    companies: [],
    currentCompany: null,
    loading: false,
    error: null,
    singleCompanyLoading: false,
    createCompanyLoading: false,
    updateCompanyLoading: false,
    deleteCompanyLoading: false,
  }),

  getters: {
    getCompanyById: (state) => (id) => {
      return state.companies.find((company) => company.$id === id) || null
    },

    activeCompanies: (state) => {
      return state.companies.filter((company) => company.active === true)
    },

    companiesByPlan: (state) => (plan) => {
      return state.companies.filter((company) => company.plan === plan)
    },
  },

  actions: {
    // Fetch all companies
    async fetchCompanies() {
      this.loading = true
      this.error = null

      try {
        const response = await appwrite.database.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
          [Query.limit(100)],
        )

        this.companies = response.documents
        return this.companies
      } catch (error) {
        console.error('Error fetching companies:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch a single company by ID
    async fetchCompany(companyId) {
      this.singleCompanyLoading = true
      this.error = null

      try {
        const company = await appwrite.database.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
          companyId,
        )

        this.currentCompany = company
        return company
      } catch (error) {
        console.error(`Error fetching company with ID ${companyId}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.singleCompanyLoading = false
      }
    },

    // Create a new company
    async createCompany(companyData) {
      this.createCompanyLoading = true
      this.error = null

      try {
        // Generate API key if not provided
        if (!companyData.apiKey) {
          companyData.apiKey = ID.unique()
        }

        // Set default values if not provided
        const newCompany = {
          name: companyData.name,
          domain: companyData.domain || null,
          apiKey: companyData.apiKey,
          clientSecret: companyData.clientSecret || null,
          plan: companyData.plan || 'basic',
          active: typeof companyData.active === 'boolean' ? companyData.active : true,
          contactEmail: companyData.contactEmail || null,
          contactName: companyData.contactName || null,
          settings: companyData.settings || {},
          maxAgents: companyData.maxAgents || 1,
          customization: companyData.customization || {},
          createdAt: new Date().toISOString(),
          trialEndsAt: companyData.trialEndsAt || null,
        }

        const createdCompany = await appwrite.database.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
          ID.unique(),
          newCompany,
        )

        this.companies.push(createdCompany)
        return createdCompany
      } catch (error) {
        console.error('Error creating company:', error)
        this.error = error.message
        throw error
      } finally {
        this.createCompanyLoading = false
      }
    },

    // Update an existing company
    async updateCompany(companyId, updatedData) {
      this.updateCompanyLoading = true
      this.error = null

      try {
        const updatedCompany = await appwrite.database.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
          companyId,
          updatedData,
        )

        // Update local state
        const index = this.companies.findIndex((c) => c.$id === companyId)
        if (index !== -1) {
          this.companies[index] = updatedCompany
        }

        if (this.currentCompany && this.currentCompany.$id === companyId) {
          this.currentCompany = updatedCompany
        }

        return updatedCompany
      } catch (error) {
        console.error(`Error updating company with ID ${companyId}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.updateCompanyLoading = false
      }
    },

    // Delete a company
    async deleteCompany(companyId) {
      this.deleteCompanyLoading = true
      this.error = null

      try {
        await appwrite.database.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
          companyId,
        )

        // Remove from local state
        this.companies = this.companies.filter((c) => c.$id !== companyId)

        if (this.currentCompany && this.currentCompany.$id === companyId) {
          this.currentCompany = null
        }

        return true
      } catch (error) {
        console.error(`Error deleting company with ID ${companyId}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.deleteCompanyLoading = false
      }
    },
  },
})
