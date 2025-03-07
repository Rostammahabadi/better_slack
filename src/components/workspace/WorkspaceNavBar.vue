<template>
  <nav class="workspace-nav">
    <!-- Mobile Menu Button -->
    <button class="mobile-menu-button" @click="$emit('toggle-sidebar')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="nav-top">
      <!-- Workspace Icon -->
      <div class="nav-item workspace-icon" @click="toggleWorkspaceMenu" ref="workspaceMenuTrigger">
        <div class="square-icon">T</div>

        <!-- Workspace Menu Popup -->
        <div v-if="showWorkspaceMenu" class="workspace-menu" ref="workspaceMenu">
          <div class="workspace-menu-header">
            <h3>Workspaces</h3>
          </div>
          
          <div class="workspace-list">
            <div 
              v-for="workspace in workspaces" 
              :key="workspace._id"
              class="workspace-item"
              :class="{ 'active': workspace._id === currentWorkspace._id }"
              @click="switchWorkspace(workspace._id)"
            >
              <div class="workspace-icon-small">{{ workspace.name[0] }}</div>
              <div class="workspace-details">
                <div class="workspace-name">{{ workspace.name }}</div>
              </div>
            </div>
          </div>

          <div class="workspace-menu-footer">
            <button class="add-workspace-button" @click="addWorkspace">
              <span class="add-icon">+</span>
              Add a workspace
            </button>
          </div>
        </div>
      </div>

      <!-- Home -->
      <div class="nav-item">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" class="icon">
            <path fill="currentColor" d="M23,11H13V1a1,1,0,0,0-1-1H1A1,1,0,0,0,0,1V23a1,1,0,0,0,1,1H23a1,1,0,0,0,1-1V12A1,1,0,0,0,23,11ZM12,20H4V16h8Zm0-6H4V10h8ZM4,8V4h8V8Z"/>
          </svg>
        </div>
        <span class="nav-label">Home</span>
      </div>

      <!-- DMs -->
      <div class="nav-item">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" class="icon">
            <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        <span class="nav-label">DMs</span>
      </div>
    </div>

    <div class="nav-bottom">
      <!-- Add Workspace -->
      <div class="nav-item">
        <div class="icon-container add-workspace">
          <svg viewBox="0 0 24 24" class="icon">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
      </div>

      <!-- User Profile -->
      <div class="nav-item" @click="toggleUserMenu" ref="userMenuTrigger">
        <div class="icon-container profile">
          <div v-if="user?.userStatus?.emoji" class="status-emoji">
            {{ user.userStatus.emoji }}
          </div>
          <img :src="userAvatar" alt="Profile" class="profile-img" />
        </div>

        <!-- User Menu Popup -->
        <div v-if="showUserMenu" class="user-menu" ref="userMenu">
          <!-- User Info -->
          <div class="user-info">
            <img :src="userAvatar" alt="Profile" class="user-avatar" />
            <div class="user-details">
              <div class="user-name">{{ user?.name }}</div>
              <div class="user-status" :class="{ away: isAway }">{{ isAway ? 'Away' : 'Active' }}</div>
            </div>
          </div>

          <!-- Status Update -->
          <div class="menu-section">
            <button class="menu-button status-button" @click="openStatusModal">
              <span class="emoji">😊</span>
              Update your status
            </button>
          </div>

          <!-- Set Presence -->
          <div class="menu-section">
            <button class="menu-button" @click="openSetAwayModal">
              <span class="status-indicator" :class="{ away: isAway }"></span>
              {{ isAway ? 'Set yourself as active' : 'Set yourself as away' }}
            </button>
          </div>
          <!-- Sign Out -->
          <div class="menu-section">
            <button class="menu-button sign-out" @click="signOut">
              Sign out of {{ workspace.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Workspace Modal -->
    <div v-if="showAddWorkspaceModal" class="modal-overlay" @click="closeAddWorkspaceModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create a workspace</h2>
          <button class="close-button" @click="closeAddWorkspaceModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="workspace-name">Workspace name</label>
            <input 
              type="text" 
              id="workspace-name" 
              v-model="newWorkspaceName"
              placeholder="Ex: Acme Marketing"
              class="workspace-input"
            >
          </div>
          <button class="create-workspace-button" @click="createWorkspace">
            Create a new workspace
          </button>
        </div>
      </div>
    </div>

    <!-- Add status modal -->
    <StatusUpdateModal v-if="showStatusModal" @close="closeStatusModal" />
    
    <!-- Add set away modal -->
    <SetAwayModal v-if="showSetAwayModal" @close="closeSetAwayModal" />
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useSocket } from '../../services/socketService';
import StatusUpdateModal from '../modals/StatusUpdateModal.vue';
import SetAwayModal from '../modals/SetAwayModal.vue';

const auth0 = inject('auth0');

const store = useStore();
const router = useRouter();
const showUserMenu = ref(false);
const showWorkspaceMenu = ref(false);
const userMenuTrigger = ref(null);
const userMenu = ref(null);
const workspaceMenuTrigger = ref(null);
const showAddWorkspaceModal = ref(false);
const newWorkspaceName = ref('');
const showStatusModal = ref(false);
const showSetAwayModal = ref(false);

const {
  sendWorkspaceJoined,
  sendWorkspaceLeft,
  leaveChannel
} = useSocket(store);

const workspace = computed(() => store.getters['workspaces/currentWorkspace']);
const workspaces = computed(() => store.getters['workspaces/workspaces']);
const currentWorkspace = computed(() => store.getters['workspaces/currentWorkspace']);
const user = computed(() => store.getters['auth/currentUser']);
const userAvatar = computed(() => store.getters['auth/userAvatar']);

const isAway = computed(() => store.getters['auth/isAway']);

const emit = defineEmits(['toggle-sidebar']);

const toggleWorkspaceMenu = () => {
  showWorkspaceMenu.value = !showWorkspaceMenu.value;
  if (showWorkspaceMenu.value) {
    showUserMenu.value = false;
  }
};

const switchWorkspace = async (workspaceId) => {
  try {
    // Leave current channel if one is active
    if (store.getters['channels/currentChannel']?._id) {
      leaveChannel(store.getters['channels/currentChannel']._id);
    }

    // Notify that we're leaving the current workspace
    if (currentWorkspace.value) {
      sendWorkspaceLeft(currentWorkspace.value._id, user.value);
    }

    // Navigate to the workspace - the WorkspaceView component will handle the data fetching
    router.push(`/workspaces/${workspaceId}`);
    showWorkspaceMenu.value = false;

    // Notify that we've joined the new workspace
    sendWorkspaceJoined(workspaceId, user.value);
  } catch (error) {
    console.error('Error switching workspace:', error);
  }
};

const addWorkspace = () => {
  showWorkspaceMenu.value = false;
  showAddWorkspaceModal.value = true;
};

const closeAddWorkspaceModal = () => {
  showAddWorkspaceModal.value = false;
  newWorkspaceName.value = '';
};

const openSetAwayModal = () => {
  showSetAwayModal.value = true;
  showUserMenu.value = false;
};

const closeSetAwayModal = () => {
  showSetAwayModal.value = false;
};

const createWorkspace = async () => {
  try {
    // Create the new workspace
    const newWorkspace = await store.dispatch('workspaces/createWorkspace', {
      name: newWorkspaceName.value,
      token: store.state.auth.token
    });

    // Close the modal
    closeAddWorkspaceModal();

    // Navigate to the new workspace
    await switchWorkspace(newWorkspace._id);
  } catch (error) {
    console.error('Error creating workspace:', error);
  }
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  if (showUserMenu.value) {
    showWorkspaceMenu.value = false;
  }
};

const handleClickOutside = (event) => {
  if (showUserMenu.value && 
      userMenuTrigger.value && 
      !userMenuTrigger.value.contains(event.target)) {
    showUserMenu.value = false;
  }
  if (showWorkspaceMenu.value && 
      workspaceMenuTrigger.value && 
      !workspaceMenuTrigger.value.contains(event.target)) {
    showWorkspaceMenu.value = false;
  }
};

const signOut = async () => {
  try {
    // Clear Vuex store state
    await store.dispatch('auth/logout');
    
    // Logout from Auth0 and redirect to login page
    await auth0.logout({ 
      logoutParams: {
        returnTo: window.location.origin + '/login'
      }
    });
  } catch (error) {
    console.error('Error during sign out:', error);
    // Fallback to login page if there's an error
    router.push('/login');
  }
};

const openStatusModal = () => {
  showStatusModal.value = true;
};

const closeStatusModal = () => {
  showStatusModal.value = false;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Base styles */
.workspace-nav {
  width: 64px;
  height: 100vh;
  background-color: #19171D;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 0;
  flex-shrink: 0;
  border-right: 1px solid #4B4B4B;
  position: relative;
  z-index: 20;
}

.mobile-menu-button {
  display: none;
  background: none;
  border: none;
  color: #D1D2D3;
  padding: 8px;
  cursor: pointer;
  position: fixed;
  top: 12px;
  left: 72px;
  z-index: 35;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: rgba(26, 29, 33, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid #4B4B4B;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .workspace-nav {
    width: 56px;
    padding: 8px 0;
  }

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-item {
    padding: 8px 0;
  }

  .icon-container {
    width: 32px;
    height: 32px;
  }

  .workspace-icon .square-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .nav-label {
    display: none;
  }

  .profile {
    width: 32px;
    height: 32px;
  }

  .profile-img {
    width: 32px;
    height: 32px;
  }

  .workspace-menu,
  .user-menu {
    position: fixed;
    left: 56px !important;
    border-radius: 0;
    height: 100vh;
    margin: 0;
  }

  .workspace-menu {
    top: 0;
    width: calc(100vw - 56px);
    max-width: 320px;
  }

  .user-menu {
    bottom: 0;
    width: calc(100vw - 56px);
    max-width: 320px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .workspace-nav {
    width: 48px;
    padding: 6px 0;
  }

  .mobile-menu-button {
    left: 56px;
    top: 10px;
  }


  .workspace-icon .square-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .workspace-menu,
  .user-menu {
    left: 48px !important;
    width: calc(100vw - 48px);
  }
}

/* Safe Area Handling */
@supports (padding: max(0px)) {
  .workspace-nav {
    padding-top: max(12px, env(safe-area-inset-top));
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .mobile-menu-button {
    top: max(12px, env(safe-area-inset-top));
  }
}

/* Existing styles with improvements */
.nav-top {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 0;
  position: relative;
}



.workspace-icon .square-icon {
  width: 36px;
  height: 36px;
  background-color: #4B4B4B;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.icon {
  width: 20px;
  height: 20px;
  color: #ABABAD;
}

.nav-label {
  font-size: 12px;
  color: #ABABAD;
  text-align: center;
}

.nav-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-workspace {
  border: 1.5px solid #4B4B4B;
  border-radius: 50%;
}

.profile {
  position: relative;
  width: 36px;
  height: 36px;
}

.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: #2BAC76;
  border: 2px solid #19171D;
  border-radius: 50%;
}

.user-menu {
  position: fixed;
  bottom: 80px;
  left: 16px;
  width: 300px;
  background-color: #1A1D21;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border: 1px solid #4B4B4B;
}

.user-info {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #4B4B4B;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  color: #FFFFFF;
  font-weight: 600;
  font-size: 15px;
}

.user-status {
  color: #ABABAD;
  font-size: 13px;
}

.menu-section {
  padding: 4px 0;
  border-bottom: 1px solid #4B4B4B;
}

.menu-section:last-child {
  border-bottom: none;
}

.menu-button {
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #D1D2D3;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-button:hover {
  background-color: #27242C;
}

.status-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji {
  font-size: 16px;
}

.button-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-arrow {
  color: #ABABAD;
  font-size: 16px;
}

.preferences-icon, .downloads-icon {
  color: #ABABAD;
  font-size: 14px;
}

.sign-out {
  color: #E01E5A;
}

.sign-out:hover {
  color: #E01E5A;
  background-color: rgba(224, 30, 90, 0.1);
}

.workspace-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 280px;
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
}

.workspace-menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid #4B4B4B;
}

.workspace-menu-header h3 {
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.workspace-list {
  max-height: 320px;
  overflow-y: auto;
}

.workspace-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  gap: 12px;
}

.workspace-item:hover {
  background-color: #27242C;
}

.workspace-item.active {
  background-color: #1264A3;
}

.workspace-icon-small {
  width: 36px;
  height: 36px;
  background-color: #4B4B4B;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.workspace-details {
  flex: 1;
}

.workspace-name {
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
}

.workspace-url {
  color: #ABABAD;
  font-size: 13px;
}

.workspace-menu-footer {
  padding: 12px 16px;
  border-top: 1px solid #4B4B4B;
}

.add-workspace-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background-color: transparent;
  border: none;
  color: #1264A3;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
}

.add-workspace-button:hover {
  background-color: rgba(18, 100, 163, 0.1);
}

.add-icon {
  font-size: 16px;
  font-weight: bold;
}

.nav-item.workspace-icon {
  position: relative;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background-color: #1A1D21;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #4B4B4B;
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 1px solid #4B4B4B;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #ABABAD;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #FFFFFF;
}

.modal-body {
  padding: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
}

.workspace-input {
  width: 100%;
  padding: 12px;
  background-color: #222529;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 15px;
}

.workspace-input:focus {
  outline: none;
  border-color: #1264A3;
  box-shadow: 0 0 0 4px rgba(18, 100, 163, 0.1);
}

.workspace-input::placeholder {
  color: #ABABAD;
}

.create-workspace-button {
  width: 100%;
  padding: 12px;
  background-color: #007a5a;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-workspace-button:hover {
  background-color: #006c4f;
}

.create-workspace-button:active {
  background-color: #005e44;
}

/* Touch-friendly improvements */
@media (hover: none) {
  .nav-item,
  .workspace-item,
  .menu-button {
    transition: background-color 0.3s;
  }

  .nav-item:active .icon-container {
    background-color: #27242C;
  }

  .workspace-item:active {
    background-color: #27242C;
  }

  .menu-button:active {
    background-color: #27242C;
  }
}

.icon-container.profile {
  position: relative;
  width: 36px;
  height: 36px;
}



.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #43B581;
  transition: background-color 0.2s ease;
}

.status-indicator.away {
  background-color: #FAA61A;
}
.icon-container {
  position: relative; /* Important: make this the positioning context */
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

/* Profile Image can remain as-is, or you can explicitly size it here. */
.profile-img {
  width: 100%;
  height: 100%;
  border-radius: 6px; /* match container rounding if desired */
  object-fit: cover;  /* optional, if you want consistent aspect ratio */
}

/* Position the emoji “above” the container, but not overlapping */
.status-emoji {
  position: absolute;
  top: -10px;          /* Moves it above the top of the container */
  left: 50%;          
  transform: translateX(-50%); /* Centers it horizontally */

  /* Make the badge smaller so it won’t cover the avatar */
  width: 20px;
  height: 20px;
  border-radius: 50%;  /* a circular badge this time */
  background-color: #2BAC76;
  border: 2px solid #1A1D21;

  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;     /* smaller font so emoji fits neatly */
  line-height: 1;
  z-index: 2;
}

/* Example hover background for the container */
.nav-item:hover .icon-container {
  background-color: #27242C;
}
</style> 