const state = {
  sentInvites: [],
  error: null,
  isLoading: false
};

const mutations = {
  SET_SENT_INVITES(state, invites) {
    state.sentInvites = invites;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  }
};

const actions = {
  async sendInvites({ commit }, { invites, token }) {
    try {
      commit('SET_LOADING', true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invites })
      });

      if (!response.ok) {
        throw new Error('Failed to send invites');
      }

      const data = await response.json();
      commit('SET_SENT_INVITES', [...state.sentInvites, ...data.invites]);
      return data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async verifyInvite({ commit }, { token }) {
    try {
      commit('SET_LOADING', true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invites/verify/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid or expired invite');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async acceptInvite({ commit }, { token, userId }) {
    try {
      commit('SET_LOADING', true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inviteToken: token,
          userId 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept invite');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  sentInvites: state => state.sentInvites,
  error: state => state.error,
  isLoading: state => state.isLoading
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
