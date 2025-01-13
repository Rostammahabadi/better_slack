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

  async sendMessage({ commit }, { conversationId, content, attachments = [] }) {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        content,
        attachments,
      })
      commit('addMessage', response.data)
      return response.data
    } catch (error) {
      commit('setError', error.message)
      throw error
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
}

const mutations = {
  setConversations(state, conversations) {
    state.conversations = conversations
  },

  setCurrentConversation(state, conversation) {
    state.currentConversation = conversation
  },

  setMessages(state, messages) {
    state.messages = messages
  },

  appendMessages(state, messages) {
    state.messages = [...messages, ...state.messages]
  },

  addMessage(state, message) {
    state.messages.push(message)
    // Update last message in conversations list
    const conversationIndex = state.conversations.findIndex(
      conv => conv.id === message.conversationId
    )
    if (conversationIndex !== -1) {
      state.conversations[conversationIndex].lastMessage = message
    }
  },

  addConversation(state, conversation) {
    state.conversations.unshift(conversation)
  },

  setLoading(state, isLoading) {
    state.isLoading = isLoading
  },

  setError(state, error) {
    state.error = error
  },

  setNextCursor(state, cursor) {
    state.nextCursor = cursor
  },

  setHasMoreMessages(state, hasMore) {
    state.hasMoreMessages = hasMore
  },

  setParticipantTyping(state, { conversationId, userId, isTyping }) {
    state.participantTyping = {
      ...state.participantTyping,
      [conversationId]: {
        ...(state.participantTyping[conversationId] || {}),
        [userId]: isTyping,
      },
    }
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