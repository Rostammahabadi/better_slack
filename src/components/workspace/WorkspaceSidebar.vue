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
            v-for="channel in channels" 
            :key="channel._id"
            class="section-item"
            :class="{ active: storeData.currentChannel?._id === channel._id }"
            @click="selectChannel(channel)"
            @contextmenu.prevent="isChannelAdmin(channel) && showContextMenu($event, channel)"
          >
            <span class="icon">{{ channel.type === 'private' ? '🔒' : '#' }}</span>
            <template v-if="editingChannel?._id === channel._id">
              <input
                ref="channelNameInput"
                v-model="editingChannel.name"
                class="channel-name-input"
                @keyup.enter="saveChannelName"
                @keyup.esc="cancelEditing"
                @blur="saveChannelName"
                :placeholder="channel.name"
              />
            </template>
            <span v-else>{{ channel.name }}</span>
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
          <!-- Loading State -->
          <div v-if="isLoadingConversations" class="loading-state">
            Loading conversations...
          </div>
          
          <template v-else>
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
                <span v-if="conversation.lastMessage" class="last-message">
                  {{ truncateMessage(conversation.lastMessage.content) }}
                </span>
              </div>
            </div>
          </template>

          <button class="invite-button" @click="showInviteModal = true">
            <i class="fas fa-user-plus"></i> Invite People to Workspace
          </button>
        </div>
      </div>
    </template>

    <!-- Channel Context Menu -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ 
        top: `${contextMenu.y}px`, 
        left: `${contextMenu.x}px` 
      }"
    >
      <div class="context-menu-item" @click="handleRenameChannel">
        <i class="fas fa-edit"></i>
        Rename Channel
      </div>
      <div class="context-menu-item delete" @click="handleDeleteChannel">
        <i class="fas fa-trash"></i>
        Delete Channel
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import CreateChannelModal from '../modals/CreateChannelModal.vue';
import InviteUsersModal from '../modals/InviteUsersModal.vue';
import NewDirectMessageModal from '../modals/NewDirectMessageModal.vue';

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
const editingChannel = ref(null);

const conversations = computed(() => store.getters['conversations/getConversations']);

// Update channels to be a computed property
const channels = computed(() => {
  const sortedChannels = store.getters['channels/sortedChannels'];
  return sortedChannels || [];
});

// Add loading state
const isLoading = computed(() => {
  return store.getters['channels/getIsLoading'] || 
         store.getters['conversations/getIsLoading'] ||
         !storeData.value.workspace;
});

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
  currentChannel: store.getters['channels/currentChannel'],
  sentInvites: store.getters['invites/sentInvites'],
  currentUser: store.getters['auth/currentUser'],
  workspace: store.getters['workspaces/currentWorkspace']
}));

// Watch for changes in workspace to update loading state
watch(
  () => storeData.value.workspace,
  (newWorkspace) => {
    if (newWorkspace && !isLoading.value) {
      // Only update loading state if we're not waiting for other data
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

// Add new computed property for conversations loading state
const isLoadingConversations = computed(() => store.getters['conversations/getIsLoading']);

// Add helper function to truncate messages
const truncateMessage = (message) => {
  if (!message) return '';
  return message.length > 30 ? message.substring(0, 27) + '...' : message;
};

const handleRenameChannel = () => {
  // Close the context menu
  contextMenu.value.show = false;
  // Set the channel being edited
  editingChannel.value = { ...contextMenu.value.channel };
  // Focus the input on the next tick after the template updates
  nextTick(() => {
    const input = document.querySelector('.channel-name-input');
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const saveChannelName = async () => {
  if (!editingChannel.value) return;
  
  // Only save if the name has changed and is not empty
  if (editingChannel.value.name && 
      editingChannel.value.name !== contextMenu.value?.channel?.name) {
    console.log('Save new channel name:', editingChannel.value.name);
    // TODO: Implement actual channel rename API call
  }
  
  editingChannel.value = null;
};

const cancelEditing = () => {
  editingChannel.value = null;
};

const handleDeleteChannel = () => {
  // Close the context menu
  contextMenu.value.show = false;
  // TODO: Implement delete functionality
  console.log('Delete channel:', contextMenu.value.channel?.name);
};

const isChannelAdmin = (channel) => {
  const currentUser = storeData.value.currentUser;
  return channel.createdBy === currentUser?._id;
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
  padding: 12px 16px;
  color: #ABABAD;
  font-size: 14px;
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
  color: #9A9A9A;
}

.additional-participants {
  color: #9A9A9A;
  font-size: 12px;
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

.last-message {
  font-size: 12px;
  color: #9A9A9A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
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

.context-menu {
  position: fixed;
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.context-menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #D1D2D3;
  font-size: 14px;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #27242C;
}

.context-menu-item.delete {
  color: #E01E5A;
}

.context-menu-item.delete:hover {
  background-color: rgba(224, 30, 90, 0.1);
}

.context-menu-item i {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.channel-name-input {
  background: transparent;
  border: none;
  color: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
  width: 100%;
  outline: none;
  border-radius: 4px;
}

.channel-name-input:focus {
  background-color: #27242C;
  padding: 2px 4px;
  margin: -2px -4px;
}
</style> 