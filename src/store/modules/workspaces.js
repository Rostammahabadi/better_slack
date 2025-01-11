const state = {
  currentWorkspace: null,
  workspaces: [],
  loading: false,
  error: null
};

const mutations = {
  SET_CURRENT_WORKSPACE(state, workspace) {
    state.currentWorkspace = workspace;
  },
  SET_WORKSPACES(state, workspaces) {
    state.workspaces = workspaces;
  },
  ADD_WORKSPACE(state, workspace) {
    state.workspaces.push(workspace);
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchWorkspace({ commit }, { workspaceId, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspace');
      }

      const workspace = await response.json();
      commit('SET_CURRENT_WORKSPACE', workspace);
      return workspace;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchWorkspaces({ commit }, token) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const workspaces = await response.json();
      commit('SET_WORKSPACES', workspaces);
      return workspaces;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async inviteUsers({ commit }, { workspaceId, emails, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invites');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createWorkspace({ commit }, { name, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
      }

      const workspace = await response.json();
      commit('ADD_WORKSPACE', workspace);
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  currentWorkspace: state => state.currentWorkspace,
  workspaces: state => state.workspaces,
  isLoading: state => state.loading,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 