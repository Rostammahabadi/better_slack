<template>
  <BaseModal
    @close="handleClose"
    title="New Message"
  >
    <div class="new-message-modal">
      <div class="recipient-search">
        <label class="search-label">To:</label>
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            @focus="showResults = true"
            @input="handleSearch"
            @keydown.down="handleArrowDown"
            @keydown.up="handleArrowUp"
            @keydown.enter.prevent="handleEnter"
            placeholder="@somebody, or somebody@example.com"
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
          <button 
              class="search-result-item bot-result"
              @click="selectUser({displayName: 'Chatbot', id: 'chatbot', avatarUrl: '/images/bot.png'})"
            >
              <div class="user-avatar">
                <img 
                  src="/images/bot.png"
                  alt="Bot"
                  class="avatar-image"
                />
              </div>
              <div class="user-info">
                <div class="user-name">Chatbot</div>
                <div class="user-email">AI Assistant</div>
              </div>
            </button>
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

      <!-- Message Input -->
      <div v-if="selectedUsers.length > 0" class="message-input-container">
        <textarea
          v-model="message"
          rows="3"
          placeholder="Type your message..."
          class="message-input"
        ></textarea>
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
          @click="startConversation"
          :disabled="!canStartConversation"
          class="start-button"
          :class="{ 'disabled': !canStartConversation }"
        >
          Start conversation
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseModal from './BaseModal.vue'
import debounce from 'lodash/debounce'


const emit = defineEmits(['close'])

const store = useStore()
const router = useRouter()

const searchQuery = ref('')
const message = ref('')
const selectedUsers = ref([])
const showResults = ref(true)
const users = ref([])
const activeIndex = ref(-1)
const isLoading = ref(false)
const isLoadingMore = ref(false)

onMounted(async () => {
  await fetchInitialUsers()
})

const fetchInitialUsers = async () => {
  try {
    isLoading.value = true
    const response = await store.dispatch('users/fetchUsers', { workspaceId: store.state.workspaces.currentWorkspace._id })
    users.value = response
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMoreUsers = async () => {
  if (isLoadingMore.value || !store.getters['users/getHasMore']) return
  
  try {
    isLoadingMore.value = true
    const response = await store.dispatch('users/fetchUsers', {
      cursor: store.getters['users/getNextCursor']
    })
    users.value = [...users.value, ...response]
  } catch (error) {
    console.error('Failed to load more users:', error)
  } finally {
    isLoadingMore.value = false
  }
}

const handleScroll = (event) => {
  const element = event.target
  if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
    loadMoreUsers()
  }
}

const filteredUsers = computed(() => {
  // First filter out already selected users
  const unselectedUsers = users.value.filter(user => 
    !selectedUsers.value.some(selected => selected._id === user._id)
  )
  
  // Then apply search filter if there's a query
  if (!searchQuery.value) return unselectedUsers
  
  const query = searchQuery.value.toLowerCase()
  return unselectedUsers.filter(user => 
    user.displayName.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  )
})

const canStartConversation = computed(() => 
  selectedUsers.value.length > 0 && message.value.trim().length > 0
)

const handleSearch = debounce(async () => {
  if (searchQuery.value.trim().length < 2) {
    showResults.value = false
    return
  }

  try {
    const response = await store.dispatch('users/searchUsers', searchQuery.value)
    users.value = response
    showResults.value = true
  } catch (error) {
    console.error('Failed to search users:', error)
  }
}, 300)

const selectUser = async (user) => {
  // If selecting bot, check if bot conversation exists and route to it
  if (user.displayName === 'Chatbot') {
    const botMessages = store.getters['chatbot/messages'];
    
    // If bot is already active, just route to it
    if (botMessages.length > 0) {
      handleClose();
      router.push({
        name: 'bot-conversation',
        params: { 
          workspaceId: store.state.workspaces.currentWorkspace._id 
        }
      });
      return;
    }
    
    // Otherwise activate bot and start new conversation
    await store.dispatch('chatbot/activateBot');
    store.commit('conversations/addConversation', {
      id: 'bot',
      name: 'Chatbot',
      type: 'direct',
      avatarUrl: '/images/bot.png',
      participants: [{_id: 'bot', displayName: 'Chatbot'}]
    });
    store.commit('conversations/setCurrentConversation', {
      id: 'bot',
      name: 'Chatbot',
      type: 'direct',
      avatarUrl: '/images/bot.png',
      participants: [{_id: 'bot', displayName: 'Chatbot'}]
    });
    handleClose();
    router.push({
      name: 'bot-conversation',
      params: { 
        workspaceId: store.state.workspaces.currentWorkspace._id 
      }
    });
    return;
  }
  
  // Otherwise handle regular user selection
  if (!selectedUsers.value.some(u => u._id === user._id)) {
    selectedUsers.value.push(user);
  }
  searchQuery.value = '';
  showResults.value = false;
  activeIndex.value = -1;
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

const startConversation = async () => {
  try {
    // Create a regular conversation
    const conversation = await store.dispatch('conversations/createConversation', {
      participants: selectedUsers.value.map(u => u._id),
      message: message.value
    });
    
    handleClose();
    router.push({
      name: 'conversation',
      params: { 
        conversationId: conversation._id,
        workspaceId: store.state.workspaces.currentWorkspace._id 
      }
    });
  } catch (error) {
    console.error('Failed to create conversation:', error);
  }
}

const handleClose = () => {
  searchQuery.value = ''
  message.value = ''
  selectedUsers.value = []
  showResults.value = true
  activeIndex.value = -1
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

<style >
.bot-result {
  background-color: rgba(88, 101, 242, 0.1);
  border-left: 3px solid #5865F2;
  margin-bottom: 8px;
}

.bot-result:hover {
  background-color: rgba(88, 101, 242, 0.2);
}

.bot-result .user-info {
  color: #5865F2;
}

.bot-result .user-name {
  color: #5865F2;
}

.bot-result .user-email {
  color: #7984F5;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
}

.search-result-item:hover,
.search-result-item.active {
  background-color: #3D3D3D;
}
</style>
<style scoped>
.new-message-modal {
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

.message-input-container {
  margin-top: 16px;
}

.message-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #1F1F1F;
  color: #FFFFFF;
  border: 1px solid #3D3D3D;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
}

.message-input:focus {
  outline: none;
  border-color: #5865F2;
  box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
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

.start-button {
  padding: 8px 16px;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #5865F2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.start-button:hover:not(.disabled) {
  background-color: #4752C4;
}

.start-button.disabled {
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