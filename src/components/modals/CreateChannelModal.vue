<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create a channel</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="channel-name-section">
          <label>Channel name</label>
          <div class="input-container">
            <span class="hash">#</span>
            <input 
              type="text" 
              v-model="channelName" 
              placeholder="e.g. plan-budget"
              maxlength="80"
              @input="validateChannelName"
            />
            <span class="char-count">{{ channelName.length }}/80</span>
          </div>
          <p class="help-text">
            Channels are where conversations happen around a topic. Use a name that is easy to find and understand.
          </p>
        </div>

        <div class="channel-description-section">
          <label>Description <span class="optional">(optional)</span></label>
          <div class="input-container description-container">
            <textarea 
              v-model="channelDescription" 
              placeholder="Add a description about your channel"
              maxlength="250"
              rows="3"
            ></textarea>
            <span class="char-count">{{ channelDescription.length }}/250</span>
          </div>
          <p class="help-text">
            What's this channel about? Add details to help others understand its purpose.
          </p>
        </div>

        <div class="visibility-section">
          <h3>Visibility</h3>
          <div class="visibility-options">
            <label class="visibility-option" :class="{ selected: !isPrivate }">
              <input 
                type="radio" 
                name="visibility" 
                :value="false"
                v-model="isPrivate"
              />
              <div class="option-content">
                <div class="option-header">
                  <span class="icon">#</span>
                  <span class="title">Public</span>
                </div>
                <p class="description">Anyone in the workspace can join</p>
              </div>
            </label>

            <label class="visibility-option" :class="{ selected: isPrivate }">
              <input 
                type="radio" 
                name="visibility" 
                :value="true"
                v-model="isPrivate"
              />
              <div class="option-content">
                <div class="option-header">
                  <span class="icon">🔒</span>
                  <span class="title">Private</span>
                </div>
                <p class="description">Can only be viewed or joined by invitation</p>
              </div>
            </label>
          </div>
        </div>
        
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">Cancel</button>
        <button 
          class="create-button" 
          :disabled="!isValid || isLoading"
          @click="createChannel"
        >
          {{ isLoading ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useSocket } from '../../services/socketService';
const store = useStore();
const {
  sendChannelCreated,
} = useSocket(store);

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'created']);

const route = useRoute();
const router = useRouter();

const channelName = ref('');
const channelDescription = ref('');
const isPrivate = ref(false);
const isLoading = ref(false);
const error = ref('');

const isValid = computed(() => {
  return channelName.value.length > 0 && 
         channelName.value.length <= 80 && 
         /^[a-z0-9-]+$/.test(channelName.value);
});

const validateChannelName = () => {
  // Only convert to lowercase while typing
  channelName.value = channelName.value.toLowerCase();
};

const formatChannelName = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '-') // Replace invalid chars (except spaces) with hyphens
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
};

const createChannel = async () => {
  if (!isValid.value) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const workspaceId = route.params.workspaceId;
    const token = store.getters['auth/token'];
    
    const channelData = {
      name: formatChannelName(channelName.value),
      description: channelDescription.value,
      type: isPrivate.value ? 'private' : 'public'
    };

    const channel = await store.dispatch('channels/createChannel', {
      workspaceId,
      channelData,
      token
    });

    // Add the new channel to the channels list
    store.commit('channels/ADD_CHANNEL', channel);

    // Set the new channel as active
    store.commit('channels/SET_CURRENT_CHANNEL', channel);

    // Notify other users about the new channel
    sendChannelCreated(channel);

    // Update URL without triggering a full navigation
    router.replace({
      name: 'channel',
      params: {
        workspaceId,
        channelId: channel._id
      }
    }).catch(() => {}); // Catch any navigation errors silently

    // Reset form
    channelName.value = '';
    channelDescription.value = '';
    isPrivate.value = false;
    
    // Close modal and emit created event
    emit('created', channel);
    emit('close');
  } catch (err) {
    console.error('Error creating channel:', err);
    error.value = 'Failed to create channel. Please try again.';
  } finally {
    isLoading.value = false;
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
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1A1D21;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  margin: 20px;
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
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #ABABAD;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: 28px;
  padding-bottom: 32px;
}

.channel-name-section {
  margin-bottom: 28px;
}

.channel-name-section label {
  display: block;
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: 8px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #222529;
  border: 1px solid #565856;
  border-radius: 4px;
  padding: 8px 12px;
}

.input-container .hash {
  color: #ABABAD;
  margin-right: 8px;
}

.input-container input {
  flex: 1;
  background: none;
  border: none;
  color: #FFFFFF;
  font-size: 15px;
  outline: none;
}

.input-container .char-count {
  color: #ABABAD;
  font-size: 13px;
}

.help-text {
  color: #ABABAD;
  font-size: 13px;
  margin-top: 8px;
}

.channel-description-section {
  margin-bottom: 28px;
}

.channel-description-section label {
  display: block;
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: 8px;
}

.channel-description-section .optional {
  color: #ABABAD;
  font-weight: normal;
  font-size: 13px;
}

.description-container {
  padding: 4px 12px;
}

.description-container textarea {
  width: 100%;
  background: none;
  border: none;
  color: #FFFFFF;
  font-size: 15px;
  outline: none;
  resize: none;
  font-family: inherit;
}

.visibility-section {
  margin-top: 24px;
}

.visibility-section h3 {
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visibility-option {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #4B4B4B;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #222529;
}

.visibility-option:hover {
  border-color: #ABABAD;
  background-color: #2C2D30;
}

.visibility-option.selected {
  border-color: #1264A3;
  background-color: rgba(18, 100, 163, 0.1);
}

.visibility-option input[type="radio"] {
  margin: 4px 12px 0 0;
  width: 16px;
  height: 16px;
  accent-color: #1264A3;
  cursor: pointer;
}

.option-content {
  flex: 1;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.option-header .icon {
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-header .title {
  color: #FFFFFF;
  font-weight: 600;
  font-size: 15px;
}

.visibility-option .description {
  color: #ABABAD;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  padding-left: 28px;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #4B4B4B;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  background: none;
  border: none;
  color: #ABABAD;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.create-button {
  background-color: #007A5A;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  min-width: 80px;
}

.create-button:disabled {
  background-color: #4B4B4B;
  cursor: not-allowed;
}

.error-message {
  color: #E01E5A;
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
}

/* Update the modal body padding for better spacing */
.modal-body {
  padding: 28px;
  padding-bottom: 32px;
}

/* Add a subtle hover effect for better interactivity */
.visibility-option:hover .option-header .title {
  color: #FFFFFF;
}

.visibility-option:hover .description {
  color: #D1D2D3;
}

/* Add focus styles for accessibility */
.visibility-option:focus-within {
  outline: none;
  border-color: #1264A3;
  box-shadow: 0 0 0 2px rgba(18, 100, 163, 0.3);
}

/* Add active state for better feedback */
.visibility-option:active {
  transform: scale(0.995);
}
</style> 