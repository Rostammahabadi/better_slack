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
  store.dispatch('conversations/fetchConversations');
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
  channels: store.getters['channels/channels'] || [],
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
  display: flex;
  flex-direction: column;
  padding: 10px 0;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 49px;
  border-bottom: 1px solid #4B4B4B;
}

.workspace-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
}

.new-message-button {
  background: none;
  border: none;
  color: #FFFFFF;
  cursor: pointer;
  padding: 4px;
}

.search-bar {
  padding: 12px 16px;
}

.search-bar input {
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #565856;
  background-color: #363636;
  color: #FFFFFF;
}

.sidebar-section {
  padding: 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 4px;
}

.section-title {
  font-size: 15px;
  color: #ABABAD;
}

.add-button {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.add-button:hover {
  background-color: #27242C;
}

.section-items {
  margin-top: 4px;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  color: #ABABAD;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 8px;
}

.section-item:hover {
  background-color: #27242C;
}

.section-item.active {
  background-color: #1164A3;
  color: #FFFFFF;
}

.icon {
  margin-right: 8px;
  font-size: 16px;
}

.status-icon {
  margin-right: 8px;
  font-size: 12px;
}

.you-label {
  margin-left: 4px;
  font-size: 12px;
  color: #ABABAD;
}

.pending-invite {
  opacity: 0.8;
}

.pending-label {
  margin-left: 4px;
  font-size: 12px;
  color: #ABABAD;
  font-style: italic;
}

.add-channels {
  margin-top: 4px;
  color: #1D9BD1;
}

.invite-button {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: transparent;
  border: 1px solid #565856;
  border-radius: 4px;
  color: #ABABAD;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  width: 100%;
}

.invite-button:hover {
  background-color: #222529;
  color: #FFFFFF;
}

.invite-button i {
  font-size: 12px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #4B4B4B;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.conversation-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.additional-participants {
  color: #9CA3AF;
  font-size: 12px;
  margin-left: 4px;
}

.role-label {
  margin-left: 4px;
  font-size: 12px;
  color: #ABABAD;
  background-color: #363636;
  padding: 2px 4px;
  border-radius: 3px;
}

.loading-state {
  padding: 16px;
  text-align: center;
  color: #ABABAD;
}

.conversation-avatar {
  flex-shrink: 0;
  margin-right: 12px;
}
</style> 