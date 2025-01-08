<template>
  <div class="workspace-layout">
    <WorkspaceNavBar :user="currentUser" />
    <div class="workspace-sidebar">
      <WorkspaceSidebar />
    </div>
    <div class="workspace-main">
      <WorkspaceHeader />
      <div class="workspace-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import WorkspaceNavBar from './WorkspaceNavBar.vue';
import WorkspaceSidebar from './WorkspaceSidebar.vue';
import WorkspaceHeader from './WorkspaceHeader.vue';

const store = useStore();
const currentUser = computed(() => store.getters['auth/currentUser']);

</script>

<style>
/* Reset default margins and padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>

<style scoped>
.workspace-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.workspace-sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: #19171D;
  color: #D1D2D3;
  overflow-y: auto;
}

.workspace-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #1A1D21;
  min-width: 0; /* Prevent flex items from overflowing */
}

.workspace-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  position: relative;
}
</style> 