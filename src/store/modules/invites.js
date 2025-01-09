const state = {
  invites: [],
  sentInvites: JSON.parse(localStorage.getItem('sent_invites') || '[]'),
  loading: false,
  error: null
};

const mutations = {
  SET_INVITES(state, invites) {
    state.invites = invites;
  },
  SET_SENT_INVITES(state, invites) {
    state.sentInvites = [...state.sentInvites, ...invites];
    // Persist to localStorage
    localStorage.setItem('sent_invites', JSON.stringify(state.sentInvites));
  },
  CLEAR_SENT_INVITES(state) {
    state.sentInvites = [];
    localStorage.removeItem('sent_invites');
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  CLEAR_ERROR(state) {
    state.error = null;
  }
};

const actions = {
  async fetchInvites({ commit }, { workspaceId, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspaceId}/invites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }

      const invites = await response.json();
      commit('SET_INVITES', invites);
      return invites;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async sendInvites({ commit }, { emails, token }) {
    commit('SET_LOADING', true);
    commit('CLEAR_ERROR');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emails)
      });

      if (!response.ok) {
        throw new Error('Failed to send invites');
      }

      const result = await response.json();
      // Add timestamp to each invite for potential future use
      const invitesWithTimestamp = result.map(invite => ({
        ...invite,
        createdAt: new Date().toISOString()
      }));
      commit('SET_SENT_INVITES', invitesWithTimestamp);
      return result;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Clear sent invites (useful for logout)
  clearSentInvites({ commit }) {
    commit('CLEAR_SENT_INVITES');
  }
};

const getters = {
  invites: state => state.invites,
  sentInvites: state => state.sentInvites,
  loading: state => state.loading,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
