<template>
  <div class="invite-container">
    <div v-if="isLoading" class="loading">
      Verifying invitation...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="invite-content">
      <img src="@/assets/slack-logo.svg" alt="ChatGenius" class="logo" />
      <h1>Join {{ workspaceName }}</h1>
      <p class="subtitle">You've been invited to join this workspace on ChatGenius</p>
      <button 
        class="continue-button"
        @click="handleAuth"
        :disabled="isLoading"
      >
        Continue with Auth0
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRoute } from 'vue-router';


const route = useRoute();
const auth0 = inject('auth0');

const isLoading = ref(false);
const error = ref(null);
const workspaceName = ref('Workspace');

const handleAuth = async () => {
  try {
    isLoading.value = true;
    
    // Store the invite token in Auth0's app state
    await auth0.loginWithRedirect({
      appState: {
        inviteToken: route.params.token
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    error.value = 'Failed to initiate authentication. Please try again.';
    isLoading.value = false;
  }
};
</script>

<style scoped>
.invite-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #1A1D21;
}

.invite-content {
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 2rem;
  background-color: #222529;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 2.5rem;
  margin-bottom: 2rem;
}

h1 {
  color: #FFFFFF;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.subtitle {
  color: #ABABAD;
  margin-bottom: 2rem;
}

.continue-button {
  width: 100%;
  padding: 12px;
  background-color: #007A5A;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.continue-button:hover:not(:disabled) {
  background-color: #006c4f;
}

.continue-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  color: #ABABAD;
  font-size: 1.2rem;
}

.error {
  color: #E01E5A;
}
</style>
