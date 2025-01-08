<template>
  <div class="header">
    <div class="left-section">
      <div class="navigation">
        <button class="nav-button" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 19L8.5 12L15.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="nav-button" title="Forward">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 19L15.5 12L8.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="search">
        <input type="text" placeholder="Search testing123" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const workspace = computed(() => store.getters['workspaces/workspace']);
</script>

<style scoped>
.header {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background-color: #1A1D21;
  border-bottom: 1px solid #4B4B4B;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navigation {
  display: flex;
  gap: 4px;
}

.nav-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.1s ease;
}

.nav-button:hover {
  background-color: #27242C;
  color: #FFFFFF;
}

.nav-button:active {
  transform: scale(0.95);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search {
  position: relative;
}

.search input {
  width: 280px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #565856;
  background-color: #363636;
  color: #FFFFFF;
  font-size: 13px;
}

.search input:focus {
  outline: none;
  border-color: #1264A3;
  box-shadow: 0 0 0 1px #1264A3;
}

.search input::placeholder {
  color: #ABABAD;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.huddle-controls {
  position: relative;
  display: flex;
  align-items: center;
}

.huddle-button {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.huddle-button:hover {
  background-color: #27242C;
}

.badge {
  position: absolute;
  top: -4px;
  left: -8px;
  background-color: #007A5A;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}
</style> 