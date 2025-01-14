import { api } from '@/services/api'

const state = {
  searchResults: [],
  isSearching: false,
  searchError: null,
  users: [],
  isLoading: false,
  error: null,
  nextCursor: null,
  hasMore: true
}

const getters = {
  getSearchResults: (state) => state.searchResults,
  getIsSearching: (state) => state.isSearching,
  getSearchError: (state) => state.searchError,
  getUsers: (state) => state.users,
  getIsLoading: (state) => state.isLoading,
  getError: (state) => state.error,
  getHasMore: (state) => state.hasMore,
  getNextCursor: (state) => state.nextCursor
}

const actions = {
  async fetchUsers({ commit, state }, { cursor = null } = {}) {
    try {
      commit('setIsLoading', true)
      commit('setError', null)
      
      const response = await api.get('/users', {
        params: { 
          limit: 10,
          cursor: cursor || state.nextCursor
        }
      })
      
      const { users, nextCursor } = response.data
      
      if (cursor) {
        commit('appendUsers', users)
      } else {
        commit('setUsers', users)
      }
      
      commit('setNextCursor', nextCursor)
      commit('setHasMore', !!nextCursor)
      
      return users
    } catch (error) {
      commit('setError', error.message)
      throw error
    } finally {
      commit('setIsLoading', false)
    }
  },

  async searchUsers({ commit }, query) {
    try {
      commit('setIsSearching', true)
      commit('setSearchError', null)
      
      const response = await api.get('/users/search', {
        params: { query }
      })
      
      commit('setSearchResults', response.data)
      return response.data
    } catch (error) {
      commit('setSearchError', error.message)
      throw error
    } finally {
      commit('setIsSearching', false)
    }
  },

  clearSearch({ commit }) {
    commit('setSearchResults', [])
    commit('setSearchError', null)
  }
}

const mutations = {
  setSearchResults(state, results) {
    state.searchResults = results
  },

  setIsSearching(state, isSearching) {
    state.isSearching = isSearching
  },

  setSearchError(state, error) {
    state.searchError = error
  },

  setUsers(state, users) {
    state.users = users
  },

  appendUsers(state, users) {
    state.users = [...state.users, ...users]
  },

  setIsLoading(state, isLoading) {
    state.isLoading = isLoading
  },

  setError(state, error) {
    state.error = error
  },

  setNextCursor(state, cursor) {
    state.nextCursor = cursor
  },

  setHasMore(state, hasMore) {
    state.hasMore = hasMore
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 