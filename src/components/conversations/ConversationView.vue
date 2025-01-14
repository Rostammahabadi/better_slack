<template>
  <div class="conversation-view">
    <!-- Header -->
    <div class="conversation-header">
      <div class="flex items-center">
        <div class="conversation-avatar">
          <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {{ getInitials(conversation?.participants[0]?.name) }}
          </div>
        </div>
        <div class="ml-3">
          <h2 class="text-lg font-semibold">{{ conversationTitle }}</h2>
          <div class="text-sm text-gray-500">
            {{ participantsText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div 
      ref="messagesContainer"
      class="messages-container"
      @scroll="handleScroll"
    >
      <div v-if="isLoading && !messages.length" class="flex justify-center items-center h-full">
        <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>

      <div v-else-if="error" class="flex justify-center items-center h-full text-red-500">
        {{ error }}
        <button @click="loadMessages" class="text-blue-500 hover:underline ml-2">
          Retry
        </button>
      </div>

      <div v-else>
        <div v-if="isLoadingMore" class="text-center py-4">
          <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        </div>

        <div v-for="message in groupedMessages" :key="message.id" class="message-group">
          <div class="message-date-divider" v-if="message.showDate">
            {{ formatDate(message.createdAt) }}
          </div>
          
          <div 
            class="message-bubble"
            :class="{ 
              'message-mine': message.senderId === currentUserId,
              'message-other': message.senderId !== currentUserId 
            }"
          >
            <div class="message-sender" v-if="message.senderId !== currentUserId">
              {{ message.sender?.name }}
            </div>
            <div class="message-content">
              {{ message.content }}
            </div>
            <div class="message-time">
              {{ formatMessageTime(message.createdAt) }}
              <span v-if="message.senderId === currentUserId" class="message-status">
                {{ message.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Typing Indicator -->
    <div v-if="showTypingIndicator" class="typing-indicator">
      {{ typingText }}
    </div>

    <!-- Message Input -->
    <div class="message-input">
      <textarea
        ref="messageInput"
        v-model="newMessage"
        @keydown.enter.prevent="sendMessage"
        @input="handleTyping"
        placeholder="Type a message..."
        class="message-input-field"
        rows="1"
      ></textarea>
      <button 
        @click="sendMessage"
        :disabled="!newMessage.trim()"
        class="send-button"
        :class="{ 'opacity-50 cursor-not-allowed': !newMessage.trim() }"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import debounce from 'lodash/debounce'

export default {
  name: 'ConversationView',

  setup() {
    const store = useStore()
    const route = useRoute()
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    const newMessage = ref('')
    const isLoadingMore = ref(false)
    const typingTimeout = ref(null)

    const conversation = computed(() => store.getters['conversations/getCurrentConversation'])
    const messages = computed(() => store.getters['conversations/getMessages'])
    const isLoading = computed(() => store.getters['conversations/getIsLoading'])
    const error = computed(() => store.getters['conversations/getError'])
    const hasMoreMessages = computed(() => store.getters['conversations/getHasMoreMessages'])
    const currentUserId = computed(() => store.getters['auth/getUserId'])
    const typingUsers = computed(() => store.getters['conversations/getParticipantTyping'])

    const conversationId = computed(() => route.params.conversationId)

    const conversationTitle = computed(() => {
      if (!conversation.value) return ''
      return conversation.value.name || conversation.value.participants
        .map(p => p.name)
        .join(', ')
    })

    const participantsText = computed(() => {
      if (!conversation.value) return ''
      return `${conversation.value.participants.length} participants`
    })

    const groupedMessages = computed(() => {
      return messages.value.map((message, index) => {
        const showDate = index === 0 || !isSameDay(
          new Date(messages.value[index - 1]?.createdAt),
          new Date(message.createdAt)
        )
        return { ...message, showDate }
      })
    })

    const showTypingIndicator = computed(() => {
      const typingParticipants = typingUsers.value[conversationId.value] || {}
      return Object.values(typingParticipants).some(isTyping => isTyping)
    })

    const typingText = computed(() => {
      const typingParticipants = typingUsers.value[conversationId.value] || {}
      const typingUserIds = Object.entries(typingParticipants)
        .filter(([_, isTyping]) => isTyping)
        .map(([userId]) => userId)
      
      if (typingUserIds.length === 0) return ''
      
      const names = typingUserIds
        .map(userId => conversation.value?.participants.find(p => p.id === userId)?.name || 'Someone')
      
      if (names.length === 1) return `${names[0]} is typing...`
      if (names.length === 2) return `${names.join(' and ')} are typing...`
      return 'Several people are typing...'
    })

    const loadConversation = async () => {
      await store.dispatch('conversations/fetchConversation', conversationId.value)
    }

    const loadMessages = async () => {
      await store.dispatch('conversations/fetchMessages', {
        conversationId: conversationId.value
      })
      await nextTick()
      scrollToBottom()
    }

    const loadMoreMessages = async () => {
      if (!hasMoreMessages.value || isLoadingMore.value) return
      
      isLoadingMore.value = true
      try {
        await store.dispatch('conversations/fetchMessages', {
          conversationId: conversationId.value,
          cursor: messages.value[0]?.id
        })
      } finally {
        isLoadingMore.value = false
      }
    }

    const sendMessage = async () => {
      if (!newMessage.value.trim()) return
      
      const content = newMessage.value
      newMessage.value = ''
      
      try {
        await store.dispatch('conversations/sendMessage', {
          conversationId: conversationId.value,
          content
        })
        await nextTick()
        scrollToBottom()
      } catch (error) {
        // Handle error (could show a toast notification)
        console.error('Failed to send message:', error)
      }
    }

    const handleTyping = debounce(() => {
      store.dispatch('conversations/handleTypingStatus', {
        conversationId: conversationId.value,
        isTyping: true
      })

      if (typingTimeout.value) clearTimeout(typingTimeout.value)
      
      typingTimeout.value = setTimeout(() => {
        store.dispatch('conversations/handleTypingStatus', {
          conversationId: conversationId.value,
          isTyping: false
        })
      }, 3000)
    }, 300)

    const handleScroll = debounce(() => {
      const container = messagesContainer.value
      if (!container) return

      if (container.scrollTop === 0) {
        loadMoreMessages()
      }
    }, 200)

    const scrollToBottom = () => {
      const container = messagesContainer.value
      if (container) {
        container.scrollTop = container.scrollHeight
      }
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

    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      if (isToday(date)) return 'Today'
      if (isYesterday(date)) return 'Yesterday'
      return format(date, 'MMMM d, yyyy')
    }

    const formatMessageTime = (timestamp) => {
      return format(new Date(timestamp), 'h:mm a')
    }

    const isSameDay = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    }

    onMounted(async () => {
      await loadConversation()
      await loadMessages()
      messageInput.value?.focus()
    })

    onUnmounted(() => {
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
    })

    watch(conversationId, async (newId, oldId) => {
      if (newId !== oldId) {
        await loadConversation()
        await loadMessages()
      }
    })

    return {
      conversation,
      messages,
      isLoading,
      isLoadingMore,
      error,
      newMessage,
      messagesContainer,
      messageInput,
      currentUserId,
      conversationTitle,
      participantsText,
      groupedMessages,
      showTypingIndicator,
      typingText,
      loadMessages,
      sendMessage,
      handleTyping,
      handleScroll,
      getInitials,
      formatDate,
      formatMessageTime,
    }
  }
}
</script>

<style scoped>
.conversation-view {
  @apply h-full flex flex-col;
}

.conversation-header {
  @apply p-4 border-b border-gray-200 bg-white;
}

.messages-container {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.message-group {
  @apply space-y-2;
}

.message-date-divider {
  @apply text-center text-sm text-gray-500 my-4;
}

.message-bubble {
  @apply max-w-[70%] rounded-lg p-3 relative;
}

.message-mine {
  @apply ml-auto bg-blue-500 text-white;
}

.message-other {
  @apply bg-gray-100;
}

.message-sender {
  @apply text-xs text-gray-600 mb-1;
}

.message-content {
  @apply break-words;
}

.message-time {
  @apply text-xs mt-1;
}

.message-mine .message-time {
  @apply text-blue-100;
}

.message-other .message-time {
  @apply text-gray-500;
}

.message-status {
  @apply ml-1;
}

.typing-indicator {
  @apply text-sm text-gray-500 px-4 py-2;
}

.message-input {
  @apply p-4 border-t border-gray-200 bg-white flex items-end space-x-2;
}

.message-input-field {
  @apply flex-1 resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.send-button {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
</style> 