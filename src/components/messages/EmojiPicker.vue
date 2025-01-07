<template>
  <div class="emoji-picker" v-if="show" @click.stop>
    <div class="emoji-picker-header">
      <div class="search-container">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search all emoji"
          v-model="searchQuery"
        />
      </div>
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          <span class="category-icon">{{ category.icon }}</span>
        </button>
      </div>
    </div>

    <div class="emoji-sections">
      <div class="section" v-if="frequentlyUsed.length && !searchQuery">
        <h3 class="section-title">Frequently Used</h3>
        <div class="emoji-grid">
          <button 
            v-for="emoji in frequentlyUsed" 
            :key="emoji"
            class="emoji-button"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Smileys & People</h3>
        <div class="emoji-grid">
          <button 
            v-for="emoji in filteredEmojis" 
            :key="emoji"
            class="emoji-button"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <div class="emoji-picker-footer">
      <button class="add-emoji-button">Add Emoji</button>
      <button class="skin-tone-button">
        <span class="hand-emoji">👋</span>
        Skin Tone
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'close']);

const searchQuery = ref('');
const activeCategory = ref('smileys');

// Sample data - you would want to replace this with a proper emoji dataset
const frequentlyUsed = ref(['👍', '👀', '🎉', '👋', '✅']);
const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'];

const categories = [
  { id: 'recent', icon: '🕒' },
  { id: 'smileys', icon: '😀' },
  { id: 'nature', icon: '🌲' },
  { id: 'food', icon: '🍔' },
  { id: 'activities', icon: '⚽' },
  { id: 'travel', icon: '✈️' },
  { id: 'objects', icon: '💡' },
  { id: 'symbols', icon: '❤️' },
  { id: 'flags', icon: '🏁' }
];

const filteredEmojis = computed(() => {
  if (!searchQuery.value) return emojis;
  return emojis.filter(emoji => 
    emoji.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const selectEmoji = (emoji) => {
  emit('select', emoji);
  // Add to frequently used if not already there
  if (!frequentlyUsed.value.includes(emoji)) {
    frequentlyUsed.value.unshift(emoji);
    if (frequentlyUsed.value.length > 5) {
      frequentlyUsed.value.pop();
    }
  }
};
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  top: 0;
  left: 0;
  width: 350px;
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.emoji-picker-header {
  padding: 8px;
  border-bottom: 1px solid #4B4B4B;
}

.search-container {
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #222529;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
  color: #D1D2D3;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #1264A3;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.category-tab {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #D1D2D3;
  cursor: pointer;
}

.category-tab:hover {
  background-color: #27242C;
}

.category-tab.active {
  background-color: #27242C;
}

.emoji-sections {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  color: #ABABAD;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  padding: 0 4px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 2px;
}

.emoji-button {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-button:hover {
  background-color: #27242C;
}

.emoji-picker-footer {
  padding: 8px;
  border-top: 1px solid #4B4B4B;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-emoji-button {
  padding: 6px 12px;
  background-color: #007A5A;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.skin-tone-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: none;
  color: #D1D2D3;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}

.skin-tone-button:hover {
  background-color: #27242C;
}

.hand-emoji {
  font-size: 16px;
}
</style> 