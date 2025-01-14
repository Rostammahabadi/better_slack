import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CallbackView from '../views/CallbackView.vue'
import WorkspaceView from '../views/WorkspaceView.vue'
import SignupView from '../views/SignupView.vue'
import JoinView from '../views/JoinView.vue'
import store from '../store'
import InviteView from '../views/InviteView.vue'

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
      component: LoginView
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView
    },
    {
      path: '/join',
      name: 'join',
      component: JoinView
    },
    {
      path: '/invites/:token',
      name: 'invite',
      component: InviteView
    },
    {
      path: '/workspaces/:workspaceId',
      name: 'workspace',
      component: WorkspaceView,
      meta: { requiresAuth: true }
    },
    {
      path: '/workspaces/:workspaceId/channels/:channelId',
      name: 'channel',
      component: WorkspaceView,
      meta: { requiresAuth: true }
    },
    {
      path: '/workspaces/:workspaceId/conversations/:conversationId',
      name: 'conversation',
      component: WorkspaceView,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.getters['auth/isAuthenticated']) {
      next('/login');
      return;
    }
  }
  next();
});

export default router
