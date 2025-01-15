// store/modules/chatbot.js

const state = {
  messages: [], // Chat messages
  isConnected: false, // Bot connection status
  userInput: '', // User's input text
  isActive: false, // Whether the bot is currently active
  loading: false,
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
  }
}
const actions = {
  async activateBot({ commit, dispatch, rootState }) {
    try {
      commit('SET_LOADING', true);
      commit('CLEAR_MESSAGES');
      
      // Emit bot:connect event through socket
      if (rootState.socket.socket) {
        rootState.socket.socket.emit('bot:connect', {
          userId: rootState.auth.user._id
        });
      }
      
      commit('SET_ACTIVE', true);
      
      // Add welcome message
      dispatch('addMessage', {
        content: 'Hello! I am your AI assistant. How can I help you today?',
        sender: 'bot',
        type: 'bot'
      });
      
      return true;
    } catch (error) {
      console.error('Failed to activate bot:', error);
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchMessages({ commit, rootState }) {
    try {
      commit('SET_LOADING', true);
      
      // If we implement message persistence, we can fetch messages here
      // For now, we'll just ensure the messages array is initialized
      if (!state.messages.length) {
        commit('SET_MESSAGES', []);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to fetch bot messages:', error);
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  addMessage({ commit }, message) {
    commit('ADD_MESSAGE', {
      _id: Date.now() + Math.random(),
      ...message,
      timestamp: new Date().toISOString(),
      type: 'bot'
    });
  },

  setLoading({ commit }, status) {
    commit('SET_LOADING', status);
  },

  deactivateBot({ commit }) {
    commit('SET_ACTIVE', false);
    commit('CLEAR_MESSAGES');
  },

  sendMessage({ commit, rootState }, content) {
    // Add user message to chat
    const userMessage = {
      _id: Date.now() + Math.random(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'bot'
    };
    commit('ADD_MESSAGE', userMessage);

    // Emit message through socket
    if (rootState.socket.socket) {
      commit('SET_LOADING', true);
      rootState.socket.socket.emit('bot:message', {
        message: content,
        userId: rootState.auth.user._id
      });
    }
  }
}
const getters = {
  isActive: state => state.isActive,
  messages: state => state.messages,
  lastMessage: state => state.messages[state.messages.length - 1],
  loading: state => state.loading
}


export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};