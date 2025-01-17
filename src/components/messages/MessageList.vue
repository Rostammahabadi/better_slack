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
          <span class="username">{{ message.user?.displayName || '' }}</span>
          <span class="timestamp" :title="getFullTimestamp(message.createdAt)">
            {{ formatTimestamp(message.createdAt) }}
            <span v-if="message.edited" class="edited-indicator">(edited)</span>
          </span>
          <!-- <MessageStatus :status="message.status" /> -->
        </div>
        <div v-if="editingMessageId === message._id" class="message-edit">
          <TextEditor 
            placeholder="Edit message..."
            :message="message"
            @edit-message="handleEditComplete"
            @send-message="handleSendMessage"
            @cancel="handleCancelEdit"
          />
        </div>
        <div v-else class="message-text" v-html="formatMessageContent(message.content)">
        </div>
        <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
          <button 
            v-for="reaction in groupedReactions(message)" 
            :key="reaction.emoji" 
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
          v-if="showHoverMenu && hoveredMessage?._id === message._id && message.type !== 'bot'"
          @add-reaction="(emoji) => handleAddReaction(emoji, message._id)"
          @reply="handleReply"
          @menu-hover="cancelHideMenu"
          @menu-leave="startHideMenu"
          @edit="() => handleEdit(message)"
          :is-owner="message.user?._id === store.state.auth.user?._id"
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
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

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
  sendChannelReaction,
  sendConversationReaction,
  sendChannelReactionRemoved,
  sendConversationReactionRemoved,
  sendConversationMessage,
  sendChannelMessage,
  sendChannelMessageEdit,
  sendConversationMessageEdit,
  sendChannelThreadReply,
  sendConversationThreadReply
} = useSocket(store);

// Initialize marked with options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return code;
  }
});

// Computed properties for messages and pagination
const messages = computed(() => {
  const channelId = router.currentRoute.value.params.channelId;
  const conversationId = router.currentRoute.value.params.conversationId;

  if (channelId) {
    return store.getters['messages/getChannelMessages'](channelId);
  } else if (router.currentRoute.value.name === 'bot-conversation') {
    return store.getters['chatbot/messages']
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
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();
  
  const time = date.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (isToday) {
    return `Today at ${time}`;
  } else if (isYesterday) {
    return `Yesterday at ${time}`;
  } else if (isThisYear) {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
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
      if (messageData.threadId) {
        // This is a thread reply
        const messageResponse = await store.dispatch('messages/sendThreadReply', {
          message: {
            content: messageData.content,
            channelId: router.currentRoute.value.params.channelId,
            user: store.state.auth.user.user._id,
            threadId: messageData.threadId,
            type: 'thread'
          }
        });
        sendChannelThreadReply(
          router.currentRoute.value.params.channelId,
          messageData.threadId,
          messageResponse
        );
      } else {
        // Regular channel message
        const messageResponse = await store.dispatch('messages/sendChannelMessage', {
          content: messageData.content,
          channelId: router.currentRoute.value.params.channelId,
          user: store.state.auth.user.user._id,
          threadId: messageData.threadId || null,
          attachments: messageData.attachments || [],
          type: 'channel'
        });
        sendChannelMessage(messageResponse);
      }
    } else if (router.currentRoute.value.params.conversationId) {
      // Handle conversation message
      if (messageData.threadId) {
        // This is a thread reply
        const messageResponse = await store.dispatch('messages/sendThreadReply', {
          message: {
            content: messageData.content,
            conversationId: router.currentRoute.value.params.conversationId,
            user: store.state.auth.user.user._id,
            threadId: messageData.threadId,
            type: 'thread'
          }
        });
        sendConversationThreadReply(
          router.currentRoute.value.params.conversationId,
          messageData.threadId,
          messageResponse
        );
      } else {
        // Regular conversation message
        const messageResponse = await store.dispatch('messages/sendConversationMessage', {
          conversationId: router.currentRoute.value.params.conversationId,
          content: messageData.content,
          type: 'conversation',
          attachments: messageData.attachments || []
        });
        sendConversationMessage(messageResponse);
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const handleAddReaction = async (emoji, messageId) => {
  if (hoveredMessage.value) {
    const message = hoveredMessage.value
    const token = store.state.auth.token;
    if (router.currentRoute.value.params.channelId) {
      const currentChannel = store.state.channels.currentChannel._id;
      const addedReaction = await store.dispatch('messages/addChannelReaction', { 
        messageId: message._id, 
        reaction: emoji, 
        token, 
        currentChannel 
      });
      sendChannelReaction(message._id, addedReaction, currentChannel);
    } else if (router.currentRoute.value.params.conversationId) {
      const conversationId = router.currentRoute.value.params.conversationId;
      const addedReaction = await store.dispatch('conversations/addReaction', { 
        messageId: message._id, 
        reaction: emoji, 
        token, 
        conversationId 
      });
      sendConversationReaction(message._id, addedReaction, conversationId);
    }
  }
};

const handleRemoveReaction = async (emoji, messageId) => {
  const message = hoveredMessage.value;
  const currentUserId = store.state.auth.user._id;
  const token = store.state.auth.token;
  
  if (hoveredMessage.value) {
    const reaction = message.reactions.find(
      r => r.user === currentUserId && r.emoji === emoji
    );
    if (reaction == undefined) {
      handleAddReaction(emoji, message._id);
      return;
    }
    if (router.currentRoute.value.params.channelId) {
      const currentChannel = store.state.channels.currentChannel._id;
      await store.dispatch('messages/removeChannelReaction', { 
        messageId: message._id, 
        reactionId: reaction._id, 
        token, 
        currentChannel 
      });
      sendChannelReactionRemoved(message._id, reaction, currentChannel);
    } else if (router.currentRoute.value.params.conversationId) {
      const conversationId = router.currentRoute.value.params.conversationId;
      await store.dispatch('conversations/removeConversationReaction', { 
        messageId: message._id, 
        reactionId: reaction._id, 
        token, 
        conversationId 
      });
      sendConversationReactionRemoved(message._id, reaction, conversationId);
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
  const currentUserId = store.state.auth.user._id;
  return reaction.users.has(currentUserId);
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

// Add method to format message content
const formatMessageContent = (content) => {
  if (!content) return '';
  // Parse markdown and sanitize HTML
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
};

const groupedReactions = (message) => {
  if (!message.reactions || !message.reactions.length) return [];
  
  const groups = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: new Set()
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.add(reaction.user);
    return acc;
  }, {});
  
  return Object.values(groups);
};

// Add new method for full timestamp tooltip
const getFullTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
</script>

<style scoped>
/* Bot specific styles */
.message-type-bot .message-text {
  color: #FFFFFF !important;
}

.message-type-bot .username {
  color: #FFFFFF !important;
}

.message-type-bot .timestamp {
  color: rgba(255, 255, 255, 0.7) !important;
}

.message-type-bot .avatar {
  background-color: #5865F2 !important;
  border-radius: 50% !important ;
}

/* Message formatting styles */
.message-text {
  color: #E5E7EB;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-text p {
  margin: 0 0 8px 0;
}

.message-text p:last-child {
  margin-bottom: 0;
}

/* Code blocks */
.message-text pre {
  background-color: #2D3139;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.message-text code {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background-color: #2D3139;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Inline formatting */
.message-text strong {
  font-weight: 600;
}

.message-text em {
  font-style: italic;
}

.message-text del {
  text-decoration: line-through;
}

/* Lists */
.message-text ul, .message-text ol {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text li {
  margin: 4px 0;
}

/* Blockquotes */
.message-text blockquote {
  border-left: 4px solid #4B4B4B;
  margin: 8px 0;
  padding: 4px 12px;
  color: #9CA3AF;
}

/* Links */
.message-text a {
  color: #1264A3;
  text-decoration: none;
}

.message-text a:hover {
  text-decoration: underline;
}

/* Tables */
.message-text table {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.message-text th,
.message-text td {
  border: 1px solid #4B4B4B;
  padding: 6px 12px;
  text-align: left;
}

.message-text th {
  background-color: #2D3139;
  font-weight: 600;
}

/* Task lists */
.message-text input[type="checkbox"] {
  margin-right: 6px;
}

/* Syntax highlighting overrides */
.hljs {
  background: transparent !important;
  padding: 0 !important;
}

.timestamp {
  font-size: 12px;
  color: #9CA3AF;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.timestamp:hover {
  background-color: rgba(156, 163, 175, 0.1);
  color: #E5E7EB;
}

.edited-indicator {
  font-size: 11px;
  color: #9CA3AF;
  font-style: italic;
}
</style>

<style scoped>
.message-list {
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

.message {
  display: flex;
  gap: 12px;
  padding: 8px;
  margin-bottom: 16px;
  border-radius: 8px;
  position: relative;
}

.message-hovered {
  background-color: rgba(255, 255, 255, 0.02);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: #2C2F33;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
}

.message-content {
  flex: 1;
  min-width: 0;
  position: relative;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.username {
  font-weight: 600;
  color: #FFFFFF;
}

.timestamp {
  font-size: 12px;
  color: #9CA3AF;
}

.message-text {
  color: #E5E7EB;
  word-wrap: break-word;
  white-space: pre-wrap;
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
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  gap: 4px;
  padding: 4px;
  transform: translateY(-50%);
  background-color: #1A1D21;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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

.message-type-bot {
  background-color: rgba(88, 101, 242, 0.2);
}

.message-type-bot .message-content {
  color: #5865F2;
}

.message-type-bot .username {
  color: #5865F2;
  font-weight: 600;
}

.message-type-bot .timestamp {
  color: #7984F5;
}

.message-type-bot .message-text {
  color: #2C2F33;
  margin-top: 4px;
}

.message-type-bot .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
</style>