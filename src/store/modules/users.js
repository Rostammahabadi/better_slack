import { api } from '@/services/api'

const state = {
  users: [],
  onlineUsers: new Set(), // Set of online user IDs
  loading: false,
  error: null,
  nextCursor: null
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
  },
  SET_USER_AWAY(state, userId) {
    const user = state.users.find(u => u._id === userId);
    if (user) {
      user.status = 'away';
    }
  },
  SET_USER_ACTIVE(state, userId) {
    const user = state.users.find(u => u._id === userId);
    if (user) {
      user.status = 'active';
    }
  },
  SET_NEXT_CURSOR(state, cursor) {
    state.nextCursor = cursor;
  },
  APPEND_USERS(state, users) {
    state.users = [...state.users, ...users];
  }
}

const actions = {
  async fetchUsers({ commit }, { cursor = null, workspaceId, search } = {}) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get('/users', {
        params: {
          lastId: cursor,
          workspaceId,
          search,
          limit: 20
        }
      });
      
      const { users } = response.data;
      const nextCursor = users.length === 20 ? users[users.length - 1]._id : null;
      
      if (cursor) {
        commit('APPEND_USERS', users);
      } else {
        commit('SET_USERS', users);
      }
      
      commit('SET_NEXT_CURSOR', nextCursor);
      return users;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async searchUsers({ commit }, { query, workspaceId }) {
    try {
      commit('SET_LOADING', true);
      const response = await api.get('/users', {
        params: {
          search: query,
          workspaceId,
          limit: 20
        }
      });
      
      const { users } = response.data;
      const nextCursor = users.length === 20 ? users[users.length - 1]._id : null;
      
      commit('SET_USERS', users);
      commit('SET_NEXT_CURSOR', nextCursor);
      return users;
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
  },

  setUserAway({ commit }, userId) {
    commit('SET_USER_AWAY', userId);
  },

  setUserActive({ commit }, userId) {
    commit('SET_USER_ACTIVE', userId);
  }
}

const getters = {
  allUsers: state => state.users,
  isUserOnline: state => userId => state.onlineUsers.has(userId),
  getUserById: state => id => state.users.find(user => user._id === id),
  getIsLoading: state => state.loading,
  isUserAway: state => userId => {
    const user = state.users.find(u => u._id === userId);
    return user?.status === 'away';
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 