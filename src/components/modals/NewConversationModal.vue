<template>
  <BaseModal
    :show="show"
    @close="handleClose"
    title="New Conversation"
  >
    <div class="new-conversation-modal">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Select Participants
        </label>
        <div class="selected-users mb-2" v-if="selectedUsers.length > 0">
          <div
            v-for="user in selectedUsers"
            :key="user.id"
            class="selected-user-tag"
          >
            <span>{{ user.name }}</span>
            <button
              @click="removeUser(user)"
              class="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Search users..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div
            v-if="showResults && filteredUsers.length > 0"
            class="search-results"
          >
            <button
              v-for="user in filteredUsers"
              :key="user.id"
              @click="selectUser(user)"
              class="search-result-item"
            >
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                {{ getInitials(user.name) }}
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ user.name }}</div>
                <div class="text-sm text-gray-500">{{ user.email }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Initial Message
        </label>
        <textarea
          v-model="message"
          rows="3"
          placeholder="Type your first message..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          @click="handleCreate"
          :disabled="!canCreate"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Conversation
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'
import debounce from 'lodash/debounce'

export default {
  name: 'NewConversationModal',

  components: {
    BaseModal
  },

  props: {
    show: {
      type: Boolean,
      required: true
    }
  },

  emits: ['close'],

  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    
    const searchQuery = ref('')
    const message = ref('')
    const selectedUsers = ref([])
    const showResults = ref(false)
    const searchResults = ref([])

    const filteredUsers = computed(() => {
      return searchResults.value.filter(user => 
        !selectedUsers.value.some(selected => selected.id === user.id)
      )
    })

    const canCreate = computed(() => 
      selectedUsers.value.length > 0 && message.value.trim().length > 0
    )

    const handleSearch = debounce(async () => {
      if (searchQuery.value.trim().length < 2) {
        searchResults.value = []
        showResults.value = false
        return
      }

      try {
        // Assuming you have an API endpoint to search users
        const response = await store.dispatch('users/searchUsers', searchQuery.value)
        searchResults.value = response
        showResults.value = true
      } catch (error) {
        console.error('Failed to search users:', error)
      }
    }, 300)

    const selectUser = (user) => {
      selectedUsers.value.push(user)
      searchQuery.value = ''
      showResults.value = false
    }

    const removeUser = (user) => {
      selectedUsers.value = selectedUsers.value.filter(u => u.id !== user.id)
    }

    const handleCreate = async () => {
      try {
        const conversation = await store.dispatch('conversations/createConversation', {
          participants: selectedUsers.value.map(u => u.id),
          message: message.value
        })
        
        emit('close')
        router.push({
          name: 'conversation',
          params: { conversationId: conversation.id }
        })
      } catch (error) {
        console.error('Failed to create conversation:', error)
      }
    }

    const handleClose = () => {
      searchQuery.value = ''
      message.value = ''
      selectedUsers.value = []
      showResults.value = false
      emit('close')
    }

    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return {
      searchQuery,
      message,
      selectedUsers,
      showResults,
      filteredUsers,
      canCreate,
      handleSearch,
      selectUser,
      removeUser,
      handleCreate,
      handleClose,
      getInitials
    }
  }
}
</script>

<style scoped>
.new-conversation-modal {
  @apply p-4;
}

.selected-users {
  @apply flex flex-wrap gap-2;
}

.selected-user-tag {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800;
}

.search-results {
  @apply absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm;
}

.search-result-item {
  @apply w-full flex items-center px-3 py-2 text-left hover:bg-gray-100;
}
</style> 