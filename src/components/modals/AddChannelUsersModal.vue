<template>
  <BaseModal
    @close="handleClose"
    :title="`Add people to #${channelName}`"
  >
    <div class="add-users-modal">
      <div class="recipient-search">
        <label class="search-label">Add people:</label>
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            @focus="showResults = true"
            @input="handleSearch"
            @keydown.down="handleArrowDown"
            @keydown.up="handleArrowUp"
            @keydown.enter.prevent="handleEnter"
            placeholder="Type a name"
            class="search-input"
          />
          
          <!-- Selected Users -->
          <div v-if="selectedUsers.length > 0" class="selected-users">
            <div
              v-for="user in selectedUsers"
              :key="user._id"
              class="user-tag"
            >
              <span>{{ user.displayName }}</span>
              <button
                @click="removeUser(user)"
                class="remove-user"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Dropdown Results -->
          <div
            v-if="showResults && filteredUsers.length > 0"
            class="search-results"
            @scroll="handleScroll"
          >
            <div
              v-for="(user, index) in filteredUsers"
              :key="user._id"
              @click="selectUser(user)"
              @mouseover="activeIndex = index"
              class="search-result-item"
              :class="{ 'active': activeIndex === index }"
            >
              <div class="user-avatar">
                <img 
                  v-if="user.avatarUrl"
                  :src="user.avatarUrl"
                  :alt="user.displayName"
                  class="avatar-image"
                />
                <span v-else class="avatar-initials">
                  {{ getInitials(user.displayName) }}
                </span>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.displayName }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div v-if="user.userStatus" class="user-status">
                  <span class="status-emoji">{{ user.userStatus.emoji }}</span>
                  <span class="status-text">{{ user.userStatus.text }}</span>
                </div>
              </div>
              <div v-if="user.online" class="online-status"></div>
            </div>
            
            <!-- Loading More Indicator -->
            <div v-if="isLoadingMore" class="loading-more">
              Loading more users...
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          @click="handleClose"
          class="cancel-button"
        >
          Cancel
        </button>
        <button
          @click="addUsers"
          :disabled="!canAddUsers"
          class="add-button"
          :class="{ 'disabled': !canAddUsers }"
        >
          Add to channel
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import BaseModal from './BaseModal.vue'
import debounce from 'lodash/debounce'
import { useSocket } from '@/services/socketService'

const props = defineProps({
  channelId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close'])

const store = useStore()
const { sendAddedUsersToChannel, cleanup } = useSocket(store)
const searchQuery = ref('')
const selectedUsers = ref([])
const showResults = ref(true)
const users = ref([])
const activeIndex = ref(-1)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const nextCursor = ref(null)

const currentChannel = computed(() => store.getters['channels/getChannelById'](props.channelId));
const channelName = computed(() => currentChannel.value?.name || '');

onMounted(async () => {
  await fetchInitialUsers()
})

const fetchInitialUsers = async () => {
  try {
    isLoading.value = true;
    const response = await store.dispatch('users/fetchUsers', { 
      workspaceId: store.state.workspaces.currentWorkspace._id
    });
    
    if (response && Array.isArray(response)) {
      // Filter out users who are already members of the channel
      const existingMemberIds = new Set(currentChannel.value?.members?.map(member => member.userId.toString()));
      users.value = response.filter(user => !existingMemberIds.has(user._id.toString()));
      nextCursor.value = response.nextCursor;
    } else {
      users.value = [];
      nextCursor.value = null;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    users.value = [];
    nextCursor.value = null;
  } finally {
    isLoading.value = false;
  }
}

const loadMoreUsers = async () => {
  if (isLoadingMore.value || !nextCursor.value) return;
  
  try {
    isLoadingMore.value = true;
    const response = await store.dispatch('users/fetchUsers', {
      cursor: nextCursor.value,
      workspaceId: store.state.workspaces.currentWorkspace._id
    });
    
    if (response && Array.isArray(response)) {
      // Filter out users who are already members of the channel
      const existingMemberIds = new Set(currentChannel.value?.members?.map(member => member.userId.toString()));
      const newUsers = response.filter(user => !existingMemberIds.has(user._id.toString()));
      users.value = [...users.value, ...newUsers];
      nextCursor.value = response.nextCursor;
    }
  } catch (error) {
    console.error('Failed to load more users:', error);
  } finally {
    isLoadingMore.value = false;
  }
}

const handleSearch = debounce(async () => {
  if (!searchQuery.value) {
    await fetchInitialUsers();
    return;
  }
  
  try {
    isLoading.value = true;
    const response = await store.dispatch('users/searchUsers', {
      query: searchQuery.value,
      workspaceId: store.state.workspaces.currentWorkspace._id
    });
    
    // Filter out users who are already members of the channel
    const existingMemberIds = new Set(currentChannel.value?.members?.map(member => member.userId.toString()));
    users.value = response.filter(user => !existingMemberIds.has(user._id.toString()));
    nextCursor.value = null; // Reset cursor during search
  } catch (error) {
    console.error('Failed to search users:', error);
  } finally {
    isLoading.value = false;
  }
}, 300);

const filteredUsers = computed(() => {
  return users.value.filter(user => 
    !selectedUsers.value.some(selected => selected._id === user._id)
  )
})

const canAddUsers = computed(() => selectedUsers.value.length > 0)

const selectUser = (user) => {
  if (!selectedUsers.value.some(u => u._id === user._id)) {
    selectedUsers.value.push(user)
  }
  searchQuery.value = ''
  showResults.value = false
  activeIndex.value = -1
}

const removeUser = (user) => {
  selectedUsers.value = selectedUsers.value.filter(u => u._id !== user._id)
}

const handleArrowDown = () => {
  if (showResults.value && filteredUsers.value.length > 0) {
    activeIndex.value = (activeIndex.value + 1) % filteredUsers.value.length
  }
}

const handleArrowUp = () => {
  if (showResults.value && filteredUsers.value.length > 0) {
    activeIndex.value = activeIndex.value <= 0 
      ? filteredUsers.value.length - 1 
      : activeIndex.value - 1
  }
}

const handleEnter = () => {
  if (activeIndex.value >= 0 && filteredUsers.value[activeIndex.value]) {
    selectUser(filteredUsers.value[activeIndex.value])
  }
}

const handleScroll = async (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  // Load more when user scrolls to bottom (with 50px threshold)
  if (scrollHeight - (scrollTop + clientHeight) < 50 && !isLoadingMore.value && nextCursor.value) {
    await loadMoreUsers();
  }
}

const addUsers = async () => {
  try {
    await store.dispatch('channels/addUsersToChannel', {
      channelId: props.channelId,
      userIds: selectedUsers.value.map(u => u._id)
    })
    sendAddedUsersToChannel(props.channelId, selectedUsers.value.map(u => u._id))
    handleClose()
  } catch (error) {
    console.error('Failed to add users to channel:', error)
  }
}

const handleClose = () => {
  searchQuery.value = ''
  selectedUsers.value = []
  showResults.value = true
  activeIndex.value = -1
  cleanup()
  emit('close')
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.add-users-modal {
  padding: 16px;
}

.recipient-search {
  position: relative;
}

.search-label {
  display: block;
  font-size: 14px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #1F1F1F;
  color: #FFFFFF;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #5865F2;
  box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
}

.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #5865F2;
  color: #FFFFFF;
  border-radius: 9999px;
  font-size: 14px;
}

.remove-user {
  margin-left: 4px;
  color: #FFFFFF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}

.remove-user:hover {
  color: #E5E7EB;
}

.search-results {
  position: absolute;
  z-index: 50;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
}

.search-result-item:hover,
.search-result-item.active {
  background-color: #3D3D3D;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: #3D3D3D;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.avatar-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initials {
  color: #FFFFFF;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  color: #FFFFFF;
  font-weight: 500;
}

.user-email {
  font-size: 12px;
  color: #9CA3AF;
}

.online-status {
  width: 8px;
  height: 8px;
  background-color: #10B981;
  border-radius: 50%;
  margin-left: auto;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.cancel-button {
  padding: 8px 16px;
  font-size: 14px;
  color: #9CA3AF;
  background: none;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #3D3D3D;
  color: #FFFFFF;
}

.add-button {
  padding: 8px 16px;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #5865F2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-button:hover:not(.disabled) {
  background-color: #4752C4;
}

.add-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.status-emoji {
  font-size: 12px;
}

.status-text {
  font-size: 12px;
  color: #9CA3AF;
}

.loading-more {
  text-align: center;
  padding: 8px;
  color: #9CA3AF;
  font-size: 14px;
}
</style> 