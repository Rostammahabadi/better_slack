const state = {
  user: JSON.parse(localStorage.getItem('auth_user')),
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: null,
  defaultWorkspace: JSON.parse(localStorage.getItem('default_workspace'))
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  },
  SET_TOKEN(state, token) {
    state.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_DEFAULT_WORKSPACE(state, workspace) {
    state.defaultWorkspace = workspace;
    if (workspace) {
      localStorage.setItem('default_workspace', JSON.stringify(workspace));
    } else {
      localStorage.removeItem('default_workspace');
    }
  },
  CLEAR_AUTH(state) {
    state.user = null;
    state.token = null;
    state.error = null;
    state.defaultWorkspace = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('default_workspace');
  }
};

const actions = {
  async initializeAuth({ commit, dispatch }, { auth0, token }) {
    try {
      await commit('SET_LOADING', true);
      
      if (token) {
        await commit('SET_TOKEN', token);
        
        // Try to use stored user data first
        const storedUser = JSON.parse(localStorage.getItem('auth_user'));
        if (storedUser) {
          await commit('SET_USER', storedUser);
        }
        
        // Then fetch fresh user data
        const userData = await dispatch('fetchUser', token);
        if (userData) {
          const workspaces = userData.workspace;
          if (workspaces && workspaces.length > 0) {
            // Set the first workspace as default
            await commit('SET_DEFAULT_WORKSPACE', workspaces[0]);
            // Also set it as current workspace in the workspaces module
            await commit('workspaces/SET_CURRENT_WORKSPACE', workspaces[0], { root: true });
          }
        }
      }
    } catch (error) {
      commit('SET_ERROR', error.message);
      await commit('CLEAR_AUTH');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchUser({ commit }, token) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      commit('SET_USER', user);
      return user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async createUser({ commit, dispatch }, { userData, token }) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const user = await response.json();
      commit('SET_USER', user);
      
      // If the user was created with a default workspace, set it
      if (user.workspace_id) {
        const workspace = {
          id: user.workspace_id,
          name: user.workspace_name,
          slug: user.workspace_slug,
          role: user.workspace_role
        };
        commit('SET_DEFAULT_WORKSPACE', workspace);
        commit('workspaces/SET_CURRENT_WORKSPACE', workspace, { root: true });
      }
      
      return user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async logout({ commit, dispatch }) {
    // Clear invites before clearing auth
    await dispatch('invites/clearSentInvites', null, { root: true });
    commit('CLEAR_AUTH');
  }
};

const getters = {
  isAuthenticated: state => !!state.token && !!state.user,
  currentUser: state => state.user.user,
  token: state => state.token,
  isLoading: state => state.loading,
  error: state => state.error,
  defaultWorkspace: state => state.defaultWorkspace
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 