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
    const { appState } = await auth0.handleRedirectCallback();
    const token = await auth0.getTokenSilently();
    const user = await auth0.getUser();
    // Initialize auth state first
    await store.dispatch('auth/initializeAuth', { token: token });

    if (appState?.inviteToken) {
      // Handle invite flow
      const inviteResponse = await store.dispatch('invites/acceptInvite', { 
        token: appState.inviteToken,
        userId: user.sub
      });
      
      // First fetch workspaces
      await store.dispatch('workspaces/fetchWorkspaces');
      const workspaceId = store.getters['workspaces/currentWorkspace']._id;
      
      // Then fetch other data in parallel
      await Promise.all([
        store.dispatch('workspaces/fetchWorkspace', { workspaceId }),
        store.dispatch('channels/fetchChannels', { workspaceId, token }),
        store.dispatch('conversations/fetchConversations')
      ]);

      // Connect socket only after all data is loaded
      connect(token);
      router.push(`/workspaces/${workspaceId}`);
    } else {
      // Regular login flow
      // First fetch workspaces
      await store.dispatch('workspaces/fetchWorkspaces');
      const defaultWorkspace = store.getters['workspaces/currentWorkspace']._id;
      
      if (!defaultWorkspace) {
        throw new Error('No workspace available');
      }

      // Then fetch other data in parallel
      await Promise.all([
        store.dispatch('workspaces/fetchWorkspace', { 
          workspaceId: defaultWorkspace, 
          token 
        }),
        store.dispatch('channels/fetchChannels', {
          workspaceId: defaultWorkspace,
          token
        }),
        store.dispatch('conversations/fetchConversations')
      ]);

      // Connect socket only after all data is loaded
      connect(token);
      router.push(`/workspaces/${defaultWorkspace}`);
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
  width: 100vw;
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