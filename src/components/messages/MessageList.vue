<template>
  <div class="message-list" ref="messageListRef">
    <!-- Loading indicator at the top -->
    <div v-if="isLoadingMore" class="loading-indicator">
      Loading more messages...
    </div>

    <div 
      v-for="message in messages" 
      :key="message._id" 
      class="message"
      @mouseover="showMenuForMessage(message)"
      @mouseleave="startHideMenu"
      :class="{ 
        'message-hovered': hoveredMessage?._id === message._id,
        [`message-type-${message.type}`]: true
      }"
    >
      <img
        v-if="message.user?.avatarUrl"
        :src="message.user.avatarUrl" 
        :alt="`${message.user?.displayName}'s avatar`" 
        class="avatar"
      />
      <div v-else class="avatar default-avatar">
        {{ getInitials(message.user?.displayName) }}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="username">{{ message.user?.displayName }}</span>
          <span class="timestamp">{{ formatTimestamp(message.createdAt) }}</span>
          <!-- <MessageStatus :status="message.status" /> -->
        </div>
        <div v-if="editingMessageId === message._id" class="message-edit">
          <TextEditor 
            :message="message"
            @edit-message="handleEditComplete"
            @send-message="handleSendMessage"
            @cancel="handleCancelEdit"
          />
        </div>
        <div v-else class="message-text">
          {{ message.content }}
        </div>
        <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
          <button 
            v-for="reaction in message.reactions" 
            :key="reaction._id" 
            class="reaction"
            :class="{ 'reaction-active': hasUserReacted(reaction) }"
            @click="handleRemoveReaction(reaction.emoji, message._id)"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </button>
        </div>
        
        <!-- Thread Reply Count and Preview -->
        <div v-if="getThreadCount(message) > 0" class="thread-info" @click="handleReply">
          <div class="thread-preview-content">
            <div class="thread-header">
              <div class="thread-left">
                <img 
                  v-if="getLastReplyUser(message)?.avatarUrl"
                  :src="getLastReplyUser(message).avatarUrl" 
                  :alt="`${getLastReplyUser(message)?.displayName}'s avatar`" 
                  class="thread-avatar"
                />
                <div v-else class="thread-avatar default-avatar">
                  {{ getInitials(getLastReplyUser(message)?.displayName) }}
                </div>
                <div class="thread-count">
                  {{ getThreadCount(message) }} {{ getThreadCount(message) === 1 ? 'reply' : 'replies' }}
                </div>
              </div>
              <span class="thread-timestamp">{{ formatTimestamp(getLastReply(message)?.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Message Hover Menu -->
        <MessageHoverMenu
          v-if="showHoverMenu && hoveredMessage?._id === message._id"
          @add-reaction="(emoji) => handleAddReaction(emoji, message._id)"
          @reply="handleReply"
          @menu-hover="cancelHideMenu"
          @menu-leave="startHideMenu"
          @edit="() => handleEdit(message)"
          class="hover-menu-bottom-right"
        />
      </div>
    </div>
    <div v-if="!messages?.length" class="no-messages">
      No messages yet. Start the conversation! 💬
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import MessageHoverMenu from './MessageHoverMenu.vue';
import TextEditor from '../TextEditor.vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const emit = defineEmits(['edit-message']);
const messageListRef = ref(null);
const hoveredMessage = ref(null);
const showHoverMenu = ref(false);
const editingMessageId = ref(null);
let hideMenuTimeout = null;
const isLoadingMore = ref(false);

import { useSocket } from '../../services/socketService';
const store = useStore();
const router = useRouter();
const {
  sendReaction,
  sendReactionRemoved,
  sendEditMessage,
  sendConversationMessage,
  sendRealtimeMessage,
  sendChannelMessageEdit,
  sendConversationMessageEdit
} = useSocket(store);

// Computed properties for messages and pagination
const messages = computed(() => {
  const channelId = router.currentRoute.value.params.channelId;
  const conversationId = router.currentRoute.value.params.conversationId;

  if (channelId) {
    return store.getters['messages/getChannelMessages'](channelId);
  } else if (conversationId) {
    return store.getters['messages/getConversationMessages'](conversationId);
  }
  return [];
});

const hasMore = computed(() => {
  const channelId = router.currentRoute.value.params.channelId;
  const conversationId = router.currentRoute.value.params.conversationId;

  if (channelId) {
    return store.getters['messages/hasMoreChannelMessages'](channelId);
  } else if (conversationId) {
    return store.getters['messages/hasMoreConversationMessages'](conversationId);
  }
  return false;
});

const nextCursor = computed(() => {
  const channelId = router.currentRoute.value.params.channelId;
  const conversationId = router.currentRoute.value.params.conversationId;

  if (channelId) {
    return store.getters['messages/getChannelNextCursor'](channelId);
  } else if (conversationId) {
    return store.getters['messages/getConversationNextCursor'](conversationId);
  }
  return null;
});

// Message status indicator component
// const MessageStatus = {
//   props: ['status'],
//   template: `
//     <span class="message-status" :title="status">
//       {{ statusIcon }}
//     </span>
//   `,
//   computed: {
//     statusIcon() {
//       switch (this.status) {
//         case 'sent': return '✓';
//         case 'delivered': return '✓✓';
//         case 'read': return '✓✓';
//         default: return '';
//       }
//     }
//   }
// };

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const showMenuForMessage = (message) => {
  cancelHideMenu();
  hoveredMessage.value = message;
  showHoverMenu.value = true;
};

const startHideMenu = () => {
  hideMenuTimeout = setTimeout(() => {
    hoveredMessage.value = null;
    showHoverMenu.value = false;
  }, 100);
};

const cancelHideMenu = () => {
  if (hideMenuTimeout) {
    clearTimeout(hideMenuTimeout);
    hideMenuTimeout = null;
  }
};

const handleEdit = (message) => {
  if (hoveredMessage.value) {
    editingMessageId.value = message._id;
    showHoverMenu.value = false;
  }
};

const handleCancelEdit = () => {
  editingMessageId.value = null;
  hoveredMessage.value = null;
  showHoverMenu.value = false;
};

const handleEditComplete = async (messageData) => {
  if (editingMessageId.value) {
    try {
      if (router.currentRoute.value.params.channelId) {
        const editedMessage = await store.dispatch('messages/editChannelMessage', {
          channelId: router.currentRoute.value.params.channelId,
          messageId: editingMessageId.value,
          content: messageData.content
        });
        sendChannelMessageEdit(editedMessage.channelId, editedMessage._id, editedMessage.content);
      } else if (router.currentRoute.value.params.conversationId) {
        const editedMessage = await store.dispatch('messages/editConversationMessage', {
          conversationId: router.currentRoute.value.params.conversationId,
          messageId: editingMessageId.value,
          content: messageData.content
        });
        sendConversationMessageEdit(editedMessage.conversationId, editedMessage._id, editedMessage.content);
      }
      editingMessageId.value = null;
      hoveredMessage.value = null;
      showHoverMenu.value = false;
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  }
};

const handleSendMessage = async (messageData) => {
  try {
    if (router.currentRoute.value.params.channelId) {
      // Handle channel message
      const messageResponse = await store.dispatch('messages/sendChannelMessage', {
        content: messageData.content,
        channelId: router.currentRoute.value.params.channelId,
        user: store.state.auth.user.user._id,
        threadId: messageData.threadId || null,
        attachments: messageData.attachments || [],
        type: 'channel'
      });
      sendRealtimeMessage(messageResponse);
    } else if (router.currentRoute.value.params.conversationId) {
      // Handle conversation message
      const messageResponse = await store.dispatch('messages/sendConversationMessage', {
        conversationId: router.currentRoute.value.params.conversationId,
        content: messageData.content,
        type: 'conversation',
        attachments: messageData.attachments || []
      });
      sendConversationMessage(messageResponse);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const handleAddReaction = async (emoji, messageId) => {
  if (hoveredMessage.value) {
    const message = hoveredMessage.value;
    const token = store.state.auth.token;
    
    if (router.currentRoute.value.params.channelId) {
      const currentChannel = store.state.channels.currentChannel._id;
      const addedReaction = await store.dispatch('messages/addReaction', { 
        messageId: message._id, 
        reaction: emoji, 
        token, 
        currentChannel 
      });
      sendReaction(message._id, addedReaction, currentChannel);
    } else if (router.currentRoute.value.params.id) {
      const conversationId = router.currentRoute.value.params.id;
      const addedReaction = await store.dispatch('conversations/addReaction', { 
        messageId: message._id, 
        reaction: emoji, 
        token, 
        conversationId 
      });
      sendReaction(message._id, addedReaction, conversationId);
    }
  }
};

const handleRemoveReaction = async (emoji, messageId) => {
  const message = hoveredMessage.value;
  const currentUserId = store.state.auth.user.user._id;
  const token = store.state.auth.token;
  
  if (hoveredMessage.value) {
    const reaction = message.reactions.find(
      r => r.user === currentUserId && r.emoji === emoji
    );
    
    if (router.currentRoute.value.params.channelId) {
      const currentChannel = store.state.channels.currentChannel._id;
      await store.dispatch('messages/removeReaction', { 
        messageId: message._id, 
        reactionId: reaction._id, 
        token, 
        currentChannel 
      });
      sendReactionRemoved(message._id, reaction, currentChannel);
    } else if (router.currentRoute.value.params.id) {
      const conversationId = router.currentRoute.value.params.id;
      await store.dispatch('conversations/removeReaction', { 
        messageId: message._id, 
        reactionId: reaction._id, 
        token, 
        conversationId 
      });
      sendReactionRemoved(message._id, reaction, conversationId);
    }
  }
};

const handleReply = () => {
  if (hoveredMessage.value) {
    store.dispatch('messages/setActiveThread', hoveredMessage.value);
    showHoverMenu.value = false;
  }
};

const hasUserReacted = (reaction) => {
  const currentUserId = store.state.auth.user.id;
  return reaction.users?.includes(currentUserId);
};

// Add thread-related computed and methods
const getThreadCount = (message) => {
  return store.getters['messages/getThreadReplyCount'](message._id);
};

// Add a computed property for thread replies
const getThreadReplies = (messageId) => {
  return store.getters['messages/getThreadReplies'](messageId);
};

// Add scrollToBottom function
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// Add currentChannel computed property
const currentChannel = computed(() => store.getters['channels/currentChannel']);

// Update the watch section to handle both channel and conversation changes
watch([() => messages.value, () => currentChannel.value], () => {
  // Only scroll to bottom for new messages, not when loading older ones
  if (!isLoadingMore.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
}, { deep: true });

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Add styles for default avatar
const styles = `
.default-avatar {
  background-color: #4B4B4B;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}
`;

// Handle scroll for infinite loading
const handleScroll = async () => {
  if (!messageListRef.value || isLoadingMore.value || !hasMore.value) return;
  
  const { scrollTop } = messageListRef.value;
  // If we're near the top (100px threshold), load more messages
  if (scrollTop < 100) {
    isLoadingMore.value = true;
    try {
      const channelId = router.currentRoute.value.params.channelId;
      const conversationId = router.currentRoute.value.params.conversationId;

      if (channelId) {
        await store.dispatch('messages/fetchChannelMessages', {
          channelId,
          cursor: nextCursor.value
        });
      } else if (conversationId) {
        await store.dispatch('messages/fetchConversationMessages', {
          conversationId,
          cursor: nextCursor.value
        });
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      isLoadingMore.value = false;
    }
  }
};

// Add and remove scroll event listener
onMounted(() => {
  messageListRef.value?.addEventListener('scroll', handleScroll);
  scrollToBottom();
});

onUnmounted(() => {
  messageListRef.value?.removeEventListener('scroll', handleScroll);
});

// Add these helper methods
const getLastReply = (message) => {
  const replies = getThreadReplies(message._id);
  return replies[replies.length - 1];
};

const getLastReplyUser = (message) => {
  const lastReply = getLastReply(message);
  return lastReply?.user;
};
</script>

<style scoped>
.message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

.message {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  margin: -4px -8px 16px -8px;
  border-radius: 6px;
  position: relative;
}

.message-hovered {
  background-color: rgba(255, 255, 255, 0.02);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.message-content {
  flex: 1;
  position: relative;
  min-height: 36px;
}

.message-header {
  margin-bottom: 4px;
}

.username {
  font-weight: 700;
  color: #FFFFFF;
}

.timestamp {
  margin-left: 8px;
  color: #ABABAD;
  font-size: 12px;
}

.message-text {
  color: #D1D2D3;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-reactions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.reaction {
  background-color: #222529;
  border: 1px solid #4B4B4B;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #D1D2D3;
  cursor: pointer;
}

.reaction:hover {
  border-color: #ABABAD;
  background-color: #27242C;
}

.reaction-active {
  background-color: rgba(18, 100, 163, 0.1);
  border-color: #1264A3;
  color: #FFFFFF;
}

.reaction-active:hover {
  background-color: rgba(18, 100, 163, 0.2);
  border-color: #1264A3;
}

.no-messages {
  text-align: center;
  color: #ABABAD;
  padding: 40px 0;
}

.message-edit {
  margin: 4px 0;
}

.hover-menu-bottom-right {
  position: absolute;
  top: -16px;
  right: 8px;
  z-index: 100;
  display: flex;
  gap: 4px;
  padding: 4px;
}

.thread-count {
  display: inline-flex;
  align-items: center;
  color: #1264A3;
  font-size: 12px;
  margin-top: 4px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.thread-count:hover {
  background-color: rgba(18, 100, 163, 0.1);
  text-decoration: underline;
}

.load-more-trigger {
  height: 20px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-indicator {
  text-align: center;
  padding: 10px;
  color: #ABABAD;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-bottom: 10px;
}

.message-status {
  margin-left: 8px;
  color: #ABABAD;
  font-size: 12px;
}

.message-type-channel {
  /* Add any specific styling for channel messages */
}

.message-type-conversation {
  /* Add any specific styling for conversation messages */
}

.message-type-thread {
  /* Add any specific styling for thread messages */
}

.thread-info {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: rgba(79, 84, 92, 0.16);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.thread-info:hover {
  background-color: rgba(79, 84, 92, 0.24);
}

.thread-preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thread-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thread-count {
  color: #00A8FC;
  font-size: 0.75rem;
  font-weight: 500;
}

.thread-timestamp {
  color: #B5BAC1;
  font-size: 0.75rem;
}

.thread-preview {
  padding-left: 24px;
}

.thread-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.thread-preview .default-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 8px;
}

.thread-preview-text {
  color: #B5BAC1;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>