<template>
  <div class="invite-view">
    <div v-if="loading" class="loading">
      Loading...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="invite-content">
      <h1>You've been invited!</h1>
      <p>Please sign in or create an account to join the workspace</p>
      <button @click="handleAuth" class="auth-button">
        Continue with Auth0
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const route = useRoute();
const router = useRouter();
const store = useStore();
const loading = ref(true);
const error = ref(null);
const inviteData = ref(null);

const handleAuth = async () => {
  try {
    // Store invite data in localStorage
    if (inviteData.value) {
      localStorage.setItem('pendingInvite', JSON.stringify({
        token: route.params.token,
        workspaceId: inviteData.value.workspaceId,
        email: inviteData.value.invitedEmail
      }));
    }

    // Redirect to Auth0 login with invite-specific options
    await store.dispatch('auth/login', {
      invitation: true,
      appState: {
        returnTo: '/auth/callback',
        inviteToken: route.params.token
      }
    });
  } catch (err) {
    error.value = 'Failed to initiate authentication. Please try again.';
    console.error('Auth error:', err);
  }
};

onMounted(async () => {
  try {
    // Validate and get invite details
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invites/validate/${route.params.token}`);
    
    if (!response.ok) {
      throw new Error('This invite link is invalid or has expired');
    }
    
    const data = await response.json();
    inviteData.value = data;
    loading.value = false;
  } catch (err) {
    error.value = err.message;
    loading.value = false;
  }
});
</script>

<style scoped>
.invite-view {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1A1D21;
  color: #fff;
}

.invite-content {
  text-align: center;
  padding: 2rem;
  background-color: #222529;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

p {
  margin-bottom: 2rem;
  color: #9da3a7;
}

.auth-button {
  background-color: #007a5a;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-button:hover {
  background-color: #006c4f;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  background-color: #222529;
  border-radius: 8px;
}

.error {
  color: #e01e5a;
}
</style>
