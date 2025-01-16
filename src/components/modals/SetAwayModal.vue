<template>
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Set yourself as away</h2>
          <button class="close-button" @click="$emit('close')">×</button>
        </div>
        
        <div class="modal-body">
          <div class="bot-mode-section">
            <label class="switch">
              <input type="checkbox" v-model="botMode">
              <span class="slider"></span>
            </label>
            <span class="bot-mode-label">Turn on bot mode</span>
          </div>
  
          <div class="options-section" v-if="botMode">
            <div class="option">
              <div class="section-header">
                <label class="checkbox-container">
                  <input type="checkbox" v-model="showChannels">
                  <span class="checkmark"></span>
                  Channels
                </label>
                <button 
                  v-if="showChannels" 
                  class="select-all-button"
                  @click="toggleAllChannels"
                >
                  {{ allChannelsSelected ? 'Deselect All' : 'Select All' }}
                </button>
              </div>
              
              <div class="list" v-if="showChannels">
                <div v-for="channel in channels" :key="channel._id" class="list-item">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="selectedChannels" 
                      :value="channel._id"
                    >
                    <span class="checkmark"></span>
                    # {{ channel.name }}
                  </label>
                </div>
              </div>
            </div>
  
            <div class="option">
              <div class="section-header">
                <label class="checkbox-container">
                  <input type="checkbox" v-model="showDMs">
                  <span class="checkmark"></span>
                  Direct Messages
                </label>
                <button 
                  v-if="showDMs" 
                  class="select-all-button"
                  @click="toggleAllDMs"
                >
                  {{ allDMsSelected ? 'Deselect All' : 'Select All' }}
                </button>
              </div>
              
              <div class="list" v-if="showDMs">
                <div v-for="conversation in conversations" :key="conversation._id" class="list-item">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="selectedDMs" 
                      :value="conversation._id"
                    >
                    <span class="checkmark"></span>
                    <div class="conversation-participants">
                      {{ formatParticipants(conversation.participants) }}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
  
          <button 
            class="save-button" 
            @click="handleSave"
            :disabled="!botMode || (!selectedChannels.length && !selectedDMs.length)"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  
  const store = useStore();
  const emit = defineEmits(['close']);
  
  const botMode = ref(false);
  const showChannels = ref(false);
  const showDMs = ref(false);
  const selectedChannels = ref([]);
  const selectedDMs = ref([]);
  
  const channels = computed(() => store.getters['channels/channels']);
  const conversations = computed(() => store.getters['conversations/getConversations']);
  const currentUser = computed(() => store.getters['auth/currentUser']);
  
  const formatParticipants = (participants) => {
    if (!participants || !participants.length) return '';
    
    // Filter out the current user
    const otherParticipants = participants.filter(p => p._id !== currentUser.value._id);
    
    if (otherParticipants.length === 0) return 'You';
    if (otherParticipants.length === 1) return otherParticipants[0].displayName;
    
    return `${otherParticipants[0].displayName} and ${otherParticipants.length - 1} others`;
  };
  
  const handleSave = async () => {
    await store.dispatch('auth/updateStatus', {
      botMode: botMode.value,
      channels: selectedChannels.value,
      directMessages: selectedDMs.value
    });
    emit('close');
  };
  
  const allChannelsSelected = computed(() => {
    return channels.value.length > 0 && selectedChannels.value.length === channels.value.length;
  });
  
  const allDMsSelected = computed(() => {
    return conversations.value.length > 0 && selectedDMs.value.length === conversations.value.length;
  });
  
  const toggleAllChannels = () => {
    if (allChannelsSelected.value) {
      selectedChannels.value = [];
    } else {
      selectedChannels.value = channels.value.map(channel => channel._id);
    }
  };
  
  const toggleAllDMs = () => {
    if (allDMsSelected.value) {
      selectedDMs.value = [];
    } else {
      selectedDMs.value = conversations.value.map(conversation => conversation._id);
    }
  };
  </script>
  
  <style scoped>
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
    max-width: 480px;
    margin: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
    color: #9CA3AF;
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    transition: color 0.2s ease;
  }
  
  .close-button:hover {
    color: #FFFFFF;
  }
  
  .modal-body {
    padding: 24px 28px;
  }
  
  .bot-mode-section {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #4B4B4B;
    margin-bottom: 20px;
  }
  
  .bot-mode-label {
    color: #FFFFFF;
    margin-left: 16px;
    font-size: 15px;
    font-weight: 500;
  }
  
  .options-section {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .option {
    margin-bottom: 8px;
  }
  
  .list {
    margin: 12px 0 0 32px;
    max-height: 200px;
    overflow-y: auto;
    border-left: 2px solid #4B4B4B;
    padding-left: 16px;
    padding-right: 12px;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
    mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
  }
  
  .list::-webkit-scrollbar {
    width: 8px;
  }
  
  .list::-webkit-scrollbar-track {
    background: #2D2D2D;
    border-radius: 4px;
    margin: 4px 0;
  }
  
  .list::-webkit-scrollbar-thumb {
    background: #4B4B4B;
    border-radius: 4px;
    border: 2px solid #2D2D2D;
    min-height: 40px;
  }
  
  .list::-webkit-scrollbar-thumb:hover {
    background: #606060;
  }
  
  .list-item {
    padding: 8px 0;
    transition: background-color 0.15s ease;
    border-radius: 4px;
    margin: 2px 0;
  }
  
  .list-item:hover {
    background-color: rgba(75, 75, 75, 0.2);
  }
  
  .list-item .checkbox-container {
    padding: 6px 8px;
    border-radius: 4px;
    transition: background-color 0.15s ease;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    color: #D1D2D3;
    cursor: pointer;
    font-size: 14px;
    user-select: none;
    padding: 4px 0;
    width: 100%;
  }
  
  .checkbox-container input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }
  
  .checkmark {
    position: relative;
    display: inline-block;
    width: 18px;
    height: 18px;
    margin-right: 12px;
    background-color: #2D2D2D;
    border: 2px solid #4B4B4B;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .checkbox-container:hover .checkmark {
    border-color: #1264A3;
    background-color: rgba(18, 100, 163, 0.1);
  }
  
  .checkbox-container input:checked ~ .checkmark {
    background-color: #1264A3;
    border-color: #1264A3;
  }
  
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 5px;
    top: 1px;
    width: 4px;
    height: 9px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }
  
  .save-button {
    width: 100%;
    padding: 12px;
    margin-top: 24px;
    background-color: #007a5a;
    color: #FFFFFF;
    border: none;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .save-button:hover:not(:disabled) {
    background-color: #006c4f;
  }
  
  .save-button:disabled {
    background-color: #2D2D2D;
    border: 1px solid #4B4B4B;
    color: #9CA3AF;
    cursor: not-allowed;
  }
  
  /* Switch styling */
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
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
    background-color: #4B4B4B;
    transition: .3s ease;
    border-radius: 34px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s ease;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .switch input:checked + .slider {
    background-color: #2BAC76;
  }
  
  .switch input:checked + .slider:before {
    transform: translateX(20px);
  }
  
  .switch input:focus + .slider {
    box-shadow: 0 0 1px #2BAC76;
  }
  
  /* Responsive styles */
  @media (max-width: 640px) {
    .modal-content {
      margin: 16px;
    }
    
    .modal-header {
      padding: 16px 20px;
    }
    
    .modal-header h2 {
      font-size: 20px;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .list {
      margin-left: 24px;
    }
  }
  
  /* Animation */
  @keyframes modalFade {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .modal-content {
    animation: modalFade 0.2s ease-out;
  }
  
  .conversation-participants {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  @media (max-height: 700px) {
    .list {
        max-height: 150px;
    }
  }
  
  @media (min-height: 800px) {
    .list {
        max-height: 300px;
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 4px;
  }
  
  .select-all-button {
    background: none;
    border: none;
    color: #1264A3;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: 85px;
    text-align: center;
    margin-left: 8px;
  }
  
  .select-all-button:hover {
    background-color: rgba(18, 100, 163, 0.1);
    text-decoration: none;
    color: #2186DB;
  }
  
  .select-all-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(18, 100, 163, 0.3);
  }
  
  .select-all-button:active {
    background-color: rgba(18, 100, 163, 0.2);
  }
  </style>