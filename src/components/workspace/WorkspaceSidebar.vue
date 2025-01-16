<template>
  <div class="sidebar">
    <!-- Workspace Header -->
    <div class="workspace-header">
      <h1 class="workspace-name">{{ storeData.workspace?.name || 'Loading...' }}</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      Loading workspace...
    </div>

    <template v-else>
      <!-- Search Bar -->
      <div class="search-bar">
        <input type="text" placeholder="Search" />
      </div>

      <!-- Channels Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <span class="section-title">Channels</span>
          <button class="add-button" @click="showCreateChannel = true">+</button>
        </div>
        <div class="section-items">
          <div 
            v-for="channel in storeData.channels" 
            :key="channel._id"
            class="section-item"
            :class="{ active: storeData.currentChannel?._id === channel._id }"
            @click="selectChannel(channel)"
            @contextmenu.prevent="showContextMenu($event, channel)"
          >
            <span class="icon">{{ channel.type === 'private' ? '🔒' : '#' }}</span>
            <span>{{ channel.name }}</span>
          </div>
        </div>
      </div>

      <!-- Direct Messages Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <span class="section-title">Direct messages</span>
          <button class="add-button" @click="showNewMessageModal = true">+</button>
        </div>
        <div class="section-items">
          <!-- Pinned Chatbot -->
          <div 
            class="section-item chatbot-item"
            :class="{ active: route.name === 'bot-conversation' }"
            @click="activateChatbot"
          >
            <div class="conversation-avatar">
              <img 
                src="/images/bot.png"
                alt="Chatbot"
                class="user-avatar"
              />
            </div>
            <div class="conversation-info">
              <span>Chatbot</span>
              <span class="bot-status">AI Assistant</span>
            </div>
          </div>

          <!-- Conversation Participants -->
          <div 
            v-for="conversation in filteredParticipants" 
            :key="conversation._id"
            class="section-item"
            :class="{ active: route.params.conversationId === conversation._id }"
            @click="selectConversation(conversation)"
          >
            <div class="conversation-avatar">
              <img 
                v-if="conversation.displayParticipants[0]?.avatarUrl"
                :src="conversation.displayParticipants[0].avatarUrl" 
                :alt="conversation.displayParticipants[0].displayName"
                class="user-avatar"
              />
              <div v-else class="user-avatar-fallback">
                {{ getInitials(conversation.displayParticipants[0]?.displayName) }}
              </div>
            </div>
            
            <div class="conversation-info">
              <span v-if="conversation.displayParticipants.length === 1">
                {{ conversation.displayParticipants[0].displayName }}
              </span>
              <span v-else>
                {{ conversation.displayParticipants[0].displayName }}
                <span class="additional-participants">
                  +{{ conversation.displayParticipants.length - 1 }} others
                </span>
              </span>
            </div>
          </div>

          <button class="invite-button" @click="showInviteModal = true">
            <i class="fas fa-user-plus"></i> Invite People to Workspace
          </button>
        </div>
      </div>
    </template>

    <!-- Create Channel Modal -->
    <CreateChannelModal 
      :show="showCreateChannel"
      @close="showCreateChannel = false"
      @created="onChannelCreated"
    />

    <!-- Invite Users Modal -->
    <InviteUsersModal
      v-if="showInviteModal"
      :workspace-id="storeData.workspace?._id"
      @close="showInviteModal = false"
    />

    <!-- New Direct Message Modal -->
    <NewDirectMessageModal
      v-if="showNewMessageModal"
      @close="showNewMessageModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import CreateChannelModal from '../modals/CreateChannelModal.vue';
import InviteUsersModal from '../modals/InviteUsersModal.vue';
import NewDirectMessageModal from '../modals/NewDirectMessageModal.vue';
import { useSocket } from '@/services/socketService';

const store = useStore();
const router = useRouter();
const route = useRoute();
const showCreateChannel = ref(false);
const showInviteModal = ref(false);
const showNewMessageModal = ref(false);
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  channel: null
});

const socket = useSocket(store);

const conversations = computed(() => store.getters['conversations/getConversations']);

// Add loading state
const isLoading = ref(true);

// Handle clicking outside context menu to close it
const closeContextMenu = (e) => {
  if (!e.target.closest('.context-menu')) {
    contextMenu.value.show = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
});

const showContextMenu = (event, channel) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    channel
  };
};

// Computed property for filtered workspace members
const filteredParticipants = computed(() => {
  const currentUser = store.getters['auth/currentUser']
  if (!conversations.value) return [];
  return conversations.value.map(conversation => ({
    ...conversation,
    displayParticipants: conversation.participants.filter(
      p => p._id !== currentUser?._id
    )
  }))
})

// Single computed property for store data to reduce reactivity triggers
const storeData = computed(() => ({
  channels: store.getters['channels/sortedChannels'] || [],
  currentChannel: store.getters['channels/currentChannel'],
  sentInvites: store.getters['invites/sentInvites'] || [],
  currentUser: store.getters['auth/currentUser'],
  workspace: store.getters['workspaces/currentWorkspace']
}));

// Watch for changes in workspace to update loading state
watch(
  () => storeData.value.workspace,
  (newWorkspace) => {
    if (newWorkspace) {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

const selectChannel = async (channel) => {
  if (!channel?._id || !storeData.value.workspace?._id) return;
    
  await store.dispatch('channels/setCurrentChannel', {
    channel,
    token: store.getters['auth/token']
  });

  // Update URL without triggering a navigation
  router.replace({
    name: 'channel',
    params: {
      workspaceId: storeData.value.workspace._id,
      channelId: channel._id
    }
  }, undefined, { force: false }).catch(() => {}); // Catch any navigation errors silently
};

const onChannelCreated = (channel) => {
  // Select the newly created channel
  selectChannel(channel);
};

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const activateChatbot = async () => {
  
  router.push({
    name: 'bot-conversation',
    params: { 
      workspaceId: storeData.value.workspace._id 
    }
  });
};

const selectConversation = (conversation) => {
  router.push({
    name: 'conversation',
    params: { 
      workspaceId: storeData.value.workspace._id,
      conversationId: conversation._id 
    }
  });
};
</script>

<style scoped>
.sidebar {
  height: 100%;
  background-color: #19171D;
  color: #D1D2D3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-header {
  padding: 16px;
  border-bottom: 1px solid #4B4B4B;
  background-color: #19171D;
}

.workspace-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-state {
  padding: 16px;
  color: #ABABAD;
  text-align: center;
}

.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #4B4B4B;
}

.search-bar input {
  width: 100%;
  padding: 8px 12px;
  background-color: #3F3F3F;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 14px;
}

.search-bar input:focus {
  outline: none;
  border-color: #1264A3;
}

.sidebar-section {
  padding: 16px 0;
  border-bottom: 1px solid #4B4B4B;
}

.section-header {
  padding: 0 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #ABABAD;
}

.add-button {
  background: none;
  border: none;
  color: #ABABAD;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.section-items {
  overflow-y: auto;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  cursor: pointer;
  gap: 8px;
  color: #ABABAD;
  transition: background-color 0.2s;
}

.section-item:hover {
  background-color: #27242C;
}

.section-item.active {
  background-color: #1264A3;
  color: #FFFFFF;
}

.chatbot-item {
  margin-bottom: 8px;
}

.conversation-avatar {
  width: 24px;
  height: 24px;
  position: relative;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.user-avatar-fallback {
  width: 100%;
  height: 100%;
  background-color: #4B4B4B;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #FFFFFF;
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.conversation-info span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bot-status {
  font-size: 12px;
  color: #ABABAD;
}

.additional-participants {
  font-size: 12px;
  color: #ABABAD;
  margin-left: 4px;
}

.invite-button {
  width: 100%;
  padding: 8px 16px;
  margin-top: 16px;
  background: none;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
  color: #D1D2D3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.invite-button:hover {
  background-color: #27242C;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: 100%;
  }

  .workspace-header {
    padding: 12px;
  }

  .workspace-name {
    font-size: 16px;
  }

  .search-bar {
    padding: 8px 12px;
  }

  .search-bar input {
    padding: 6px 10px;
    font-size: 13px;
  }

  .sidebar-section {
    padding: 12px 0;
  }

  .section-header {
    padding: 0 12px 6px;
  }

  .section-title {
    font-size: 14px;
  }

  .section-item {
    padding: 8px 12px;
    min-height: 44px; /* Better touch target */
  }

  .add-button {
    padding: 8px;
    min-width: 44px; /* Better touch target */
    min-height: 44px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .workspace-header {
    padding: 10px;
  }

  .workspace-name {
    font-size: 15px;
  }

  .section-item {
    padding: 10px 12px;
    min-height: 48px; /* Even larger touch target */
  }

  .invite-button {
    margin: 12px;
    width: calc(100% - 24px);
    height: 48px;
  }
}

/* Touch Device Optimizations */
@media (hover: none) {
  .section-item:active {
    background-color: #27242C;
  }

  .section-items {
    -webkit-overflow-scrolling: touch;
  }

  .add-button:active,
  .invite-button:active {
    background-color: #27242C;
  }
}
</style> 