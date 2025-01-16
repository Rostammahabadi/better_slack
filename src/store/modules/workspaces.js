import { api } from '@/services/api';

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
  async fetchWorkspace({ commit }, { workspaceId }) {
    commit('SET_LOADING', true);
    try {
      const workspace = await api.get(`/workspaces/${workspaceId}`);
      commit('SET_CURRENT_WORKSPACE', workspace.data);
      return workspace.data;
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
      const response = await api.get(`/workspaces`);
      
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
      const response = await api.post(`/workspaces/${workspaceId}/invites`, {
        emails
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
      const response = await api.post(`/workspaces`, {
        name
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
      }

      const workspace = await response.json();
      commit('ADD_WORKSPACE', workspace);
      return workspace;
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