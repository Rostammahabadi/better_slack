import { io } from 'socket.io-client';

const state = {
  socket: null,
  connected: false,
  error: null
};

const mutations = {
  SET_SOCKET(state, socket) {
    state.socket = socket;
  },
  SET_CONNECTED(state, connected) {
    state.connected = connected;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  initSocket({ commit, dispatch, rootGetters }) {
    const token = rootGetters['auth/token'];
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      commit('SET_CONNECTED', true);
      commit('SET_ERROR', null);
    });

    socket.on('disconnect', () => {
      commit('SET_CONNECTED', false);
    });

    socket.on('error', (error) => {
      commit('SET_ERROR', error.message);
    });

    // Message events
    socket.on('new_message', (message) => {
      dispatch('messages/receiveMessage', message, { root: true });
    });

    socket.on('message_updated', (message) => {
      dispatch('messages/updateMessage', message, { root: true });
    });

    socket.on('message_deleted', (messageId) => {
      dispatch('messages/deleteMessage', messageId, { root: true });
    });

    // Reaction events
    socket.on('reaction_added', ({ messageId, reaction }) => {
      dispatch('messages/addReaction', { messageId, reaction }, { root: true });
    });

    socket.on('reaction_removed', ({ messageId, reactionId }) => {
      dispatch('messages/removeReaction', { messageId, reactionId }, { root: true });
    });

    commit('SET_SOCKET', socket);
  },

  disconnect({ commit, state }) {
    if (state.socket) {
      state.socket.disconnect();
      commit('SET_SOCKET', null);
      commit('SET_CONNECTED', false);
    }
  }
};

const getters = {
  isConnected: state => state.connected,
  socket: state => state.socket,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 