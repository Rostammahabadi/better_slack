import { api } from '@/services/api'

const state = {
  searchResults: [],
  isSearching: false,
  searchError: null
}

const getters = {
  getSearchResults: (state) => state.searchResults,
  getIsSearching: (state) => state.isSearching,
  getSearchError: (state) => state.searchError
}

const actions = {
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 