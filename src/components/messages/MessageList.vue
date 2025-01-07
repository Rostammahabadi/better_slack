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
      <img :src="message?.user?.avatarUrl" alt="User avatar" class="avatar" />
      <div class="message-content">
        <div class="message-header">
          <span class="username">{{ message?.user?.displayName }}</span>
          <span class="timestamp">{{ formatTimestamp(message.createdAt) }}</span>
        </div>
        <div class="message-text">
          {{ message.content }}
        </div>
        <div v-if="message.reactions?.length" class="message-reactions">
          <div v-for="reaction in message.reactions" 
               :key="reaction.id" 
               class="reaction">
            {{ reaction.emoji }} {{ reaction.count }}
          </div>
        </div>
        
        <!-- Message Hover Menu -->
        <MessageHoverMenu
          v-if="showHoverMenu && hoveredMessage?._id === message._id"
          @add-reaction="handleAddReaction"
          @reply="handleReply"
          @menu-hover="cancelHideMenu"
          @menu-leave="startHideMenu"
        />
      </div>
    </div>
    <div v-if="!messages.length" class="no-messages">
      No messages yet. Start the conversation! 💬
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue';
import MessageHoverMenu from './MessageHoverMenu.vue';
import { useStore } from 'vuex';

const messageListRef = ref(null);
const hoveredMessage = ref(null);
const showHoverMenu = ref(false);
let hideMenuTimeout = null;
const store = useStore();

const props = defineProps({
  messages: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Watch for changes in messages array
watch(() => props.messages, () => {
  // Wait for DOM update before scrolling
  setTimeout(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  }, 0);
}, { deep: true });

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

const handleAddReaction = (emoji) => {
  if (hoveredMessage.value) {
    // Add the reaction to the message
    const message = hoveredMessage.value;
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      existingReaction.count++;
    } else {
      if (!message.reactions) {
        message.reactions = [];
      }
      message.reactions.push({
        id: Date.now(),
        emoji: emoji,
        count: 1,
        users: [store.state.auth.user.id] // Add the current user's ID
      });
    }
  }
};

const handleReply = () => {
  if (hoveredMessage.value) {
    // TODO: Implement reply logic
    console.log('Reply to message:', hoveredMessage.value.id);
  }
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
}

.message-hovered {
  background-color: rgba(255, 255, 255, 0.02);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
}

.message-content {
  flex: 1;
  position: relative;
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

.no-messages {
  text-align: center;
  color: #ABABAD;
  padding: 40px 0;
}
</style>