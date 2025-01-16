<template>
  <div class="login-container">
    <header class="header">
      <img src="@/assets/slack-logo.svg" alt="ChatGenius" class="logo" />
    </header>
    
    <main class="main">
      <div v-if="isLoading" class="loading">
        Checking authentication...
      </div>
      <div v-else class="container">
        <h1>Sign in to ChatGenius</h1>
        <p class="subtitle">We suggest using the email address you use at work.</p>
        
        <div class="auth-buttons">
          <button 
            class="social-button google-button" 
            @click="signInWithGoogle"
            :disabled="isLoading"
          >
            <img src="@/assets/google-icon.svg" alt="Google" />
            <span>Sign In With Google</span>
          </button>
          
          <button class="social-button apple-button">
            <img src="@/assets/apple-icon.svg" alt="Apple" />
            <span>Sign In With Apple</span>
          </button>
        </div>

        <div class="divider">
          <span>OR</span>
        </div>

        <form @submit.prevent="signInWithEmail" class="email-form">
          <div class="input-group">
            <input 
              type="email" 
              v-model="email" 
              placeholder="name@work-email.com"
              required
              :disabled="isLoading"
            />
          </div>
          
          <button 
            type="submit"
            class="primary-button"
            :disabled="isLoading || !email"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In With Email</span>
          </button>
        </form>

        <p class="magic-code-text">
          <img src="@/assets/sparkles-icon.svg" alt="✨" class="sparkles-icon" />
          We'll email you a magic code for a password-free sign in. 
          Or you can <a href="#" @click.prevent="showManualSignIn">sign in manually instead</a>.
        </p>

        <div v-if="error" class="error-message" role="alert">
          {{ error }}
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>
        New to Slack Genius? 
        <router-link to="/signup">Create an account</router-link>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';


const router = useRouter();
const store = useStore();
const auth0 = inject('auth0');
const isLoading = ref(false);
const error = ref('');
const email = ref('');

onMounted(async () => {
  try {
    // Only show loading if we're checking auth
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
      isLoading.value = true;
      
      try {
        // Try to get a new token silently
        const token = await auth0.getTokenSilently({
          detailedResponse: true,
          timeoutInSeconds: 60,
          cacheMode: 'on'
        });

        // Initialize auth state with token
        await store.dispatch('auth/initializeAuth', { 
          auth0, 
          token: token.access_token,
          expiresIn: token.expires_in 
        });
        
        // Get the default workspace and redirect
        const workspace = store.getters['auth/defaultWorkspace'];
        if (workspace?._id) {
          router.replace(`/workspaces/${workspace._id}`);
          return;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }
  } catch (err) {
    console.error('Auth check error:', err);
    error.value = 'Failed to check authentication status.';
  } finally {
    isLoading.value = false;
  }
});

const signInWithEmail = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    await auth0.loginWithRedirect();
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'Failed to send magic code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const signInWithGoogle = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    await auth0.loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2'
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    error.value = 'Failed to sign in with Google. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const showManualSignIn = () => {
  // Implement manual sign in logic
};
</script>

<style scoped>
.login-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 3rem 0 1rem;
  text-align: center;
}

.logo {
  height: 2.5rem;
  width: auto;
}

.main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 1rem;
}

.container {
  width: 100%;
  max-width: var(--container-width);
  text-align: center;
}

.subtitle {
  color: var(--slack-subtle);
  margin-bottom: 2rem;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.social-button {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--slack-border);
  border-radius: 4px;
  background: white;
  font-weight: 500;
  color: var(--slack-text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.1s ease-in-out;
}

.social-button:hover {
  border-color: var(--slack-text);
}

.social-button:active {
  background: #f8f8f8;
}

.social-button img {
  width: 1.25rem;
  height: 1.25rem;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 1.5rem);
  height: 1px;
  background-color: var(--slack-border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 0.5rem;
  color: var(--slack-subtle);
  font-size: 0.875rem;
}

.email-form {
  margin-bottom: 1rem;
}

.input-group {
  margin-bottom: 1rem;
}

.primary-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--slack-purple);
  color: white;
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.1s ease-in-out;
}

.primary-button:not(:disabled):hover {
  background: var(--slack-purple-hover);
}

.primary-button:disabled {
  background: var(--slack-border);
}

.magic-code-text {
  font-size: 0.875rem;
  color: var(--slack-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.sparkles-icon {
  width: 1rem;
  height: 1rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(224, 30, 90, 0.1);
  border-radius: 4px;
  color: var(--slack-error);
  font-size: 0.875rem;
}

.footer {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--slack-subtle);
}

@media (max-height: 800px) {
  .header {
    padding: 2rem 0 1rem;
  }

  .logo {
    height: 2rem;
  }

  h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 1.5rem 0 0.75rem;
  }

  h1 {
    font-size: 2rem;
  }

  .container {
    padding: 0;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--slack-subtle);
}
</style> 