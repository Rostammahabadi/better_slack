<template>
  <div class="join-container">
    <div class="loading">
      Redirecting to login...
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const auth0 = inject('auth0');

onMounted(async () => {
  const invitation = new URLSearchParams(window.location.search).get('invitation');
  
  if (invitation) {
    // Store invitation in sessionStorage
    sessionStorage.setItem('invitation', invitation);
    // Redirect to Auth0 with invitation in state
    await auth0.loginWithRedirect({
      authorizationParams: {
        invitation
      }
    });
  } else {
    // If no invitation, redirect to login
    router.push('/login');
  }
});
</script>

<style scoped>
.join-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.loading {
  font-size: 1.2rem;
  color: var(--slack-subtle);
}
</style> 