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
      // Try to fetch existing user first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // User exists, initialize auth state and redirect to their workspace
        await store.dispatch('auth/initializeAuth', { auth0, token });
        router.replace(`/workspaces/${store.getters['auth/defaultWorkspace']._id}`);
      } else if (response.status === 404) {
        // User doesn't exist, get user info from Auth0 and create new user
        const user = await auth0.getUser();
        await store.dispatch('auth/createUser', {
          userData: {
            auth0Id: user.sub,
            email: user.email,
            displayName: user.name || user.nickname,
            avatarUrl: user.picture
          },
          token
        });

        // Initialize auth state and redirect to workspace
        await store.dispatch('auth/initializeAuth', { auth0, token });
        router.replace(`/workspaces/${store.getters['auth/defaultWorkspace']._id}`);
      } else {
        throw new Error('Failed to fetch user');
      }
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