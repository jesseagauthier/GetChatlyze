<template>
  <div class="max-w-3xl mx-auto p-5">
    <h2 class="text-2xl font-semibold text-neutral-800 mb-6">Create New Company</h2>

    <form @submit.prevent="createCompany" class="card">
      <div class="card-body">
        <!-- Company Name -->
        <div class="mb-5">
          <label for="name" class="block text-sm font-medium text-neutral-700 mb-1">Company Name *</label>
          <input id="name" v-model="company.name" type="text" required placeholder="Enter company name"
            class="form-input">
        </div>

        <!-- Website Domain -->
        <div class="mb-5">
          <label for="domain" class="block text-sm font-medium text-neutral-700 mb-1">Website Domain *</label>
          <input id="domain" v-model="company.domain" type="text" required placeholder="example.com" class="form-input">
          <p class="text-xs text-neutral-500 mt-1">Enter the main domain without http:// or www (e.g., example.com)</p>
        </div>
        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 mt-8">
          <button type="button" @click="cancel" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Company' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCompaniesStore } from '@/stores/companies';

const router = useRouter();
const companiesStore = useCompaniesStore();

const company = reactive({
  name: '',
  domain: '',
});

// Use the loading state from the store
const isSubmitting = computed(() => companiesStore.createCompanyViaFunctionLoading);

const createCompany = async () => {
  try {
    // Call the cloud function via the store
    const createdCompany = await companiesStore.createCompanyViaFunction({
      name: company.name,
      domain: company.domain
    });
    // Redirect to companies list
    router.push('/companies');
  } catch (error) {
    console.error('Error creating company:', error);

  }
};

const cancel = () => {
  router.push('/companies');
};
</script>
