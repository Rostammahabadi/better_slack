<template>
  <div class="conversation-list">
    <div class="conversation-list-header">
      <h2 class="text-xl font-semibold">Conversations</h2>
      <button
        @click="openNewConversation"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        New Chat
      </button>
    </div>

    <div v-if="isLoading" class="p-4 text-center">
      <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
    </div>

    <div v-else-if="error" class="p-4 text-red-500 text-center">
      {{ error }}
      <button @click="loadConversations" class="text-blue-500 hover:underline block mt-2">
        Retry
      </button>
    </div>

    <div v-else-if="conversations.length === 0" class="p-4 text-center text-gray-500">
      No conversations yet
    </div>

    <div v-else class="conversation-items">
      <router-link
        v-for="conversation in conversations"
        :key="conversation.id"
        :to="{ name: 'conversation', params: { id: conversation.id }}"
        class="conversation-item"
        :class="{ 'active': currentConversationId === conversation.id }"
      >
        <div class="conversation-avatar">
          <!-- Add avatar component here if needed -->
          <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {{ getInitials(conversation.participants[0]?.name) }}
          </div>
        </div>
        
        <div class="conversation-content">
          <div class="conversation-header">
            <h3 class="conversation-title">
              {{ getConversationTitle(conversation) }}
            </h3>
            <span class="conversation-time">
              {{ formatTime(conversation.lastMessage?.createdAt) }}
            </span>
          </div>
          
          <p class="conversation-preview" :class="{ 'font-semibold': conversation.unreadCount > 0 }">
            {{ conversation.lastMessage?.content || 'No messages yet' }}
          </p>
          
          <div v-if="conversation.unreadCount" class="unread-badge">
            {{ conversation.unreadCount }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'ConversationList',
  
  setup() {
    const store = useStore()
    const route = useRoute()

    const conversations = computed(() => store.getters['conversations/getConversations'])
    const isLoading = computed(() => store.getters['conversations/getIsLoading'])
    const error = computed(() => store.getters['conversations/getError'])
    const currentConversationId = computed(() => route.params.id)

    const loadConversations = async () => {
      await store.dispatch('conversations/fetchConversations')
    }

    const openNewConversation = () => {
      // TODO: Implement new conversation modal
    }

    const getInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const getConversationTitle = (conversation) => {
      if (conversation.name) return conversation.name
      return conversation.participants
        .map(p => p.name)
        .join(', ')
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    onMounted(loadConversations)

    return {
      conversations,
      isLoading,
      error,
      currentConversationId,
      loadConversations,
      openNewConversation,
      getInitials,
      getConversationTitle,
      formatTime,
    }
  }
}
</script>

<style scoped>
.conversation-list {
  @apply h-full flex flex-col border-r border-gray-200;
}

.conversation-list-header {
  @apply p-4 flex items-center justify-between border-b border-gray-200;
}

.conversation-items {
  @apply flex-1 overflow-y-auto;
}

.conversation-item {
  @apply flex items-start p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100;
}

.conversation-item.active {
  @apply bg-blue-50;
}

.conversation-avatar {
  @apply mr-3 flex-shrink-0;
}

.conversation-content {
  @apply flex-1 min-w-0;
}

.conversation-header {
  @apply flex items-center justify-between mb-1;
}

.conversation-title {
  @apply font-medium text-gray-900 truncate;
}

.conversation-time {
  @apply text-xs text-gray-500 ml-2;
}

.conversation-preview {
  @apply text-sm text-gray-500 truncate;
}

.unread-badge {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full mt-1;
}
</style> 