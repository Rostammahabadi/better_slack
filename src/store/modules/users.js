import { api } from '@/services/api'

const state = {
  users: [],
  onlineUsers: new Set(), // Set of online user IDs
  loading: false,
  error: null
}

const mutations = {
  SET_USERS(state, users) {
    state.users = users;
  },
  SET_USER_ONLINE(state, userId) {
    state.onlineUsers.add(userId);
  },
  SET_USER_OFFLINE(state, userId) {
    state.onlineUsers.delete(userId);
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
}

const actions = {
  async fetchUsers({ commit }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get('/users');
      commit('SET_USERS', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  setUserOnline({ commit }, userId) {
    commit('SET_USER_ONLINE', userId);
  },

  setUserOffline({ commit }, userId) {
    commit('SET_USER_OFFLINE', userId);
  }
}

const getters = {
  allUsers: state => state.users,
  isUserOnline: state => userId => state.onlineUsers.has(userId),
  getUserById: state => id => state.users.find(user => user._id === id),
  getIsLoading: state => state.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 