<template>
  <div class="callback-container">
    <div class="loading">
      Setting up your workspace...
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useSocket } from '../services/socketService';
import { inject } from 'vue';

const router = useRouter();
const store = useStore();
const auth0 = inject('auth0');
const { connect } = useSocket(store);

const handleCallback = async () => {
  try {
    // Get the authentication result and appState
    const { appState } = await auth0.handleRedirectCallback();
    
    // Get the token silently
    const token = await auth0.getTokenSilently();

    // Get the user data
    const user = await auth0.getUser();
    
    // Connect socket with the new token
    connect(token);

    if (appState?.inviteToken) {
      // Handle invite flow
      const inviteResponse = await store.dispatch('invites/acceptInvite', { 
        token: appState.inviteToken,
        userId: user.sub
      });
      
      // Initialize auth state with the new token
      await store.dispatch('auth/initializeAuth', { token });
      
      // Navigate to the workspace they were invited to
      router.push(`/workspaces/${inviteResponse.workspaces[0]._id}`);
    } else {
      // Regular login flow
      await store.dispatch('auth/initializeAuth', { token });
      
      // Get the default workspace
      const defaultWorkspace = store.getters['auth/defaultWorkspace'];
      if (!defaultWorkspace) {
        throw new Error('No workspace available');
      }
      
      // Navigate to the default workspace
      router.push(`/workspaces/${defaultWorkspace._id}`);
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