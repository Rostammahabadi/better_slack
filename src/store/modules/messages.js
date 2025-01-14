import { api } from '@/services/api';

const state = {
  channelMessages: {}, // { channelId: { messages: [], nextCursor: null, hasMore: true } }
  conversationMessages: {}, // { conversationId: { messages: [], nextCursor: null, hasMore: true } }
  currentChannelId: null,
  currentConversationId: null,
  isLoading: false,
  error: null,
  activeThread: null
};

const getters = {
  getChannelMessages: (state) => (channelId) => {
    return state.channelMessages[channelId]?.messages || [];
  },
  getConversationMessages: (state) => (conversationId) => {
    return state.conversationMessages[conversationId]?.messages || [];
  },
  hasMoreChannelMessages: (state) => (channelId) => {
    return state.channelMessages[channelId]?.hasMore ?? false;
  },
  hasMoreConversationMessages: (state) => (conversationId) => {
    return state.conversationMessages[conversationId]?.hasMore ?? false;
  },
  getChannelNextCursor: (state) => (channelId) => {
    return state.channelMessages[channelId]?.nextCursor;
  },
  getConversationNextCursor: (state) => (conversationId) => {
    return state.conversationMessages[conversationId]?.nextCursor;
  },
  getActiveThread: (state) => state.activeThread,
  getIsLoading: (state) => state.isLoading,
  getError: (state) => state.error,
  getThreadReplies: (state) => (messageId) => {
    // Search for thread replies in both channel and conversation messages
    for (const channelData of Object.values(state.channelMessages)) {
      const message = channelData.messages?.find(m => m._id === messageId);
      if (message?.thread?.replies) {
        return message.thread.replies.length;
      }
    }
    for (const conversationData of Object.values(state.conversationMessages)) {
      const message = conversationData.messages?.find(m => m._id === messageId);
      if (message?.thread?.replies) {
        return message.thread.replies.length;
      }
    }
    return 0;
  }
};

const actions = {
  async fetchChannelMessages({ commit }, { channelId, cursor = null, limit = 30 }) {
    try {
      commit('setLoading', true);
      const response = await api.get(`/channels/${channelId}/messages`, {
        params: { limit, before: cursor }
      });
      
      const { messages, nextCursor, hasMore } = response.data;
      if (cursor) {
        commit('appendChannelMessages', { channelId, messages });
      } else {
        commit('setChannelMessages', { channelId, messages });
      }
      commit('setChannelPagination', { channelId, nextCursor, hasMore });
    } catch (error) {
      commit('setError', error.message);
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchConversationMessages({ commit }, { conversationId, cursor = null, limit = 30 }) {
    try {
      commit('setLoading', true);
      const response = await api.get(`/conversations/${conversationId}/messages`, {
        params: { limit, before: cursor }
      });
      
      const { messages, nextCursor, hasMore } = response.data;
      if (cursor) {
        commit('appendConversationMessages', { conversationId, messages });
      } else {
        commit('setConversationMessages', { conversationId, messages });
      }
      commit('setConversationPagination', { conversationId, nextCursor, hasMore });
    } catch (error) {
      commit('setError', error.message);
    } finally {
      commit('setLoading', false);
    }
  },

  async sendChannelMessage({ commit }, { channelId, content, attachments = [], user, threadId = null }) {
    try {
      const message = {
        content,
        channelId,
        user,
        threadId,
        type: 'channel',
        attachments,
        status: 'sent',
        reactions: [],
        edited: false,
        editHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const response = await api.post(`/channels/${channelId}/messages`, message);
      commit('addChannelMessage', { channelId, message: response.data });
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async sendConversationMessage({ commit }, { conversationId, content, attachments = [] }) {
    try {
      const message = {
        content,
        conversationId,
        type: 'conversation',
        attachments,
        status: 'sent'
      };
      
      const response = await api.post(`/conversations/${conversationId}/messages`, message);
      commit('addConversationMessage', { conversationId, message: response.data });
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  // WebSocket event handlers
  handleNewMessage({ commit }, message) {
    if (message.type === 'channel') {
      commit('addChannelMessage', { channelId: message.channelId, message });
    } else if (message.type === 'conversation') {
      commit('addConversationMessage', { conversationId: message.conversationId, message });
    }
  },

  handleMessageStatusUpdate({ commit }, { messageId, status, type, channelId, conversationId }) {
    if (type === 'channel') {
      commit('updateChannelMessageStatus', { channelId, messageId, status });
    } else if (type === 'conversation') {
      commit('updateConversationMessageStatus', { conversationId, messageId, status });
    }
  },

  setActiveThread({ commit }, thread) {
    commit('setActiveThread', thread);
  }
};

const mutations = {
  setChannelMessages(state, { channelId, messages }) {
    state.channelMessages = {
      ...state.channelMessages,
      [channelId]: {
        ...state.channelMessages[channelId],
        messages
      }
    };
  },

  setConversationMessages(state, { conversationId, messages }) {
    state.conversationMessages = {
      ...state.conversationMessages,
      [conversationId]: {
        ...state.conversationMessages[conversationId],
        messages
      }
    };
  },

  appendChannelMessages(state, { channelId, messages }) {
    const currentMessages = state.channelMessages[channelId]?.messages || [];
    state.channelMessages = {
      ...state.channelMessages,
      [channelId]: {
        ...state.channelMessages[channelId],
        messages: [...currentMessages, ...messages]
      }
    };
  },

  appendConversationMessages(state, { conversationId, messages }) {
    const currentMessages = state.conversationMessages[conversationId]?.messages || [];
    state.conversationMessages = {
      ...state.conversationMessages,
      [conversationId]: {
        ...state.conversationMessages[conversationId],
        messages: [...currentMessages, ...messages]
      }
    };
  },

  setChannelPagination(state, { channelId, nextCursor, hasMore }) {
    state.channelMessages = {
      ...state.channelMessages,
      [channelId]: {
        ...state.channelMessages[channelId],
        nextCursor,
        hasMore
      }
    };
  },

  setConversationPagination(state, { conversationId, nextCursor, hasMore }) {
    state.conversationMessages = {
      ...state.conversationMessages,
      [conversationId]: {
        ...state.conversationMessages[conversationId],
        nextCursor,
        hasMore
      }
    };
  },

  addChannelMessage(state, { channelId, message }) {
    const currentMessages = state.channelMessages[channelId]?.messages || [];
    state.channelMessages = {
      ...state.channelMessages,
      [channelId]: {
        ...state.channelMessages[channelId],
        messages: [...currentMessages, message]
      }
    };
  },

  addConversationMessage(state, { conversationId, message }) {
    const currentMessages = state.conversationMessages[conversationId]?.messages || [];
    state.conversationMessages = {
      ...state.conversationMessages,
      [conversationId]: {
        ...state.conversationMessages[conversationId],
        messages: [...currentMessages, message]
      }
    };
  },

  updateChannelMessageStatus(state, { channelId, messageId, status }) {
    const messages = state.channelMessages[channelId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        status
      };
    }
  },

  updateConversationMessageStatus(state, { conversationId, messageId, status }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        status
      };
    }
  },

  setActiveThread(state, thread) {
    state.activeThread = thread;
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