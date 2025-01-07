<template>
  <div class="signup-container">
    <header class="header">
      <img src="@/assets/slack-logo.svg" alt="Slack" class="logo" />
    </header>
    
    <main class="main">
      <div class="container">
        <h1>First, enter your email</h1>
        <p class="subtitle">We suggest using the email address you use at work.</p>
        
        <form @submit.prevent="continueWithEmail" class="email-form">
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
            <span v-if="isLoading">Creating account...</span>
            <span v-else>Continue</span>
          </button>
        </form>

        <div class="divider">
          <span>OR</span>
        </div>

        <div class="auth-buttons">
          <button 
            class="social-button google-button"
            @click="signUpWithGoogle"
            :disabled="isLoading"
          >
            <img src="@/assets/google-icon.svg" alt="Google" />
            <span>Continue With Google</span>
          </button>
          
          <button class="social-button apple-button">
            <img src="@/assets/apple-icon.svg" alt="Apple" />
            <span>Continue With Apple</span>
          </button>
        </div>

        <div v-if="error" class="error-message" role="alert">
          {{ error }}
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>
        Already using Slack?
        <router-link to="/login">Sign in to an existing workspace</router-link>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const isLoading = ref(false);
const error = ref('');
const email = ref('');

const continueWithEmail = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    // Implement signup logic here
    await this.$auth0.loginWithRedirect({
      screen_hint: 'signup',
      appState: { 
        targetUrl: window.location.pathname,
        email: email.value
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    error.value = 'Failed to continue with signup. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const signUpWithGoogle = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    await loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        screen_hint: 'signup'
      }
    });
  } catch (err) {
    console.error('Google signup error:', err);
    error.value = 'Failed to continue with Google. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.signup-container {
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

.email-form {
  margin-bottom: 1.5rem;
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

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
</style> 