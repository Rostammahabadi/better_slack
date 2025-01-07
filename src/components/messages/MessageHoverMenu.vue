<template>
  <div 
    class="hover-menu" 
    @mouseover="$emit('menu-hover')"
    @mouseleave="$emit('menu-leave')"
    ref="menuRef"
  >
    <div class="menu-buttons">
      <button class="menu-button" @click="toggleEmojiPicker">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 11C16.3284 11 17 10.3284 17 9.5C17 8.67157 16.3284 8 15.5 8C14.6716 8 14 8.67157 14 9.5C14 10.3284 14.6716 11 15.5 11Z" fill="currentColor"/>
          <path d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z" fill="currentColor"/>
          <path d="M12 16C14.2091 16 16 14.2091 16 12H8C8 14.2091 9.79086 16 12 16Z" fill="currentColor"/>
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="currentColor"/>
        </svg>
        Add reaction
      </button>
      <button class="menu-button" @click="$emit('reply')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6H4V18H9V21L12 18H20V6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Reply in thread
      </button>
    </div>

    <!-- Emoji Picker -->
    <EmojiPicker
      v-if="showEmojiPicker"
      :show="showEmojiPicker"
      @select="handleEmojiSelect"
      @close="showEmojiPicker = false"
      @position-updated="handlePickerPosition"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import EmojiPicker from './EmojiPicker.vue';

const emit = defineEmits(['add-reaction', 'reply', 'menu-hover', 'menu-leave']);
const showEmojiPicker = ref(false);
const menuRef = ref(null);

// Handle clicking outside to close emoji picker
const handleClickOutside = (event) => {
  if (showEmojiPicker.value) {
    const picker = event.target.closest('.emoji-picker');
    const button = event.target.closest('.menu-button');
    if (!picker && !button) {
      showEmojiPicker.value = false;
    }
  }
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const handlePickerPosition = (position) => {
  // If we need to adjust the menu position based on picker position
  if (position.bottom) {
    menuRef.value.style.bottom = 'auto';
    menuRef.value.style.bottom = '0px';
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleEmojiSelect = (emoji) => {
  emit('add-reaction', emoji);
  showEmojiPicker.value = false;
};
</script>

<style scoped>
.hover-menu {
  position: absolute;
  top: -40px;
  right: 0;
  z-index: 100;
}

.menu-buttons {
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  padding: 4px;
  display: flex;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: none;
  color: #D1D2D3;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
}

.menu-button:hover {
  background-color: #27242C;
  color: #FFFFFF;
}

.menu-button svg {
  flex-shrink: 0;
}
</style> 