import './assets/main.css'

import { createApp } from 'vue'
import { createAuth0Client } from '@auth0/auth0-spa-js';
import App from './App.vue'
import router from './router/index.js'
import store from './store'
import { useSocket } from './services/socketService';

const app = createApp(App)
const { connect } = useSocket(store);

const initAuth0 = async () => {
  const auth0 = await createAuth0Client({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: 'openid profile email offline_access'
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
    useRefreshTokensFallback: true
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
    
    if (isAuthenticated || storedToken) {
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
        
        connect(token.access_token);
        
        // Mount the app
        app.mount('#app');
      } catch (error) {
        console.error('Token refresh error:', error);
        // Only redirect to login if we can't refresh the token
        if (!storedToken) {
          window.location.pathname = '/login';
        } else {
          // If we have a stored token, try to use it
          await store.dispatch('auth/initializeAuth', { 
            auth0, 
            token: storedToken 
          });
          app.mount('#app');
        }
      }
    } else {
      // If not authenticated and not on login/callback, redirect to login
      window.location.pathname = '/login';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // On error, check if we have a stored token before redirecting
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      await store.dispatch('auth/initializeAuth', { 
        auth0, 
        token: storedToken 
      });
      app.mount('#app');
    } else {
      window.location.pathname = '/login';
    }
  }
};

// Initialize auth
initAuth0().catch(e => {
  console.error('Failed to initialize auth:', e);
  // Check stored token before redirecting
  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    app.mount('#app');
  } else {
    window.location.pathname = '/login';
  }
});
