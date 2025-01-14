import { api } from '@/services/api';

const state = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  nextCursor: null,
  hasMoreMessages: true,
  participantTyping: {},
}

const getters = {
  getConversations: (state) => state.conversations,
  getCurrentConversation: (state) => state.currentConversation,
  getMessages: (state) => state.messages,
  getIsLoading: (state) => state.isLoading,
  getError: (state) => state.error,
  getHasMoreMessages: (state) => state.hasMoreMessages,
  getParticipantTyping: (state) => state.participantTyping,
}

const actions = {
  async fetchConversations({ commit }) {
    try {
      commit('setLoading', true)
      const response = await api.get('/conversations')
      commit('setConversations', response.data)
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },

  async fetchConversation({ commit }, conversationId) {
    try {
      commit('setLoading', true)
      const response = await api.get(`/conversations/${conversationId}`)
      commit('setCurrentConversation', response.data)
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },

  async fetchMessages({ commit, state }, { conversationId, cursor = null }) {
    try {
      commit('setLoading', true)
      const response = await api.get(`/conversations/${conversationId}/messages`, {
        params: { cursor },
      })
      const { messages, nextCursor, hasMore } = response.data
      
      if (cursor) {
        commit('appendMessages', messages)
      } else {
        commit('setMessages', messages)
      }
      
      commit('setNextCursor', nextCursor)
      commit('setHasMoreMessages', hasMore)
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },

  async sendMessage({ commit }, { message, token }) {
    try {
      const response = await api.post(`/conversations/${message.conversationId}/messages`, message);
      commit('addMessage', response.data);
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async createConversation({ commit }, { participants, message }) {
    try {
      const response = await api.post('/conversations', {
        participants,
        message,
      })
      commit('addConversation', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.message)
      throw error
    }
  },

  // WebSocket event handlers
  handleNewMessage({ commit }, message) {
    commit('addMessage', message)
  },

  handleTypingStatus({ commit }, { conversationId, userId, isTyping }) {
    commit('setParticipantTyping', { conversationId, userId, isTyping })
  },

  async fetchConversationMessages({ commit }, { conversationId, token }) {
    try {
      commit('setLoading', true);
      const response = await api.get(`/conversations/${conversationId}/messages`);
      commit('setMessages', response.data.messages);
      commit('setNextCursor', response.data.nextCursor);
    } catch (error) {
      commit('setError', error.message);
    } finally {
      commit('setLoading', false);
    }
  },

  async setCurrentConversation({ commit, state }, { conversationId }) {
    const conversation = state.conversations.find(c => c._id === conversationId);
    if (conversation) {
      commit('setCurrentConversation', conversation);
    }
  },

  async updateMessage({ commit }, { messageId, content, conversationId, token }) {
    try {
      const response = await api.put(`/conversations/${conversationId}/messages/${messageId}`, {
        content
      });
      commit('updateMessage', response.data);
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async addReaction({ commit }, { messageId, reaction, conversationId, token }) {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, {
        emoji: reaction
      });
      commit('addReaction', { messageId, reaction: response.data });
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async removeReaction({ commit }, { messageId, reactionId, conversationId, token }) {
    try {
      await api.delete(`/conversations/${conversationId}/messages/${messageId}/reactions/${reactionId}`);
      commit('removeReaction', { messageId, reactionId });
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  }
}

const mutations = {
  setConversations(state, conversations) {
    state.conversations = conversations;
  },

  setCurrentConversation(state, conversation) {
    state.currentConversation = conversation;
  },

  setMessages(state, messages) {
    state.messages = messages;
  },

  appendMessages(state, messages) {
    state.messages = [...messages, ...state.messages];
  },

  addMessage(state, message) {
    state.messages.push(message);
    // Update last message in conversations list
    const conversationIndex = state.conversations.findIndex(
      conv => conv._id === message.conversationId
    );
    if (conversationIndex !== -1) {
      state.conversations[conversationIndex].lastMessage = message;
    }
  },

  updateMessage(state, updatedMessage) {
    const index = state.messages.findIndex(msg => msg._id === updatedMessage._id);
    if (index !== -1) {
      state.messages.splice(index, 1, updatedMessage);
    }
  },

  addReaction(state, { messageId, reaction }) {
    const message = state.messages.find(msg => msg._id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = [];
      }
      message.reactions.push(reaction);
    }
  },

  removeReaction(state, { messageId, reactionId }) {
    const message = state.messages.find(msg => msg._id === messageId);
    if (message && message.reactions) {
      const index = message.reactions.findIndex(r => r._id === reactionId);
      if (index !== -1) {
        message.reactions.splice(index, 1);
      }
    }
  },

  addConversation(state, conversation) {
    state.conversations.unshift(conversation)
  },

  setLoading(state, isLoading) {
    state.isLoading = isLoading;
  },

  setError(state, error) {
    state.error = error;
  },

  setNextCursor(state, cursor) {
    state.nextCursor = cursor;
  },

  setHasMoreMessages(state, hasMore) {
    state.hasMoreMessages = hasMore;
  },

  setParticipantTyping(state, { conversationId, userId, isTyping }) {
    state.participantTyping = {
      ...state.participantTyping,
      [conversationId]: {
        ...(state.participantTyping[conversationId] || {}),
        [userId]: isTyping,
      },
    };
  },

  clearError(state) {
    state.error = null
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
} 