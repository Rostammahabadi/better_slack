const state = {
  messagesByChannel: {},
  isLoading: false,
  error: null
};

const mutations = {
  SET_MESSAGES(state, { channelId, messages }) {
    state.messagesByChannel = {
      ...state.messagesByChannel,
      [channelId]: messages
    };
  },
  ADD_MESSAGE(state, { channelId, message }) {
    if (!state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = [];
    }
    state.messagesByChannel[channelId].push(message);
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  ADD_REACTION(state, { messageId, reaction, currentChannel }) {
    const message = state.messagesByChannel[currentChannel].find(msg => msg._id === messageId);
    if (message) {
      message.reactions.push(reaction);
    }
  },
  REMOVE_REACTION(state, { messageId, reaction, currentChannel }) {
    const message = state.messagesByChannel[currentChannel].find(msg => msg._id === messageId);
    if (message) {
      message.reactions = message.reactions.filter(r => r.emoji !== reaction);
    }
  },
  RECEIVE_MESSAGE(state, { channelId, message }) {
    if (!state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = [];
    }
    state.messagesByChannel[channelId].push(message);
  },
  UPDATE_MESSAGE(state, { channelId, message }) {
    if (state.messagesByChannel[channelId]) {
      const index = state.messagesByChannel[channelId].findIndex(msg => msg._id === message._id);
      if (index !== -1) {
        state.messagesByChannel[channelId].splice(index, 1, message);
      }
    }
  },
  DELETE_MESSAGE(state, { channelId, messageId }) {
    if (state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = state.messagesByChannel[channelId].filter(msg => msg._id !== messageId);
    }
  }
};

const actions = {
  async fetchMessages({ commit }, { channelId, token }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/channels/${channelId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages = await response.json();
      commit('SET_MESSAGES', { channelId, messages });
      return messages;
    } catch (error) {
      commit('SET_ERROR', error.message);
      console.error('Error fetching messages:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async sendMessage({ commit }, { message, token }) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/channels/${message.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();
      commit('ADD_MESSAGE', { 
        channelId: message.channelId, 
        message: sentMessage 
      });
      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async addReaction({ commit }, { messageId, reaction, token, currentChannel }) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/${messageId}/reactions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({emoji: reaction})
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add reaction');
    }

    const addedReaction = await response.json();
    commit('ADD_REACTION', { messageId, reaction: addedReaction, currentChannel });
  },

  async removeReaction({ commit }, { messageId, reactionId, token, currentChannel }) {
    commit('REMOVE_REACTION', { messageId, reactionId, currentChannel });
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/${messageId}/reactions/${reactionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to remove reaction');
    }
  },

  receiveMessage({ commit, rootState }, message) {
    const channelId = message.channelId;
    if (channelId === rootState.channels.currentChannel?._id) {
      commit('RECEIVE_MESSAGE', { channelId, message });
    }
  },

  async updateMessage({ commit, rootState }, message) {
    const messageId = message.messageId;
    const channelId = message.currentChannel;
    const token = message.token;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/${messageId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ _id: messageId, content: message.content })
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update message');
    }
    if (channelId === rootState.channels.currentChannel?._id) {
      commit('UPDATE_MESSAGE', { channelId, message });
    }
  },

  deleteMessage({ commit, rootState }, messageId) {
    const channelId = rootState.channels.currentChannel?._id;
    if (channelId) {
      commit('DELETE_MESSAGE', { channelId, messageId });
    }
  }
};

const getters = {
  getMessagesByChannel: (state) => (channelId) => {
    return state.messagesByChannel[channelId] || [];
  },
  isLoading: (state) => state.isLoading,
  error: (state) => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 