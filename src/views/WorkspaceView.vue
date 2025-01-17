<template>
  <div v-if="error" class="error">
    {{ error }}
  </div>
  <WorkspaceLayout v-else>
    <div 
      class="channel-content"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <!-- File Upload Overlay -->
      <div v-if="isDraggingFile" class="file-upload-overlay">
        <div class="upload-indicator">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div class="upload-text">
            Upload to {{ currentChannel?.name || currentWorkspace?.name }}
          </div>
          <div class="upload-subtext">
            Hold Shift to share immediately
          </div>
        </div>
      </div>

      <div class="channel-header">
        <div class="channel-info">
          <h2 class="channel-name">
            <span class="prefix">{{ headerPrefix }}</span>
            {{ headerName }}
          </h2>
          <div class="channel-actions" v-if="currentChannel && (currentChannel.type === 'public' || (currentChannel.type === 'private' && currentChannel.createdBy === currentUser?._id))">
            <button 
              class="action-button"
              @click="showAddUsersModal = true"
              title="Add people to channel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Add people</span>
            </button>
          </div>
        </div>
        <div class="channel-description">
          {{ headerDescription }}
        </div>
      </div>
      
      <MessageList/>

      <div class="message-input">
        <TextEditor 
          @send-message="sendMessage" 
          @edit-message="editMessage"
          :placeholder="getPlaceholder"
          :messages="messages"
        />
      </div>
    </div>

    <!-- Add Channel Users Modal -->
    <AddChannelUsersModal
      v-if="showAddUsersModal && currentChannel"
      :channelId="currentChannel._id"
      @close="showAddUsersModal = false"
    />
  </WorkspaceLayout>
</template>


<script setup>
import { computed, onMounted, onUnmounted, watch, ref, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import WorkspaceLayout from '../components/workspace/WorkspaceLayout.vue';
import MessageList from '../components/messages/MessageList.vue';
import TextEditor from '../components/TextEditor.vue';
import { useSocket } from '../services/socketService';
import AddChannelUsersModal from '../components/modals/AddChannelUsersModal.vue';
const store = useStore();
const auth0 = inject('auth0');
const {
  joinChannel,
  leaveChannel,
  sendChannelMessage,
  sendConversationMessage,
  connect,
  activateBot,
  sendWorkspaceJoined,
  sendWorkspaceLeft,
  sendConversationConnected,
  sendConversationLeft,
  sendChannelMessageEdit,
  sendBotMessage
} = useSocket(store);

const route = useRoute();
const router = useRouter();

// Update computed properties
const currentWorkspace = computed(() => store.getters['workspaces/currentWorkspace']);
const currentChannel = computed(() => store.getters['channels/currentChannel']);
const botLoading = computed(() => store.getters['chatbot/loading']);
const currentConversation = computed(() => store.getters['conversations/getCurrentConversation']);
const currentDirectMessage = computed(() => {
  if (route.params.conversationId) {
    return currentConversation.value;
  }
  return null;
});

const error = computed(() => 
  store.getters['workspaces/error'] || 
  store.getters['channels/error'] || 
  store.getters['messages/error']
);

const currentUser = computed(() => store.getters['auth/currentUser']);
// Initialize workspace data
onMounted(async () => {
  try {
    const workspaceId = route.params.workspaceId;
    const token = await auth0.getTokenSilently();
    await store.dispatch('auth/setToken', { token, expiresIn: 3600 });
    
    // Fetch all data in parallel
    await Promise.all([
      store.dispatch('workspaces/fetchWorkspace', { workspaceId, token }),
      store.dispatch('channels/fetchChannels', { workspaceId, token }),
      store.dispatch('conversations/fetchConversations'),
      store.dispatch('auth/fetchUser', token)
    ]);

    // Only connect socket after all data is loaded
    connect(token);

    // If there's a channelId in the route, set it as current and fetch messages
    if (route.params.channelId) {
      const channel = store.getters['channels/getChannelById'](route.params.channelId);
      if (channel) {
        await store.dispatch('messages/fetchChannelMessages', {
          channelId: channel._id,
          token
        });
        store.dispatch('channels/setCurrentChannel', {
          channel: store.getters['channels/getChannelById'](route.params.channelId),
        });
        joinChannel(channel._id, currentUser.value);
      }
    } else if (route.name === 'bot-conversation') {
      // Clear current channel and conversation
      store.dispatch('channels/clearCurrentChannel');
      store.commit('conversations/setCurrentConversation', null);
      
      // Activate bot and fetch messages
      activateBot(currentUser.value._id);
      await store.dispatch('chatbot/fetchConversation', currentWorkspace.value._id);
    }
  } catch (err) {
    if (err.message === 'No access token available') {
      router.push('/login');
    }
  }
});

onUnmounted(() => {
  // Notify that we're leaving the workspace
  if (currentWorkspace.value) {
    sendWorkspaceLeft(currentWorkspace.value._id, currentUser.value);
  }
});

// Watch for channel changes
watch(() => route.params.channelId, async (newChannel, oldChannel) => {
  if (oldChannel) {
    // Leave the old channel
    leaveChannel(oldChannel);
  }
  
  // If we were in a conversation, leave it
  if (route.params.conversationId) {
    sendConversationLeft(route.params.conversationId, currentUser.value);
  }

  if (newChannel) {
    // Clear current conversation and thread when switching to a channel
    store.commit('conversations/setCurrentConversation', null);
    store.dispatch('messages/setActiveThread', null);
    
    // Join the new channel
    joinChannel(newChannel, currentUser.value);
    
    if (newChannel !== oldChannel) {
      const channel = store.getters['channels/getChannelById'](newChannel);
      const token = await auth0.getTokenSilently();   
      await store.dispatch('messages/fetchChannelMessages', {
        channelId: newChannel,
        token,
        limit: 30
      });
    }
  }
});

// Watch for conversation changes
watch(() => route.params.conversationId, async (newConversationId, oldConversationId) => {
  if (oldConversationId) {
    // Leave the old conversation
    sendConversationLeft(oldConversationId, currentUser.value);
  }
  
  // If we were in a channel, leave it
  if (route.params.channelId) {
    leaveChannel(route.params.channelId);
  }

  if (newConversationId) {
    // Clear current channel and thread when switching to a conversation
    store.dispatch('channels/setCurrentChannel', {channel: null});
    store.dispatch('messages/setActiveThread', null);
    
    // Join the new conversation
    sendConversationConnected(newConversationId, currentUser.value);
    
    try {
      const token = await auth0.getTokenSilently();
      // First fetch the conversation details
      await store.dispatch('conversations/fetchConversation', newConversationId);
      
      // Then fetch messages
      await store.dispatch('messages/fetchConversationMessages', {
        conversationId: newConversationId,
        token,
        limit: 30
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }
});

// Watch for workspace changes
watch(() => route.params.workspaceId, async (newWorkspaceId, oldWorkspaceId) => {
  if (newWorkspaceId && newWorkspaceId !== oldWorkspaceId) {
    try {
      // Leave current channel if one is active
      if (currentChannel.value?._id) {
        leaveChannel(currentChannel.value._id);
      }

      const token = await auth0.getTokenSilently();
      // Fetch all data in parallel for new workspace
      await Promise.all([
        store.dispatch('workspaces/fetchWorkspace', { workspaceId: newWorkspaceId, token }),
        store.dispatch('channels/fetchChannels', { workspaceId: newWorkspaceId, token }),
        store.dispatch('conversations/fetchConversations')
      ]);
      store.dispatch('channels/clearCurrentChannel');
    } catch (error) {
      console.error('Error loading workspace:', error);
    }
  }
});

// Add a watch for bot conversation route
watch(() => route.name, async (newRouteName, oldRouteName) => {
  if (newRouteName === 'bot-conversation') {
    // Clear current channel and conversation
    store.dispatch('channels/clearCurrentChannel');
    store.commit('conversations/setCurrentConversation', null);
  }
});

// Send message function
const sendMessage = async (messageData) => {
  if (!messageData.content.trim()) return;

  try {
    if (currentChannel.value) {
      const messageResponse = await store.dispatch('messages/sendChannelMessage', {
        content: messageData.content,
        channelId: currentChannel.value._id,
        user: currentUser.value._id,
        threadId: messageData.threadId || null,
        attachments: messageData.attachments || [],
        status: 'sent',
        reactions: [],
        edited: false,
        editHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'channel',
        attachments: messageData.attachments || []
      });
      sendChannelMessage(messageResponse);
    } else if (route.name === 'bot-conversation') {
      // Set loading state
      await store.dispatch('chatbot/setLoading', true);
      
      // Create the message object
      const fullMessage = {
        content: messageData.content,
        user: currentUser.value._id,
        type: 'bot',
        status: 'sent',
        createdAt: new Date().toISOString()
      };

      // Add message to store and send via socket
      await store.dispatch('chatbot/addMessage', fullMessage);
      sendBotMessage(messageData.content, currentUser.value._id, currentWorkspace.value._id);
    } else if (route.params.conversationId) {
      const messageResponse = await store.dispatch('messages/sendConversationMessage', {
        conversationId: route.params.conversationId,
        content: messageData.content,
        type: 'conversation',
        attachments: messageData.attachments || []
      });
      sendConversationMessage(messageResponse);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    await store.dispatch('chatbot/setLoading', false);
  }
};

// Add drag state
const isDraggingFile = ref(false);
let dragCounter = 0;

// Drag event handlers
const handleDragEnter = (e) => {
  dragCounter++;
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    isDraggingFile.value = true;
  }
};

const handleDragLeave = () => {
  dragCounter--;
  if (dragCounter === 0) {
    isDraggingFile.value = false;
  }
};

const handleDrop = (e) => {
  dragCounter = 0;
  isDraggingFile.value = false;
  // Handle file drop here
  const files = Array.from(e.dataTransfer.files);
  // TODO: Implement file upload logic
};

// Add computed property for placeholder
const getPlaceholder = computed(() => {
  if (route.name === 'bot-conversation') {
    return 'Message Chatbot...';
  } else if (currentChannel.value) {
    return `Message #${currentChannel.value.name}`;
  } else if (currentConversation.value) {
    if (currentConversation.value.participants.length === 2) {
      const otherUser = currentConversation.value.participants.find(p => p._id !== currentUser.value._id);
      return `Message @${otherUser?.displayName || 'Loading...'}`;
    } else {
      return `Message ${currentConversation.value.participants.length} people`;
    }
  }
  return 'Type a message...';
});

// Add new computed properties for header display
const headerPrefix = computed(() => {
  if (currentChannel.value) return '#';
  if (currentConversation.value) return '@';
  return '';
});

const headerName = computed(() => {
  if (currentChannel.value) {
    return currentChannel.value.name;
  } else if (currentConversation.value?.participants) {
    if (currentConversation.value.participants.length === 2) {
      const otherParticipant = currentConversation.value.participants.find(p => p._id !== currentUser.value._id);
      return otherParticipant?.displayName || 'Loading...';
    } else {
      return currentConversation.value.participants
        .filter(p => p._id !== currentUser.value._id)
        .map(p => p.displayName)
        .join(', ') || 'Loading...';
    }
  }
  return currentWorkspace.value?.name || 'Loading...';
});

const headerDescription = computed(() => {
  if (currentChannel.value) {
    return currentChannel.value.description || '';
  } else if (currentConversation.value?.participants) {
    const participantCount = currentConversation.value.participants.length;
    if (participantCount === 2) {
      return 'Direct Message';
    } else {
      return `${participantCount} members`;
    }
  }
  return '';
});

const editMessage = async (messageData) => {
  try {
    if (route.params.channelId) {
      const messageResponse = await store.dispatch('messages/editChannelMessage', {
        channelId: route.params.channelId,
        messageId: messageData.messageId,
        content: messageData.content
      });
      sendChannelMessageEdit(
        route.params.channelId,
        messageData.messageId,
        messageResponse
      );
    } else if (route.params.conversationId) {
      const messageResponse = await store.dispatch('messages/editConversationMessage', {
        conversationId: route.params.conversationId,
        messageId: messageData.messageId,
        content: messageData.content
      });
      sendConversationMessage({
        ...messageResponse,
        type: 'conversation',
        action: 'edit'
      });
    }
  } catch (error) {
    console.error('Error editing message:', error);
  }
};

// Add computed property for messages
const messages = computed(() => {
  if (route.name === 'bot-conversation') {
    return store.getters['chatbot/messages'];
  } else if (currentChannel.value) {
    return store.getters['messages/getChannelMessages'](currentChannel.value._id) || [];
  } else if (currentConversation.value) {
    return store.getters['messages/getConversationMessages'](currentConversation.value._id) || [];
  }
  return [];
});

const showAddUsersModal = ref(false);
</script>

<style scoped>
.error {
  color: #E01E5A;
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.channel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: #1A1D21;
}

.channel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #4B4B4B;
  background-color: #1A1D21;
  flex-shrink: 0;
}

.channel-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.channel-name {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
}

.prefix {
  color: #ABABAD;
}

.channel-description {
  margin-top: 4px;
  font-size: 14px;
  color: #ABABAD;
}

.message-input {
  padding: 20px;
  border-top: 1px solid #4B4B4B;
  background-color: #1A1D21;
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 10;
}

.file-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 29, 33, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.upload-indicator {
  text-align: center;
  color: #FFFFFF;
}

.upload-icon {
  color: #1264A3;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.upload-subtext {
  font-size: 14px;
  color: #ABABAD;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .channel-header {
    padding: 12px 16px;
  }

  .channel-name {
    font-size: 16px;
  }

  .channel-description {
    font-size: 13px;
  }

  .message-input {
    padding: 12px;
  }

  .upload-text {
    font-size: 18px;
  }

  .upload-subtext {
    font-size: 13px;
  }

  .upload-icon svg {
    width: 40px;
    height: 40px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .channel-header {
    padding: 10px 12px;
  }

  .channel-name {
    font-size: 15px;
  }

  .channel-description {
    font-size: 12px;
  }

  .message-input {
    padding: 8px;
  }

  .upload-text {
    font-size: 16px;
    padding: 0 20px;
  }

  .upload-icon svg {
    width: 32px;
    height: 32px;
  }
}

/* Touch Device Optimizations */
@media (hover: none) {
  .message-input {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .channel-content {
    padding-bottom: 80px; /* Add space for fixed message input */
  }
}

/* Safe Area Handling for Modern Mobile Devices */
@supports (padding: max(0px)) {
  @media (max-width: 768px) {
    .message-input {
      padding-bottom: max(12px, env(safe-area-inset-bottom));
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
    }
  }
}

.channel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
  color: #D1D2D3;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #2C2D30;
  border-color: #6B6B6B;
  color: #FFFFFF;
}

.action-button svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .action-button span {
    display: none;
  }
  
  .action-button {
    padding: 6px;
  }
}
</style> 