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
    const messages = state.channelMessages[channelId]?.messages || [];
    // Filter out messages that are thread replies
    return messages.filter(message => !message.threadId);
  },
  
  getConversationMessages: (state) => (conversationId) => {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    // Filter out messages that are thread replies
    return messages.filter(message => !message.threadId);
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
      if (message) {
        // Find all replies for this thread
        const replies = channelData.messages.filter(m => m.threadId === messageId);
        return replies;
      }
    }
    for (const conversationData of Object.values(state.conversationMessages)) {
      const message = conversationData.messages?.find(m => m._id === messageId);
    if (message) {
        // Find all replies for this thread
        const replies = conversationData.messages.filter(m => m.threadId === messageId);
        return replies;
      }
    }
    return [];
  },
  getThreadReplyCount: (state) => (messageId) => {
    const replies = getters.getThreadReplies(state)(messageId);
    return replies.length;
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

  async addChannelReaction({ commit }, { messageId, reaction }) {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji: reaction });
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        commit('setError', 'Reaction already exists');
      } else {
        commit('setError', error.message);
      }
      throw error;
    }
  },

  async removeChannelReaction({ commit }, { messageId, reactionId }) {
    try {
      const response = await api.delete(`/messages/${messageId}/reactions/${reactionId}`);
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
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

  async sendBotMessage({ commit }, message) {
    try {
      const response = await api.post('/chatbot/messages', message);
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
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
      // Don't commit the message here, it will be added when received through the socket
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
  },

  async sendThreadReply({ commit }, { message, token }) {
    try {
      let response;
      const messageData = {
        content: message.content,
        user: message.user,
        type: 'thread',
        status: 'sent',
        threadId: message.threadId
      };

      if (message.channelId) {
        // Handle channel thread replies
        response = await api.post(
          `/channels/${message.channelId}/messages/${message.threadId}/replies`, 
          messageData
        );
        
        // Don't commit the reply here, it will be added when received through the socket
        return response.data;
      } else if (message.conversationId) {
        // Handle conversation thread replies
        response = await api.post(
          `/conversations/${message.conversationId}/messages/${message.threadId}/replies`, 
          messageData
        );
        
        // Don't commit the reply here, it will be added when received through the socket
        return response.data;
      }
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async addMessage({ commit }, { message, type }) {
    try {
      if (type === 'channel') {
        commit('addChannelMessage', { 
          channelId: message.channelId, 
          message 
        });
      } else if (type === 'conversation') {
        commit('addConversationMessage', { 
          conversationId: message.conversationId, 
          message 
        });
      }
      return message;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async editConversationMessage({ commit }, { conversationId, messageId, content }) {
    try {
      const response = await api.put(`/conversations/${conversationId}/messages/${messageId}`, {
        content,
        updatedAt: new Date().toISOString()
      });
      
      // Don't commit the edit here, it will be updated when received through the socket
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
  },

  async editChannelMessage({ commit }, { channelId, messageId, content }) {
    try {
      const response = await api.put(`/channels/${channelId}/messages/${messageId}`, {
        content,
        updatedAt: new Date().toISOString()
      });
      
      // Don't commit the edit here, it will be updated when received through the socket
      return response.data;
    } catch (error) {
      commit('setError', error.message);
      throw error;
    }
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
    
    // If it's a thread reply, update the parent message's thread
    if (message.threadId) {
      const parentIndex = currentMessages.findIndex(m => m._id === message.threadId);
      if (parentIndex !== -1) {
        if (!currentMessages[parentIndex].thread) {
          currentMessages[parentIndex].thread = { replies: [] };
        }
      }
    }
    
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
    
    // If it's a thread reply, update the parent message's thread
    if (message.threadId) {
      const parentIndex = currentMessages.findIndex(m => m._id === message.threadId);
      if (parentIndex !== -1) {
        // Initialize thread object if it doesn't exist
        if (!currentMessages[parentIndex].thread) {
          currentMessages[parentIndex].thread = { replies: [] };
        }
        // Add the reply to the thread
        currentMessages[parentIndex].thread.replies = [
          ...(currentMessages[parentIndex].thread.replies || []),
          message
        ];
        
        // Update the messages array with the modified parent message
        state.conversationMessages = {
          ...state.conversationMessages,
          [conversationId]: {
            ...state.conversationMessages[conversationId],
            messages: [...currentMessages]
          }
        };
        return;
      }
    }
    
    // If not a thread reply or parent not found, add as a regular message
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
  },

  addChannelThreadReply(state, { channelId, threadId, reply }) {
    const messages = state.channelMessages[channelId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === threadId);

    if (messageIndex !== -1) {
      messages.push(reply);
    }
  },

  addConversationThreadReply(state, { conversationId, threadId, reply }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === threadId);

    if (messageIndex !== -1) {
      // Update the state with the new messages array
      state.conversationMessages[conversationId].messages.push(reply);
    }
  },

  ADD_CONVERSATION_REACTION(state, { messageId, reaction, conversationId }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      if (!message.reactions) {
        message.reactions = [];
      }
      message.reactions.push(reaction);
    }
  },

  ADD_CHANNEL_REACTION(state, { messageId, reaction, channelId }) {
    const messages = state.channelMessages[channelId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      if (!message.reactions) {
        message.reactions = [];
      }
      message.reactions.push(reaction);
    }
  },

  REMOVE_CONVERSATION_REACTION(state, { messageId, reaction, conversationId }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      if (message.reactions) {
        const reactionIndex = message.reactions.findIndex(r => r._id === reaction._id);
        if (reactionIndex !== -1) {
          message.reactions.splice(reactionIndex, 1);
        }
      }
    }
  },

  REMOVE_CHANNEL_REACTION(state, { messageId, reaction, channelId }) {
    const messages = state.channelMessages[channelId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      const message = messages[messageIndex];
      if (message.reactions) {
        const reactionIndex = message.reactions.findIndex(r => r._id === reaction._id);
        if (reactionIndex !== -1) {
          message.reactions.splice(reactionIndex, 1);
        }
      }
    }
  },

  UPDATE_CONVERSATION_MESSAGE(state, { conversationId, messageId, content }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        content,
        updatedAt: new Date().toISOString()
      };
    }
  },

  updateMessageDeliveryStatus(state, { messageId, conversationId, status }) {
    const messages = state.conversationMessages[conversationId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        status
      };
    }
  },

  UPDATE_CHANNEL_MESSAGE(state, { channelId, messageId, message }) {
    const messages = state.channelMessages[channelId]?.messages || [];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        ...message,
        updatedAt: new Date().toISOString()
      };
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}; 