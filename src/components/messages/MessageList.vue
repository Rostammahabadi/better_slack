<template>
  <div class="message-list" ref="messageListRef">
    <div 
      v-for="message in messages" 
      :key="message.id" 
      class="message"
      @mouseover="showMenuForMessage(message)"
      @mouseleave="startHideMenu"
      :class="{ 'message-hovered': hoveredMessage?._id === message._id }"
    >
      <img
        :src="message.user.avatarUrl" 
        :alt="`${message.user.displayName}'s avatar`" 
        class="avatar"
      />
      <div class="message-content">
        <div class="message-header">
          <span class="username">{{ message?.user?.displayName }}</span>
          <span class="timestamp">{{ formatTimestamp(message.createdAt) }}</span>
        </div>
        <div v-if="editingMessageId === message._id" class="message-edit">
          <TextEditor 
            :message="message"
            @send-message="handleEditComplete"
            @cancel="handleCancelEdit"
          />
        </div>
        <div v-else class="message-text">
          {{ message.content }}
        </div>
        <div v-if="message.reactions?.length" class="message-reactions">
          <button 
            v-for="reaction in message.reactions" 
            :key="reaction.id" 
            class="reaction"
            :class="{ 'reaction-active': hasUserReacted(reaction) }"
            @click="handleRemoveReaction(reaction.emoji, message._id)"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </button>
        </div>
        
        <!-- Add Thread Reply Count -->
        <div v-if="getThreadCount(message)" class="thread-count" @click="handleReply">
          {{ getThreadCount(message) }} replies
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
    <div v-if="!messages.length" class="no-messages">
      No messages yet. Start the conversation! 💬
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import MessageHoverMenu from './MessageHoverMenu.vue';
import TextEditor from '../TextEditor.vue';
import { useStore } from 'vuex';
const emit = defineEmits([ 'edit-message']);
const messageListRef = ref(null);
const hoveredMessage = ref(null);
const showHoverMenu = ref(false);
const editingMessageId = ref(null);
let hideMenuTimeout = null;
import { useSocket } from '../../services/socketService';
const store = useStore();
const {
  sendReaction,
  sendReactionRemoved,
  sendEditMessage
} = useSocket(store);

const currentChannel = computed(() => store.getters['channels/currentChannel']);

const currentDirectMessage = computed(() => store.getters['messages/currentDirectMessage']);
const messages = computed(() => {
  if (currentChannel.value) {
    return store.getters['messages/getMessagesByChannel'](currentChannel.value.id);
  } else if (currentDirectMessage.value) {
    return store.getters['messages/getDirectMessages'](currentDirectMessage.value.id);
  }
  return [];
});

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
      const editedMessage = await store.dispatch('messages/updateMessage', {
        _id: editingMessageId.value,
        content: messageData.content,
        channelId: store.state.channels.currentChannel._id,
        token: store.state.auth.token
      });
      sendEditMessage(editedMessage._id, editedMessage.content, editedMessage.channelId);
      editingMessageId.value = null;
      hoveredMessage.value = null;
      showHoverMenu.value = false;
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  }
};

const handleAddReaction = async (emoji, messageId) => {
  if (hoveredMessage.value) {
    const message = hoveredMessage.value;
    const token = store.state.auth.token;
    const currentChannel = store.state.channels.currentChannel._id;
    const addedReaction = await store.dispatch('messages/addReaction', { messageId: message._id, reaction: emoji, token, currentChannel });
    sendReaction(message._id, addedReaction, currentChannel);
  }
};

const handleRemoveReaction = async (emoji, messageId) => {
  const message = hoveredMessage.value;
  const currentUserId = store.state.auth.user.user._id;
  const token = store.state.auth.token;
  const currentChannel = store.state.channels.currentChannel._id;
  const userReactionIndex = message.reactions.findIndex(
      r => r.user === currentUserId && r.emoji === emoji
    );
  const reaction = message.reactions[userReactionIndex];
  if (hoveredMessage.value) {
    await store.dispatch('messages/removeReaction', { messageId: message._id, reactionId: reaction._id, token, currentChannel });
    sendReactionRemoved(message._id, reaction, currentChannel);
  }

};

const handleReply = () => {
  if (hoveredMessage.value) {
    store.dispatch('messages/setActiveThread', hoveredMessage.value);
  }
};

const hasUserReacted = (reaction) => {
  const currentUserId = store.state.auth.user.id;
  return reaction.users?.includes(currentUserId);
};

// Add thread-related computed and methods
const getThreadCount = (message) => {
  return store.getters['messages/getThreadReplies'](message._id)?.length || 0;
};

// Add scrollToBottom function
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// Watch for changes in messages to scroll to bottom
watch(() => messages.value, () => {
  // Use nextTick to ensure DOM is updated before scrolling
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// Watch for changes in currentChannel to scroll to bottom
watch(() => currentChannel.value, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

onMounted(() => {
  scrollToBottom();
});
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
</style>