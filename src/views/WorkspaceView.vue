<template>
  <div v-if="error" class="error">
    {{ error }}
  </div>
  <WorkspaceLayout v-else>
    <div class="channel-content">
      <div class="channel-header">
        <div class="channel-info">
          <h2 class="channel-name">
            <span class="prefix">{{ currentChannel ? '#' : '@' }}</span>
            {{ currentChannel?.name || currentDirectMessage?.user.displayName || currentWorkspace?.name }}
          </h2>
        </div>
        <div class="channel-description">
          {{ currentChannel?.description || 
             (currentDirectMessage ? 'Direct message conversation' : 
             'Share announcements and updates about company news, upcoming events, or teammates who deserve some kudos. ⭐') }}
        </div>
      </div>
      
      <MessageList @reply="handleReply"/>

      <div class="message-input">
        <TextEditor @send-message="sendMessage" />
      </div>
    </div>
  </WorkspaceLayout>
</template>


<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import WorkspaceLayout from '../components/workspace/WorkspaceLayout.vue';
import MessageList from '../components/messages/MessageList.vue';
import TextEditor from '../components/TextEditor.vue';
import { useSocket } from '../services/socketService';
const {
  joinChannel,
  sendRealtimeMessage,
  connect
} = useSocket();

const route = useRoute();
const router = useRouter();
const store = useStore();
// Computed properties from store
const currentWorkspace = computed(() => store.getters['workspaces/currentWorkspace']);
const currentChannel = computed(() => store.getters['channels/currentChannel']);

const currentDirectMessage = computed(() => store.getters['messages/currentDirectMessage']);

const error = computed(() => 
  store.getters['workspaces/error'] || 
  store.getters['channels/error'] || 
  store.getters['messages/error']
);
const token = computed(() => store.getters['auth/token']);
const currentUser = computed(() => store.getters['auth/currentUser']);
// Initialize workspace data
onMounted(async () => {
  connect(localStorage.getItem('auth_token'));
  try {
    const workspaceId = route.params.workspaceId;
    await store.dispatch('workspaces/fetchWorkspace', { 
      workspaceId, 
      token: token.value 
    });
    
    // Fetch channels for the workspace
    await store.dispatch('channels/fetchChannels', {
      workspaceId,
      token: token.value
    });
    
    // If there's a channelId in the route, set it as current and fetch messages
    if (route.params.channelId) {
      const channel = store.getters['channels/getChannelById'](route.params.channelId);
      if (channel) {
        // come back to
        // Fetch messages for the channel
        await store.dispatch('messages/fetchMessages', {
          channelId: channel.id,
          token: token.value
        });
        store.dispatch('channels/setCurrentChannel', {
          channel: store.getters['channels/getChannelById'](route.params.channelId),
        });
      }
    }
  } catch (err) {
    if (err.message === 'No access token available') {
      router.push('/login');
    }
  }
});

// Watch for channel changes to update URL and load messages
watch(() => route.params.channelId, async (newChannel, oldChannel) => {
    joinChannel(newChannel, currentUser.value);
  if (newChannel && newChannel !== oldChannel) {
    const channel = store.getters['channels/getChannelById'](newChannel);   
    // Fetch messages for the new channel
    await store.dispatch('messages/fetchMessages', {
      channelId: newChannel,
      token: token.value
    });
  }
});


// Send message function
const sendMessage = async (messageData) => {
  if (!messageData.content.trim()) return;
  
  try {
    if (currentChannel.value) {
      const message = {
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
        updatedAt: new Date().toISOString()
      };
      const messageResponse = await store.dispatch('messages/sendMessage', {
        message,
        token: token.value
      });
      sendRealtimeMessage(messageResponse);
    } else if (currentDirectMessage.value) {
      // Handle direct messages similarly
      const message = {
        content: messageData.content,
        channelId: currentDirectMessage.value._id,
        user: currentUser.value._id,
        threadId: messageData.threadId || null,
        attachments: messageData.attachments || [],
        status: 'sent',
        reactions: [],
        edited: false,
        editHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await store.dispatch('messages/sendDirectMessage', {
        message,
        token: token.value
      });
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #ABABAD;
}

.error {
  color: red;
  text-align: center;
  padding: 2rem;
}

.channel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.channel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #4B4B4B;
  flex-shrink: 0;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.channel-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
}

.add-bookmark {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.channel-description {
  color: #ABABAD;
  font-size: 14px;
}

.message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
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
}

.message-input {
  padding: 20px;
  flex-shrink: 0;
  border-top: 1px solid #4B4B4B;
  background-color: #1A1D21;
}

.input-container {
  border: 1px solid #565856;
  border-radius: 8px;
  background-color: #222529;
}

.formatting-bar {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #565856;
}

.formatting-bar button {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: none;
  border: none;
  color: #FFFFFF;
  resize: none;
}

textarea:focus {
  outline: none;
}

.input-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #565856;
}

.input-actions button {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.prefix {
  color: #ABABAD;
}
</style> 