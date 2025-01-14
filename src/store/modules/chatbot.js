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
  }
}
const actions = {
  addMessage({ commit }, message) {
    commit('ADD_MESSAGE', {
      _id: Date.now() + Math.random(),
      ...message,
      sender: 'bot',
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