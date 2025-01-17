const state = {
  user: JSON.parse(localStorage.getItem('auth_user')),
  token: null,
  tokenExpiry: localStorage.getItem('token_expiry'),
  loading: false,
  error: null,
  defaultWorkspace: JSON.parse(localStorage.getItem('default_workspace')),
  status: 'active',
  botMode: {
    isEnabled: false,
    autoReply: "I'm currently away but my AI assistant will help you.",
    allowedChannels: [],
    allowedConversations: [],
    responseDelay: 1000
  }
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
  SET_BOT_MODE(state, botMode) {
    state.botMode = botMode;
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
  },
  SET_AWAY_STATUS(state, { isAway, botConfig }) {
    state.status = isAway ? 'away' : 'active';
    if (botConfig) {
      state.botMode = {
        ...state.botMode,
        ...botConfig
      };
    }
    if (state.user) {
      state.user.userPersonality = {
        ...state.user.userPersonality,
        botMode: state.botMode
      };
      localStorage.setItem('auth_user', JSON.stringify(state.user));
    }
  },
  UPDATE_BOT_CONFIG(state, config) {
    state.botMode = {
      ...state.botMode,
      ...config
    };
    if (state.user) {
      state.user.userPersonality = {
        ...state.user.userPersonality,
        botMode: state.botMode
      };
      localStorage.setItem('auth_user', JSON.stringify(state.user));
    }
  }
};

const actions = {
  async initializeAuth({ commit, dispatch }, { token, expiresIn }) {
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
          await dispatch('workspaces/fetchWorkspaces', { token });
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
    const { text, emoji } = status;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, emoji })
      });

      if (!response.ok) {
        dispatch('showToastError', 'Failed to update status', { root: true });
        throw new Error('Failed to update status');
      }
      const user = await response.json();
      commit('SET_USER', user);
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
      debugger
      await store.dispatch('auth/setToken', { token, expiresIn: 3600 });
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

  async setToken({ commit }, { token, expiresIn }) {
    await commit('SET_TOKEN', { token, expiresIn });
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
      commit('SET_BOT_MODE', user.user.userPersonality.botMode);
      commit('SET_USER', user.user);
      return user;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async logout({ commit, dispatch }) {
    commit('CLEAR_AUTH');
  },

  async setAwayStatus({ commit, state }, { isAway, botConfig }) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/away`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAway, botConfig })
      });

      if (!response.ok) {
        throw new Error('Failed to update away status');
      }

      const data = await response.json();
      commit('SET_AWAY_STATUS', { isAway, botConfig });
      return data;
    } catch (error) {
      console.error('Failed to set away status:', error);
      throw error;
    }
  },

  async updateBotConfig({ commit, state }, config) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/away`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isAway: state.status === 'away',
          botConfig: config
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update bot configuration');
      }

      const data = await response.json();
      commit('UPDATE_BOT_CONFIG', config);
      return data;
    } catch (error) {
      console.error('Failed to update bot config:', error);
      throw error;
    }
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
  currentUser: state => state.user,
  token: state => state.token,
  isLoading: state => state.loading,
  error: state => state.error,
  userAvatar: state => state.user?.picture || state.user?.avatarUrl,
  defaultWorkspace: state => state.defaultWorkspace,
  tokenExpiry: state => state.tokenExpiry,
  userStatus: state => state.status,
  userPersonality: state => state.user?.user?.userPersonality,
  isAway: state => state.user.isAway,
  botMode: state => state.botMode,
  isBotEnabled: state => state.botMode.isEnabled,
  isChannelBotEnabled: state => channelId => 
    state.botMode.isEnabled && 
    state.botMode.allowedChannels.includes(channelId),
  isConversationBotEnabled: state => conversationId => 
    state.botMode.isEnabled && 
    state.botMode.allowedConversations.includes(conversationId)
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 