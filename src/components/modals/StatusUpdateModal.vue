<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Set a status</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="status-input-container">
        <button class="emoji-button" @click="toggleEmojiPicker">
          <span v-if="selectedEmoji">{{ selectedEmoji }}</span>
          <span v-else>😊</span>
        </button>
        <input 
          ref="inputRef"
          type="text" 
          v-model="statusText"
          placeholder="What's your status?"
          class="status-input"
        />
      </div>

      <Teleport to="body">
        <EmojiPicker 
          v-if="showEmojiPicker"
          @select="onSelectEmoji"
          @close="showEmojiPicker = false"
        />
      </Teleport>

      <div class="status-suggestions">
        <h3>Recent</h3>
        <div class="suggestion-list">
          <button class="suggestion-item" @click="selectStatus('In a meeting', '📅')">
            <span class="suggestion-emoji">📅</span>
            <div class="suggestion-text">
              <span class="suggestion-label">In a meeting</span>
            </div>
          </button>
          <button class="suggestion-item" @click="selectStatus('Commuting', '🚌')">
            <span class="suggestion-emoji">🚌</span>
            <div class="suggestion-text">
              <span class="suggestion-label">Commuting</span>
            </div>
          </button>
          <button class="suggestion-item" @click="selectStatus('Out sick', '🤒')">
            <span class="suggestion-emoji">🤒</span>
            <div class="suggestion-text">
              <span class="suggestion-label">Out sick</span>
            </div>
          </button>
          <button class="suggestion-item" @click="selectStatus('Vacationing', '🌴')">
            <span class="suggestion-emoji">🌴</span>
            <div class="suggestion-text">
              <span class="suggestion-label">Vacationing</span>
            </div>
          </button>
          <button class="suggestion-item" @click="selectStatus('Working remotely', '🏡')">
            <span class="suggestion-emoji">🏡</span>
            <div class="suggestion-text">
              <span class="suggestion-label">Working remotely</span>
            </div>
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="closeModal">Cancel</button>
        <button 
          class="save-button" 
          :disabled="!statusText && !selectedEmoji"
          @click="saveStatus"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import EmojiPicker from '../messages/EmojiPicker.vue';

const store = useStore();
const emit = defineEmits(['close']);

const isOpen = ref(true);
const statusText = ref('');
const selectedEmoji = ref('');
const showEmojiPicker = ref(false);
const inputRef = ref(null);

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && showEmojiPicker.value) {
    showEmojiPicker.value = false;
  }
};

onMounted(() => {
  inputRef.value?.focus();
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

const closeModal = () => {
  isOpen.value = false;
  emit('close');
};

const toggleEmojiPicker = (e) => {
  e.stopPropagation();
  showEmojiPicker.value = !showEmojiPicker.value;
};

const onSelectEmoji = (emoji) => {
  selectedEmoji.value = emoji;
  showEmojiPicker.value = false;
};

const selectStatus = (text, emoji) => {
  statusText.value = text;
  selectedEmoji.value = emoji;
};

const saveStatus = async () => {
  try {
    await store.dispatch('auth/updateStatus', {
      text: statusText.value,
      emoji: selectedEmoji.value
    });
    closeModal();
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};
</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  background-color: #1A1D21;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #D1D2D3;
}

.close-button {
  background: none;
  border: none;
  color: #D1D2D3;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.status-input-container {
  padding: 20px 28px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.emoji-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.emoji-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.status-input {
  flex: 1;
  background: none;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
  color: #D1D2D3;
  font-size: 16px;
  padding: 8px 12px;
  transition: border-color 0.2s ease;
}

.status-input:focus {
  outline: none;
  border-color: #1264A3;
  box-shadow: 0 0 0 1px #1264A3;
}

.status-input::placeholder {
  color: #9B9B9B;
}

.status-suggestions {
  padding: 20px 28px;
}

.status-suggestions h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 700;
  color: #D1D2D3;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #D1D2D3;
  text-align: left;
  width: 100%;
}

.suggestion-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.suggestion-emoji {
  font-size: 20px;
}

.suggestion-text {
  display: flex;
  flex-direction: column;
}

.suggestion-label {
  font-size: 14px;
}

.modal-footer {
  padding: 20px 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-button, .save-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  background: none;
  border: none;
  color: #D1D2D3;
}

.cancel-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.save-button {
  background-color: #007A5A;
  border: none;
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: #148567;
}

.save-button:disabled {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

.emoji-picker-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1100;
}
</style> 