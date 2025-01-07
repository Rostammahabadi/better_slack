<template>
  <div class="header">
    <div class="left-section">
      <div class="navigation">
        <button class="nav-button">◀</button>
        <button class="nav-button">▶</button>
        <button class="nav-button">🕒</button>
      </div>
      <div class="search">
        <input type="text" placeholder="Search testing123" />
      </div>
    </div>
    <div class="right-section">
      <div class="huddle-controls">
        <span class="badge">1</span>
        <button class="huddle-button">🎧 Huddle</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  workspace: {
    type: Object,
    required: true
  }
});
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
  gap: 8px;
}

.nav-button {
  background: none;
  border: none;
  color: #ABABAD;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.nav-button:hover {
  background-color: #27242C;
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