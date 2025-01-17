<template>
  <BaseModal
    @close="handleClose"
    title="Set yourself as away"
  >
    <div class="away-modal">
      <div class="away-section">
        <label class="switch">
          <input 
            type="checkbox"
            v-model="isAway"
          />
          <span class="slider"></span>
        </label>
        <span class="away-text">Set as away</span>
      </div>

      <div v-if="isAway" class="bot-section">
        <div class="bot-header">
          <label class="switch">
            <input 
              type="checkbox"
              v-model="botConfig.isEnabled"
            />
            <span class="slider"></span>
          </label>
          <span class="bot-text">Enable AI Assistant</span>
        </div>

        <div v-if="botConfig.isEnabled" class="bot-config">
          <div class="form-group">
            <label>Auto-reply message</label>
            <textarea 
              v-model="botConfig.autoReply"
              placeholder="Enter your away message..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Response delay (seconds)</label>
            <input 
              type="number"
              v-model.number="delayInSeconds"
              min="0"
              max="30"
              step="0.5"
            />
          </div>

          <div class="form-group">
            <label>Enable in channels</label>
            <div class="channels-list">
              <div 
                v-for="channel in channels"
                :key="channel._id"
                class="channel-item"
              >
                <label class="checkbox-container">
                  <input 
                    type="checkbox"
                    :value="channel._id"
                    v-model="botConfig.allowedChannels"
                  />
                  <span class="checkmark"></span>
                  <span class="channel-name"># {{ channel.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Enable in conversations</label>
            <div class="conversations-list">
              <div 
                v-for="conversation in conversations"
                :key="conversation._id"
                class="conversation-item"
              >
                <label class="checkbox-container">
                  <input 
                    type="checkbox"
                    :value="conversation._id"
                    v-model="botConfig.allowedConversations"
                  />
                  <span class="checkmark"></span>
                  <span class="conversation-name">
                    {{ formatParticipants(conversation.participants) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button 
          @click="handleClose" 
          class="cancel-button"
        >
          Cancel
        </button>
        <button 
          @click="handleSave"
          class="save-button"
          :disabled="!isValid"
        >
          Save Changes
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import BaseModal from './BaseModal.vue';
import { useSocket } from '@/services/socketService';

const emit = defineEmits(['close']);
const store = useStore();
const { setBotMode } = useSocket(store);

const isAway = ref(store.getters['auth/isAway']);
const botConfig = ref({
  isEnabled: store.getters['auth/botMode'].isEnabled,
  autoReply: store.getters['auth/botMode'].autoReply,
  allowedChannels: [...store.getters['auth/botMode'].allowedChannels],
  allowedConversations: [...store.getters['auth/botMode'].allowedConversations],
  responseDelay: store.getters['auth/botMode'].responseDelay
});

const delayInSeconds = computed({
  get: () => botConfig.value.responseDelay / 1000,
  set: (val) => botConfig.value.responseDelay = val * 1000
});

const channels = computed(() => store.getters['channels/channels']);
const conversations = computed(() => store.getters['conversations/getConversations']);

const isValid = computed(() => {
  if (!isAway.value) return true;
  if (!botConfig.value.isEnabled) return true;
  return botConfig.value.autoReply.trim().length > 0 &&
         botConfig.value.responseDelay >= 0 &&
         botConfig.value.responseDelay <= 30000;
});

const formatParticipants = (participants) => {
  const currentUserId = store.getters['auth/currentUser']?._id;
  const otherParticipants = participants.filter(p => p._id !== currentUserId);
  return otherParticipants.map(p => p.displayName).join(', ');
};

const handleSave = async () => {
  try {
    await store.dispatch('auth/setAwayStatus', {
      isAway: isAway.value,
      botConfig: botConfig.value
    });
    
    // Update socket with bot mode
    if (isAway.value && botConfig.value.isEnabled) {
      setBotMode({
        channelIds: botConfig.value.allowedChannels,
        conversationIds: botConfig.value.allowedConversations,
        enabled: true
      });
    } else {
      setBotMode({
        channelIds: [],
        conversationIds: [],
        enabled: false
      });
    }
    
    emit('close');
  } catch (error) {
    console.error('Failed to save away status:', error);
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style>
.away-modal {
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.away-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.away-text {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

.bot-section {
  border-top: 1px solid #3D3D3D;
  padding-top: 24px;
}

.bot-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.bot-text {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

.bot-config {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #9CA3AF;
  font-size: 14px;
  font-weight: 500;
}

textarea, input[type="number"] {
  width: 100%;
  padding: 12px;
  background: #1F1F1F;
  border: 1px solid #3D3D3D;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  transition: all 0.2s ease;
}

textarea:focus, input[type="number"]:focus {
  outline: none;
  border-color: #5865F2;
  box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
}

.channels-list, .conversations-list {
  max-height: 200px;
  overflow-y: auto;
  background: #1F1F1F;
  border: 1px solid #3D3D3D;
  border-radius: 8px;
  padding: 8px;
}

.channel-item, .conversation-item {
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
}

.channel-item:hover, .conversation-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: #FFFFFF;
  font-size: 14px;
  position: relative;
  padding-left: 28px; /* Space for the checkbox */
}

.checkbox-container input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Create a custom checkbox */
.checkmark {
  position: absolute;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #1F1F1F;
  border: 2px solid #3D3D3D;
  border-radius: 4px;
  transition: all 0.2s ease;
}

/* On hover */
.checkbox-container:hover .checkmark {
  border-color: #5865F2;
}

/* When checked */
.checkbox-container input:checked ~ .checkmark {
  background-color: #5865F2;
  border-color: #5865F2;
}

/* Create the checkmark/indicator (hidden when not checked) */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

/* Show the checkmark when checked */
.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

/* Style the checkmark/indicator */
.checkbox-container .checkmark:after {
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.channel-name, .conversation-name {
  color: #FFFFFF;
  font-size: 14px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #3D3D3D;
}

.cancel-button, .save-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #3D3D3D;
  color: #FFFFFF;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.save-button {
  background: #5865F2;
  border: none;
  color: #FFFFFF;
}

.save-button:hover:not(:disabled) {
  background: #4752C4;
  transform: translateY(-1px);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3D3D3D;
  transition: .3s ease-in-out;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .3s ease-in-out;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #5865F2;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Scrollbar styling */
.channels-list::-webkit-scrollbar,
.conversations-list::-webkit-scrollbar {
  width: 8px;
}

.channels-list::-webkit-scrollbar-track,
.conversations-list::-webkit-scrollbar-track {
  background: #1F1F1F;
  border-radius: 4px;
}

.channels-list::-webkit-scrollbar-thumb,
.conversations-list::-webkit-scrollbar-thumb {
  background: #3D3D3D;
  border-radius: 4px;
  border: 2px solid #1F1F1F;
}

.channels-list::-webkit-scrollbar-thumb:hover,
.conversations-list::-webkit-scrollbar-thumb:hover {
  background: #4D4D4D;
}
</style>