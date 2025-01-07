<template>
  <nav class="workspace-nav">
    <div class="nav-top">
      <!-- Workspace Icon -->
      <div class="nav-item workspace-icon">
        <div class="square-icon">T</div>
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

      <!-- Activity -->
      <div class="nav-item">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" class="icon">
            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <span class="nav-label">Activity</span>
      </div>

      <!-- More -->
      <div class="nav-item">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" class="icon">
            <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
        <span class="nav-label">More</span>
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
          <img :src="userAvatar" alt="Profile" class="profile-img" />
          <div class="status-indicator"></div>
        </div>

        <!-- User Menu Popup -->
        <div v-if="showUserMenu" class="user-menu" ref="userMenu">
          <!-- User Info -->
          <div class="user-info">
            <img :src="userAvatar" alt="Profile" class="user-avatar" />
            <div class="user-details">
              <div class="user-name">{{ user?.name }}</div>
              <div class="user-status">Active</div>
            </div>
          </div>

          <!-- Status Update -->
          <div class="menu-section">
            <button class="menu-button status-button">
              <span class="emoji">😊</span>
              Update your status
            </button>
          </div>

          <!-- Set Presence -->
          <div class="menu-section">
            <button class="menu-button">
              Set yourself as away
            </button>
            <button class="menu-button">
              <div class="button-content">
                <span>Pause notifications</span>
                <span class="button-arrow">›</span>
              </div>
            </button>
          </div>

          <!-- Profile & Settings -->
          <div class="menu-section">
            <button class="menu-button">Profile</button>
            <button class="menu-button">
              <div class="button-content">
                <span>Preferences</span>
                <span class="preferences-icon">⌘,</span>
              </div>
            </button>
          </div>

          <!-- Downloads -->
          <div class="menu-section">
            <button class="menu-button">
              <div class="button-content">
                <span>Downloads</span>
                <span class="downloads-icon">↓</span>
              </div>
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
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const auth0 = inject('auth0');
const props = defineProps({
  workspace: {
    type: Object,
    required: true
  },
  user: {
    type: Object,
    required: true
  }
});

const store = useStore();
const router = useRouter();
const showUserMenu = ref(false);
const userMenuTrigger = ref(null);
const userMenu = ref(null);

const userAvatar = computed(() => {
  return props.user?.picture || props.user?.avatarUrl;
});

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleClickOutside = (event) => {
  if (showUserMenu.value && 
      userMenuTrigger.value && 
      !userMenuTrigger.value.contains(event.target)) {
    showUserMenu.value = false;
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
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
}

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
}

.nav-item:hover .icon-container {
  background-color: #27242C;
}

.icon-container {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
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
}

.profile-img {
  width: 28px;
  height: 28px;
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
</style> 