import { api } from '@/services/api';

const state = {
  channels: [],
  currentChannel: null,
  loading: false,
  error: null,
};

function sortedChannels(channels) {
  return channels.sort((a, b) => a.name.localeCompare(b.name));
}
const mutations = {
  SET_CHANNELS(state, channels) {
    state.channels = sortedChannels(channels);
  },
  SET_CURRENT_CHANNEL(state, channel) {
    state.currentChannel = channel;
  },
  ADD_CHANNEL(state, channel) {
    state.channels.push(channel);
    state.channels = sortedChannels(state.channels);
  },
  UPDATE_CHANNEL(state, updatedChannel) {
    const index = state.channels.findIndex(ch => ch._id === updatedChannel._id);
    if (index !== -1) {
      state.channels.splice(index, 1, updatedChannel);
      state.channels = sortedChannels(state.channels);
    }
  },
  DELETE_CHANNEL(state, channelId) {
    state.channels = state.channels.filter(ch => ch._id !== channelId);
    state.channels = sortedChannels(state.channels);
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchChannels({ commit, dispatch }, { workspaceId, token }) {
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
      dispatch('showToastError', error.message, { root: true });
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
      commit('SET_CURRENT_CHANNEL', channel);
      dispatch('showToastSuccess', 'Channel created successfully', { root: true });
      return channel;
    } catch (error) {
      dispatch('showToastError', error.message, { root: true });
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async addUsersToChannel({ commit, dispatch, rootState }, { channelId, userIds }) {
    commit('SET_LOADING', true);
    try {
      const response = await api.put(`/channels/${channelId}/users`, { userIds });
      if (!response.status === 200) {
        throw new Error('Failed to add users to channel');
      }
      const updatedChannel = response.data;
      commit('UPDATE_CHANNEL', updatedChannel);
      dispatch('showToastSuccess', 'Users added to channel successfully', { root: true });
      return updatedChannel;
    } catch (error) {
      dispatch('showToastError', error.message, { root: true });
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setCurrentChannel({ commit }, { channel }) {
    commit('SET_CURRENT_CHANNEL', channel);
  },
  clearCurrentChannel({ commit }) {
    commit('SET_CURRENT_CHANNEL', null);
  }
};

const getters = {
  // Return channels in alphabetical order
  channels: state => state.channels,
  currentChannel: state => state.currentChannel,
  getChannelById: state => id => state.channels.find(channel => channel._id === id),
  sortedChannels: state => [...state.channels].sort((a, b) => a.name.localeCompare(b.name)),
  getIsLoading: state => state.loading,
  currentChannelUsers: (state, getters, rootState) => {
    if (!state.currentChannel) return [];
    
    // Get all members from the current channel
    const channelMembers = state.currentChannel.members || [];
    
    // Map member IDs to full user objects from the users module
    return channelMembers.map(member => member.userId);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 