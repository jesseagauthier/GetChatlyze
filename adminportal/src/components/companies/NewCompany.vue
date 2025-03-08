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
          <label for="domain" class="block text-sm font-medium text-neutral-700 mb-1">Website Domain</label>
          <input id="domain" v-model="company.domain" type="text" placeholder="example.com" class="form-input">
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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isSubmitting = ref(false);
const autoGenerateApiKey = ref(true);

const company = reactive({
  name: '',
  domain: '',
  apiKey: '',
  clientSecret: '',
  plan: 'basic',
  active: true,
  contactEmail: '',
  contactName: '',
  maxAgents: 1,
  trialEndsAt: ''
});

// Generate random API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  company.apiKey = result;
};

// Handle auto-generate checkbox change
const handleAutoGenerateChange = () => {
  if (autoGenerateApiKey.value) {
    generateApiKey();
  }
};

// Generate initial API key on component load
if (autoGenerateApiKey.value) {
  generateApiKey();
}

const createCompany = async () => {
  try {
    isSubmitting.value = true;

    // Format date properly if needed
    if (company.trialEndsAt) {
      company.trialEndsAt = new Date(company.trialEndsAt).toISOString();
    }

    // Call your API to create company
    // await createCompany(company);

    // For now, just log the company data
    console.log('Creating company:', company);

    // Show success message
    alert('Company created successfully!');

    // Redirect to companies list
    router.push('/companies');
  } catch (error) {
    console.error('Error creating company:', error);
    alert('Failed to create company. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const cancel = () => {
  router.push('/companies');
};
</script>
