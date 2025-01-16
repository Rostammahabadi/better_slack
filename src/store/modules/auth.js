const state = {
  user: JSON.parse(localStorage.getItem('auth_user')),
  token: null,
  tokenExpiry: localStorage.getItem('token_expiry'),
  loading: false,
  error: null,
  defaultWorkspace: JSON.parse(localStorage.getItem('default_workspace')),
  status: 'active',
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
  SET_STATUS(state, status) {
    state.status = status;
    localStorage.setItem('user_status', status);
  },
  SET_TOKEN(state, { token, expiresIn }) {
    state.token = token;
    if (token) {
      state.token = token;
      // Set token expiry if provided
      if (expiresIn) {
        const expiry = Date.now() + (expiresIn * 1000);
        state.tokenExpiry = expiry;
        localStorage.setItem('token_expiry', expiry.toString());
      }
    } else {
      state.token = null;
      state.tokenExpiry = null;
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
    state.tokenExpiry = null;
    state.error = null;
    state.defaultWorkspace = null;
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('default_workspace');
  }
};

const actions = {
  async initializeAuth({ commit, dispatch }, { auth0, token, expiresIn }) {
    try {
      await commit('SET_LOADING', true);
      
      if (token) {
        await commit('SET_TOKEN', { token, expiresIn });
        
        // Try to use stored user data first
        const storedUser = JSON.parse(localStorage.getItem('auth_user'));
        const storedWorkspace = JSON.parse(localStorage.getItem('default_workspace'));
        
        if (storedUser && storedWorkspace) {
          await commit('SET_USER', storedUser);
          await commit('SET_DEFAULT_WORKSPACE', storedWorkspace);
          await commit('workspaces/SET_CURRENT_WORKSPACE', storedWorkspace, { root: true });
          return;
        }
        
        // If no stored data or token changed, fetch fresh user data
        const userData = await dispatch('fetchUser', token);
        if (userData) {
          const workspaces = userData.workspace;
          if (workspaces && workspaces.length > 0) {
            await commit('SET_DEFAULT_WORKSPACE', workspaces[0]);
            await commit('workspaces/SET_CURRENT_WORKSPACE', workspaces[0], { root: true });
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateStatus({ commit, state }, status) {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
  
      commit('SET_STATUS', status);
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  },

  async refreshToken({ commit, state }, auth0) {
    try {
      const token = await auth0.getTokenSilently({
        detailedResponse: true,
        timeoutInSeconds: 60,
        cacheMode: 'on'
      });
      
      await commit('SET_TOKEN', { 
        token: token.access_token, 
        expiresIn: token.expires_in 
      });
      
      return token.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
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

  async logout({ commit, dispatch }) {
    commit('CLEAR_AUTH');
  }
};

const getters = {
  isAuthenticated: state => {
    if (!state.token || !state.user) return false;
    if (state.tokenExpiry) {
      // Check if token is expired
      return Date.now() < parseInt(state.tokenExpiry);
    }
    return true;
  },
  currentUser: state => state.user?.user,
  token: state => state.token,
  isLoading: state => state.loading,
  error: state => state.error,
  defaultWorkspace: state => state.defaultWorkspace,
  tokenExpiry: state => state.tokenExpiry,
  userStatus: state => state.status
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 