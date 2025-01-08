<template>
  <div class="callback-container">
    <div class="loading">
      Setting up your workspace...
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();
const auth0 = inject('auth0');

const handleCallback = async () => {
  try {
    // Handle the authentication callback
    await auth0.handleRedirectCallback();
    
    // Get the token
    const token = await auth0.getTokenSilently();
    
    try {
      // User exists, initialize auth state and redirect to their workspace
        await store.dispatch('auth/initializeAuth', { auth0, token });
        const workspaceId = store.getters['auth/defaultWorkspace']._id;
        router.push(`/workspaces/${workspaceId}`);
      } catch (error) {
        console.error('User fetch/create error:', error);
        router.push('/login');
    }
  } catch (error) {
    console.error('Callback error:', error);
    router.push('/login');
  }
};

// Handle the callback immediately
handleCallback();
</script>

<style scoped>
.callback-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1A1D21;
}

.loading {
  color: #ABABAD;
  font-size: 1.2rem;
}
</style> 