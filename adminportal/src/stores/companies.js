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

  async function createCompany(companyData) {
    createCompanyLoading.value = true
    error.value = null

    try {
      const response = await makeApiCall(companyData)
      const result = await handleApiResponse(response)
      if (result.success && result.company) {
        return
      } else {
        throw new Error('Company creation was not successful')
      }
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      createCompanyLoading.value = false
    }
  }

  async function makeApiCall(companyData) {
    return await fetch('https://67cc79c14ccc888c1ab7.appwrite.global/', {
      method: 'POST',
      body: JSON.stringify({
        name: companyData.name,
        domain: companyData.domain || '',
      }),
    })
  }

  async function handleApiResponse(response) {
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create company via cloud function')
    }
    return await response.json()
  }

  function handleError(err) {
    console.error('Error creating company via cloud function:', err)
    error.value = err.message
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
    createCompany,
    updateCompany,
    deleteCompany,
  }
})
