<template>
  <div class="sidebar">
    <!-- Workspace Header -->
    <div class="workspace-header">
      <h1 class="workspace-name">{{ workspace.name }}</h1>
      <button class="new-message-button">
        <span class="icon">✏️</span>
      </button>
    </div>

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
          v-for="channel in workspace.channels" 
          :key="channel.id"
          class="section-item"
          :class="{ active: currentChannel?.id === channel.id }"
          @click="selectChannel(channel)"
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
        <button class="add-button">+</button>
      </div>
      <div class="section-items">
        <div class="section-item">
          <span class="status-icon">🟢</span>
          <span>{{ currentUser.displayName }}</span>
          <span class="you-label" v-if="workspace.user_role === 'admin'">you</span>
        </div>
        <!-- Pending Invites -->
        <div 
          v-for="invite in sentInvites" 
          :key="invite.id" 
          class="section-item pending-invite"
        >
          <span class="status-icon">⏳</span>
          <span>{{ invite.invitedEmail.split('@')[0] }}</span>
          <span class="pending-label">pending</span>
        </div>
        <button class="invite-button" @click="showInviteModal = true">
          <i class="fas fa-user-plus"></i> Invite People to Workspace
        </button>
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
      :workspace-id="workspace.id"
      @close="showInviteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import CreateChannelModal from '../modals/CreateChannelModal.vue';
import InviteUsersModal from '../modals/InviteUsersModal.vue';

const props = defineProps({
  workspace: {
    type: Object,
    required: true
  }
});

const store = useStore();
const router = useRouter();
const route = useRoute();
const showCreateChannel = ref(false);
const showInviteModal = ref(false);

const channels = computed(() => store.getters['channels/channels']);
const currentChannel = computed(() => store.getters['channels/currentChannel']);
const sentInvites = computed(() => store.getters['invites/sentInvites']);
const currentUser = computed(() => store.getters['auth/currentUser']);

const selectChannel = async (channel) => {
  // Update the current channel in store first
  await store.dispatch('channels/setCurrentChannel', {
    channel,
    token: store.getters['auth/token']
  });

  // Update URL without triggering a full navigation
  router.replace({
    name: 'channel',
    params: {
      workspaceId: props.workspace.id,
      channelId: channel._id
    }
  }).catch(() => {}); // Catch any navigation errors silently
};

const onChannelCreated = (channel) => {
  // Select the newly created channel
  selectChannel(channel);
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
  padding: 4px 16px;
  cursor: pointer;
  color: #ABABAD;
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
</style> 