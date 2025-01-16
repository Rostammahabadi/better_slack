// store/modules/chatbot.js
import { api } from '@/services/api';
const state = {
  messages: [], // Chat messages
  isConnected: false, // Bot connection status
  userInput: '', // User's input text
  isActive: false, // Whether the bot is currently active
  loading: false,
  error: null,
  sendingMessage: false,
  retryCount: 0,
  conversation: {},
  botEnabledChannels: [], // Array of channel IDs where bot is enabled
  botEnabledConversations: [], // Array of conversation IDs where bot is enabled
}
const mutations = {
  ADD_MESSAGE(state, message) {
    state.messages.push(message);
  },
  SET_CONNECTED(state, status) {
    state.isConnected = status;
  },
  SET_USER_INPUT(state, input) {
    state.userInput = input;
  },
  SET_ACTIVE(state, status) {
    state.isActive = status;
  },
  CLEAR_MESSAGES(state) {
    state.messages = [];
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_MESSAGES(state, messages) {
    state.messages = messages;
  },
  SET_CONVERSATION(state, conversation) {
    state.conversation = conversation;
  },
  SET_BOT_ENABLED_CHANNELS(state, channelIds) {
    state.botEnabledChannels = channelIds;
  },
  SET_BOT_ENABLED_CONVERSATIONS(state, conversationIds) {
    state.botEnabledConversations = conversationIds;
  }
}
const actions = {

  async addBotResponse({ commit }, message) {
    commit('ADD_MESSAGE', {
      _id: Date.now() + Math.random(),
      ...message,
      type: 'bot',
      sender: 'bot',
      avatarUrl: '/images/bot.png',
      user: {
        displayName: 'Chatbot',
        avatarUrl: '/images/bot.png'
      },
      timestamp: new Date().toISOString()
    });
  },
  
  async fetchConversation({ commit }, workspaceId) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get(`/chatbot/conversation/${workspaceId}`);
      commit('SET_CONVERSATION', response.data);
      commit('SET_MESSAGES', response.data.messages);
      
      if (!state.messages.length) {
        commit('SET_MESSAGES', []);
      }
      
      return true;
    } catch (error) {
      dispatch('showToastError', error.message);
      console.error('Failed to fetch bot messages:', error);
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  addMessage({ commit }, message) {
    commit('ADD_MESSAGE', message);
  },

  setLoading({ commit }, status) {
    commit('SET_LOADING', status);
  },

  deactivateBot({ commit }) {
    commit('SET_ACTIVE', false);
    commit('CLEAR_MESSAGES');
  },

  async setBotMode({ commit }, { channelIds, conversationIds, enabled }) {
    try {
      const response = await api.post('/chatbot/mode', {
        channelIds,
        conversationIds,
        enabled
      });
      return response.data;
    } catch (error) {
      dispatch('showToastError', error.message, { root: true });
      throw error;
    }
  }
}
const getters = {
  isActive: state => state.isActive,
  messages: state => state.messages,
  lastMessage: state => state.messages[state.messages.length - 1],
  loading: state => state.loading,
  isBotEnabledForChannel: state => channelId => state.botEnabledChannels.includes(channelId),
  isBotEnabledForConversation: state => conversationId => state.botEnabledConversations.includes(conversationId),
  botEnabledChannels: state => state.botEnabledChannels,
  botEnabledConversations: state => state.botEnabledConversations
}


export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};