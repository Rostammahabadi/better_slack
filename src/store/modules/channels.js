const state = {
  channels: [],
  currentChannel: null,
  loading: false,
  error: null
};

// Helper function to sort channels alphabetically
const sortChannels = (channels) => {
  return [...channels].sort((a, b) => a.name.localeCompare(b.name));
};

const mutations = {
  SET_CHANNELS(state, channels) {
    state.channels = sortChannels(channels);
  },
  SET_CURRENT_CHANNEL(state, channel) {
    state.currentChannel = channel;
  },
  ADD_CHANNEL(state, channel) {
    state.channels.push(channel);
    state.channels = sortChannels(state.channels);
  },
  UPDATE_CHANNEL(state, updatedChannel) {
    const index = state.channels.findIndex(ch => ch._id === updatedChannel._id);
    if (index !== -1) {
      state.channels.splice(index, 1, updatedChannel);
      state.channels = sortChannels(state.channels);
    }
  },
  DELETE_CHANNEL(state, channelId) {
    state.channels = state.channels.filter(ch => ch._id !== channelId);
    // No need to sort after deletion
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchChannels({ commit }, { workspaceId, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspaceId}/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const channels = await response.json();
      commit('SET_CHANNELS', channels);
      return channels;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async createChannel({ commit, dispatch, rootState }, { workspaceId, channelData, token }) {
    commit('SET_LOADING', true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(channelData)
      });

      if (!response.ok) {
        throw new Error('Failed to create channel');
      }

      const channel = await response.json();

      // Set as current channel
      commit('SET_CURRENT_CHANNEL', channel);

      return channel;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setCurrentChannel({ commit }, { channel, token }) {
    commit('SET_CURRENT_CHANNEL', channel);
  }
};

const getters = {
  // Return channels in alphabetical order
  channels: state => state.channels,
  currentChannel: state => state.currentChannel,
  isLoading: state => state.loading,
  error: state => state.error,
  getChannelById: state => id => state.channels.find(channel => channel.id === id)
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 