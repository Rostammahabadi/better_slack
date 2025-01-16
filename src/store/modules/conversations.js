import { api } from '@/services/api';

const state = {
  conversations: [],
  activeUsers: {}, // { conversationId: Set<userId> }
  typingUsers: {}, // { conversationId: Set<userId> }
  currentConversation: null,
  isLoading: false,
  error: null
};

const getters = {
  getConversations: state => state.conversations,
  getCurrentConversation: state => state.currentConversation,
  getActiveUsers: state => conversationId => state.activeUsers[conversationId] || new Set(),
  getTypingUsers: state => conversationId => state.typingUsers[conversationId] || new Set(),
  getIsLoading: state => state.isLoading,
  getError: state => state.error
};

const actions = {
  async fetchConversations({ commit }) {
    try {
      commit('setLoading', true);
      const response = await api.get('/conversations');
      commit('setConversations', response.data);
    } catch (error) {
      dispatch('showToastError', error.message);
      commit('setError', error.response?.data?.message || 'Failed to fetch conversations');
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchConversation({ commit }, conversationId) {
    try {
      commit('setLoading', true);
      const response = await api.get(`/conversations/${conversationId}`);
      commit('setCurrentConversation', response.data);
      return response.data;
    } catch (error) {
      dispatch('showToastError', error.message);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  async createConversation({ commit }, { participants, message }) {
    try {
      commit('setLoading', true);
      const response = await api.post('/conversations', { participants, message });
      commit('addConversation', response.data);
      return response.data;
    } catch (error) {
      dispatch('showToastError', error.message);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  setCurrentConversation({ commit }, conversation) {
    commit('setCurrentConversation', conversation);
  }
};

const mutations = {
  setConversations(state, conversations) {
    state.conversations = conversations;
  },

  addConversation(state, conversation) {
    state.conversations = [...state.conversations, conversation];
  },

  setCurrentConversation(state, conversation) {
    state.currentConversation = conversation;
  },

  updateConversationUsers(state, { conversationId, users }) {
    state.activeUsers = {
      ...state.activeUsers,
      [conversationId]: new Set(users)
    };
  },

  removeUser(state, { conversationId, userId }) {
    const users = state.activeUsers[conversationId];
    if (users) {
      users.delete(userId);
    }
    const typingUsers = state.typingUsers[conversationId];
    if (typingUsers) {
      typingUsers.delete(userId);
    }
  },

  setUserTyping(state, { conversationId, userId, isTyping }) {
    if (!state.typingUsers[conversationId]) {
      state.typingUsers[conversationId] = new Set();
    }
    if (isTyping) {
      state.typingUsers[conversationId].add(userId);
    } else {
      state.typingUsers[conversationId].delete(userId);
    }
  },

  setLoading(state, isLoading) {
    state.isLoading = isLoading;
  },

  setError(state, error) {
    state.error = error;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}; 