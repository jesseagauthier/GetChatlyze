import { defineStore } from 'pinia'
import { appwrite, ID, Query } from '@/lib/appWrite.js'
import { ref, computed } from 'vue'

export const useCompaniesStore = defineStore('companies', () => {
  // State as refs
  const companies = ref([])
  const currentCompany = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const singleCompanyLoading = ref(false)
  const createCompanyLoading = ref(false)
  const updateCompanyLoading = ref(false)
  const deleteCompanyLoading = ref(false)
  const createCompanyViaFunctionLoading = ref(false)

  // Getters as computed
  const getCompanyById = (id) => {
    return companies.value.find((company) => company.$id === id) || null
  }

  const activeCompanies = computed(() =>
    companies.value.filter((company) => company.active === true),
  )

  const companiesByPlan = (plan) => companies.value.filter((company) => company.plan === plan)

  // Actions as functions
  async function fetchCompanies() {
    loading.value = true
    error.value = null

    try {
      const response = await appwrite.database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
        [Query.limit(100)],
      )

      companies.value = response.documents
      return companies.value
    } catch (err) {
      console.error('Error fetching companies:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCompany(companyId) {
    singleCompanyLoading.value = true
    error.value = null

    try {
      const company = await appwrite.database.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
        companyId,
      )

      currentCompany.value = company
      return company
    } catch (err) {
      console.error(`Error fetching company with ID ${companyId}:`, err)
      error.value = err.message
      throw err
    } finally {
      singleCompanyLoading.value = false
    }
  }

  async function createCompany(companyData) {
    createCompanyLoading.value = true
    error.value = null

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

      companies.value.push(createdCompany)
      return createdCompany
    } catch (err) {
      console.error('Error creating company:', err)
      error.value = err.message
      throw err
    } finally {
      createCompanyLoading.value = false
    }
  }

  async function createCompanyViaFunction(companyData) {
    createCompanyViaFunctionLoading.value = true
    error.value = null

    try {
      // Get the current user's session token for authentication
      const session = await appwrite.account.getSession('current')

      // Prepare the headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Session': session.secret,
      }

      // Make the API call to the cloud function
      const response = await fetch('http://67cc79c14ccc888c1ab7.appwrite.global/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          name: companyData.name,
          domain: companyData.domain || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create company via cloud function')
      }

      const result = await response.json()

      if (result.success && result.company) {
        // Add the newly created company to our local state
        companies.value.push(result.company)
        return result.company
      } else {
        throw new Error('Company creation was not successful')
      }
    } catch (err) {
      console.error('Error creating company via cloud function:', err)
      error.value = err.message
      throw err
    } finally {
      createCompanyViaFunctionLoading.value = false
    }
  }

  async function updateCompany(companyId, updatedData) {
    updateCompanyLoading.value = true
    error.value = null

    try {
      const updatedCompany = await appwrite.database.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
        companyId,
        updatedData,
      )

      // Update local state
      const index = companies.value.findIndex((c) => c.$id === companyId)
      if (index !== -1) {
        companies.value[index] = updatedCompany
      }

      if (currentCompany.value && currentCompany.value.$id === companyId) {
        currentCompany.value = updatedCompany
      }

      return updatedCompany
    } catch (err) {
      console.error(`Error updating company with ID ${companyId}:`, err)
      error.value = err.message
      throw err
    } finally {
      updateCompanyLoading.value = false
    }
  }

  async function deleteCompany(companyId) {
    deleteCompanyLoading.value = true
    error.value = null

    try {
      await appwrite.database.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMPANIES_COLLECTION_ID,
        companyId,
      )

      // Remove from local state
      companies.value = companies.value.filter((c) => c.$id !== companyId)

      if (currentCompany.value && currentCompany.value.$id === companyId) {
        currentCompany.value = null
      }

      return true
    } catch (err) {
      console.error(`Error deleting company with ID ${companyId}:`, err)
      error.value = err.message
      throw err
    } finally {
      deleteCompanyLoading.value = false
    }
  }

  // Return everything that should be exposed
  return {
    companies,
    currentCompany,
    loading,
    error,
    singleCompanyLoading,
    createCompanyLoading,
    updateCompanyLoading,
    deleteCompanyLoading,
    createCompanyViaFunctionLoading,
    getCompanyById,
    activeCompanies,
    companiesByPlan,
    fetchCompanies,
    fetchCompany,
    createCompany,
    createCompanyViaFunction,
    updateCompany,
    deleteCompany,
  }
})
