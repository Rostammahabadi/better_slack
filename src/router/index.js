import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue')
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('../views/CallbackView.vue')
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('../views/JoinView.vue')
    },
    {
      path: '/invites/:token',
      name: 'invite',
      component: () => import('../views/InviteView.vue')
    },
    {
      path: '/workspaces/:workspaceId',
      name: 'workspace',
      component: () => import('../views/WorkspaceView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workspaces/:workspaceId/channels/:channelId',
      name: 'channel',
      component: () => import('../views/WorkspaceView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workspaces/:workspaceId/conversations/bot',
      name: 'bot-conversation',
      component: () => import('../views/WorkspaceView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workspaces/:workspaceId/conversations/:conversationId',
      name: 'conversation',
      component: () => import('../views/WorkspaceView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Add a flag to track auth initialization
let authInitialized = false;

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Wait for auth to initialize on first navigation
  if (!authInitialized && to.matched.some(record => record.meta.requiresAuth)) {
    try {
      // Wait a bit for auth initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      authInitialized = true;
    } catch (error) {
      console.error('Auth initialization error:', error);
      next('/login');
      return;
    }
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.getters['auth/isAuthenticated']) {
      next('/login');
      return;
    }
  }
  next();
});

export default router
