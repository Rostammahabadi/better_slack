import './assets/main.css'

import { createApp } from 'vue'
import { createAuth0Client } from '@auth0/auth0-spa-js';
import App from './App.vue'
import router from './router/index.js'
import store from './store'

const app = createApp(App)

const initAuth0 = async () => {
  const auth0 = await createAuth0Client({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    },
    cacheLocation: 'localstorage'
  });

  app.provide('auth0', auth0);
  
  // First use store and router
  app.use(store)
  app.use(router)
  
  try {
    // Check if we're in the callback page
    if (window.location.pathname === '/callback') {
      // Let the callback page handle the authentication
      app.mount('#app');
      return;
    }

    // Check if we're in the login page
    if (window.location.pathname === '/login') {
      app.mount('#app');
      return;
    }

    // For all other routes, check authentication
    const isAuthenticated = await auth0.isAuthenticated();
    const storedToken = localStorage.getItem('auth_token');
    
    if (isAuthenticated && storedToken) {
      try {
        // Get a fresh token
        const token = await auth0.getTokenSilently({
          timeoutInSeconds: 60,
          cacheMode: 'on'
        });
        
        // Initialize auth state with token
        await store.dispatch('auth/initializeAuth', { auth0, token });
        
        // Mount the app
        app.mount('#app');
      } catch (error) {
        console.error('Token refresh error:', error);
        // Clear stored auth state
        store.dispatch('auth/logout');
        // If token refresh fails, redirect to login
        window.location.pathname = '/login';
      }
    } else {
      // If not authenticated or no stored token, redirect to login
      store.dispatch('auth/logout');
      window.location.pathname = '/login';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // Clear stored auth state
    store.dispatch('auth/logout');
    // On error, redirect to login
    window.location.pathname = '/login';
  }
};

// Check for authentication errors
const search = window.location.search;
if (search.includes("error=")) {
  // Only redirect on actual errors
  console.error('Auth0 error:', search);
  store.dispatch('auth/logout');
  window.location.pathname = '/login';
} else {
  // Initialize auth
  initAuth0().catch(e => {
    console.error('Failed to initialize auth:', e);
    store.dispatch('auth/logout');
    window.location.pathname = '/login';
  });
}
