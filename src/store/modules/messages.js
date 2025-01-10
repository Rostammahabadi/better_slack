const state = {
  messagesByChannel: {},
  isLoading: false,
  error: null,
  messages: [],
  currentDirectMessage: null,
  error: null,
  activeThread: null
};

const mutations = {
  SET_MESSAGES(state, { channelId, messages }) {
    state.messagesByChannel = {
      ...state.messagesByChannel,
      [channelId]: messages
    };
  },
  ADD_MESSAGE(state, message) {
    state.messages.push(message);
  },
  UPDATE_MESSAGE(state, updatedMessage) {
    const index = state.messages.findIndex(m => m._id === updatedMessage._id);
    if (index !== -1) {
      state.messages.splice(index, 1, updatedMessage);
    }
  },
  SET_CURRENT_DIRECT_MESSAGE(state, dm) {
    state.currentDirectMessage = dm;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_ACTIVE_THREAD(state, message) {
    state.activeThread = message;
  },
  ADD_REACTION(state, { messageId, reaction }) {
    const message = state.messages.find(m => m._id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = [];
      }
      message.reactions.push(reaction);
    }
  },
  REMOVE_REACTION(state, { messageId, reaction, channelId }) {
    state.messagesByChannel[channelId] = state.messagesByChannel[channelId].map(msg => {
      if (msg._id === messageId) {
        return {
          ...msg,
          reactions: msg.reactions.filter(r => r._id !== reaction._id)
        };
      }
      return msg;
    });
  },
  RECEIVE_MESSAGE(state, { channelId, message }) {
    if (!state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = [];
    }
    state.messagesByChannel[channelId].push(message);
  },
  UPDATE_MESSAGE(state, { channelId, messageId, message }) {
    if (state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = state.messagesByChannel[channelId].map(msg => {
        if (msg._id === messageId) {
          return { ...msg, content: message };
        }
        return msg;
      });
    }
  },
  DELETE_MESSAGE(state, { channelId, messageId }) {
    if (state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = state.messagesByChannel[channelId].filter(msg => msg._id !== messageId);
    }
  },
  ADD_MESSAGE(state, message) {
    if (!state.messagesByChannel[message.channelId]) {
      state.messagesByChannel[message.channelId] = [];
    }
    state.messagesByChannel[message.channelId].push(message);
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  ADD_THREAD_REPLY(state, { channelId, message }) {
    if (!state.messagesByChannel[channelId]) {
      state.messagesByChannel[channelId] = [];
    }
    state.messagesByChannel[channelId].push(message);
  }
};

const actions = {
  addMessage({ commit }, message) {
    commit('ADD_MESSAGE', message);
  },
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
      return response.json();
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
    return addedReaction;
  },

  async removeReaction({ commit }, { messageId, reactionId, token, channelId }) { 
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

  async updateMessage({ commit }, message) {
    const messageId = message._id;
    const token = message.token;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/messages/${messageId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );
    if (!response.ok) {
      throw new Error('Failed to update message');
    }
    return response.json();
  },

  deleteMessage({ commit, rootState }, messageId) {
    const channelId = rootState.channels.currentChannel?._id;
    if (channelId) {
      commit('DELETE_MESSAGE', { channelId, messageId });
    }
  },

  setActiveThread({ commit }, message) {
    commit('SET_ACTIVE_THREAD', message);
  },

  async sendThreadReply({ commit }, { message, token }) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/channels/${message.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...message,
            threadId: message.threadId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send thread reply');
      }

      const newMessage = await response.json();
      commit('ADD_THREAD_REPLY', { 
        channelId: message.channelId, 
        message: newMessage 
      });
      return newMessage;
    } catch (error) {
      console.error('Error sending thread reply:', error);
      throw error;
    }
  }
};

const getters = {
  getMessagesByChannel: (state) => (channelId) => {
    return state.messagesByChannel[channelId] || [];
  },
  getThreadReplies: (state) => (threadId) => {
    const allChannelMessages = Object.values(state.messagesByChannel)
      .flat()
      .filter(message => message.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return allChannelMessages;
  },
  isLoading: (state) => state.isLoading,
  error: (state) => state.error,
  activeThread: (state) => state.activeThread
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 