<template>
  <div class="chat-container">
    <!-- Text Input and Bottom Tools -->
    <div class="text-input-container">
      <div class="input-wrapper">
        <!-- Top Formatting Tools -->
        <div class="formatting-tools">
          <button 
            v-for="(icon, index) in topRowIcons" 
            :key="index" 
            class="format-button"
            @click="handleFormatClick(icon)"
            :title="getFormatTooltip(icon)"
          >
            <component :is="icon" class="tool-icon" />
          </button>
        </div>
        
        <!-- Text Input and Bottom Tools -->
        <div class="text-input-container">
          <textarea 
            v-model="messageText"
            rows="1"
            :placeholder="placeholder"
            class="text-input"
            @input="handleInput"
            @keydown="handleKeyDown"
            @keydown.enter.prevent="handleSend"
            @keydown.enter.shift.exact="messageText += '\n'"
            @paste="handlePaste"
            @drop.prevent="handleDrop"
          ></textarea>
          <div class="input-actions">
            <div class="action-buttons-right" v-show="messageText.trim()">
              <button 
                class="cancel-button"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button 
                class="send-button"
                @click="handleSend"
                :disabled="!messageText.trim()"
              >
                {{ message ? 'Save Changes' : 'Send' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Mention Dropdown -->
    <div v-if="showMentionDropdown" class="mention-dropdown">
      <div class="mention-list">
        <div 
          v-for="user in filteredChannelUsers" 
          :key="user._id"
          class="mention-item"
          :class="{ 'selected': selectedMentionIndex === user._id }"
          @click="selectMention(user)"
          @mouseenter="selectedMentionIndex = user._id"
        >
          <div class="user-avatar">
            <img 
              v-if="user.avatarUrl" 
              :src="user.avatarUrl" 
              :alt="user.displayName"
              class="avatar-image"
            />
            <div v-else class="default-avatar">
              {{ getInitials(user.displayName) }}
            </div>
          </div>
          <div class="user-info">
            <div class="display-name">{{ user.displayName }}</div>
            <div class="username">{{ user.username }}</div>
          </div>
          <div class="user-status">
            <div 
              class="status-indicator"
              :class="{
                'online': user.isOnline && !user.isAway,
                'away': user.isAway,
                'offline': !user.isOnline && !user.isAway
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Mention Dropdown -->
    <div v-if="showChannelDropdown" class="channel-dropdown">
      <div class="channel-list">
        <div 
          v-for="channel in filteredChannels" 
          :key="channel._id"
          class="channel-item"
          :class="{ 'selected': selectedChannelIndex === channel._id }"
          @click="selectChannel(channel)"
          @mouseenter="selectedChannelIndex = channel._id"
        >
          <div class="channel-info">
            <div class="channel-name">
              <span class="hash">#</span>
              {{ channel.name }}
            </div>
            <div class="channel-description">{{ channel.description || 'No description' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useSocket } from '@/services/socketService';
import { 
  Bold, Italic, Strikethrough, Link, ListOrdered, List, AlignLeft, 
  Code, Quote
} from 'lucide-vue-next';

const props = defineProps({
  message: {
    type: Object,
    required: false,
    default: null
  },
  placeholder: {
    type: String,
    required: false,
    default: 'Message'
  },
  type: {
    type: String,
    required: false,
    default: ''
  },
});

// ========== VUEX & SOCKET SETUP ==========
const store = useStore();
const { sendChannelMention, sendConversationMention } = useSocket(store);

// ========== COMPONENT STATE ==========
const messageText = ref(props.message?.content || '');
const attachments = ref(props.message?.attachments || []);
const replyToThread = ref(props.message?.threadId || null);

const topRowIcons = [Bold, Italic, Strikethrough, Link, ListOrdered, List, AlignLeft, Code, Quote];
const emit = defineEmits(['send-message', 'edit-message', 'cancel']);
const mentionedUsers = ref(new Set());
const showMentionDropdown = ref(false);
const selectedMentionIndex = ref(null);
const mentionStartIndex = ref(-1);
const mentionSearchTerm = ref("");

// ========== CHANNEL USERS (FOR MENTIONS) ==========
const channelUsers = computed(() => {
  const users = store.getters['channels/currentChannelUsers'] || [];
  return users.map(user => ({
    ...user,
    isOnline: store.getters['users/isUserOnline'](user._id),
    isAway: store.getters['users/isUserAway'](user._id)
  }));
});

// ========== UTILS ==========
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ========== CORE ACTIONS ==========
const handleCancel = () => {
  messageText.value = '';
  attachments.value = [];
  replyToThread.value = null;
  emit('cancel');
};

const filteredChannelUsers = computed(() => {
  // Remove leading '@' if present
  const rawTerm = mentionSearchTerm.value.replace(/^@/, '');
  // If empty, return all users
  if (!rawTerm) return channelUsers.value;

  const lowerTerm = rawTerm.toLowerCase();
  return channelUsers.value.filter(user =>
    user.displayName.toLowerCase().includes(lowerTerm) ||
    user.username.toLowerCase().includes(lowerTerm)
  );
});

const handleSend = () => {
  if (!messageText.value.trim()) return;

  const messageData = {
    content: messageText.value.trim(),
    threadId: replyToThread.value,
    attachments: attachments.value.map(attachment => ({
      url: attachment.url,
      type: attachment.type,
      name: attachment.name
    })),
  };

  // Mention logic
  if (mentionedUsers.value.size > 0) {
    const channelId = store.getters['channels/currentChannel']?._id;
    const conversationId = store.getters['conversations/currentConversation']?._id;
    const currentUserId = store.getters['auth/currentUser']?._id;

    // Channel mention
    if (channelId) {
      mentionedUsers.value.forEach(userId => {
        sendChannelMention({
          channelId,
          mentionedUserId: userId,
          message: messageText.value
        });
      });
    }
    // Conversation mention
    else if (conversationId) {
      // Currently we just send one mention event for all mentions in conversation
      sendConversationMention({
        conversationId,
        message: messageText.value,
        senderId: currentUserId
      });
    }
  }

  // Distinguish between editing vs sending
  if (props.message) {
    emit('edit-message', messageData);
  } else if(props.type === 'bot') {
    messageData.mentionedChannels = Array.from(mentionedChannels.value);
    emit('send-bot-message', messageData)
  } else {
      emit('send-message', messageData);
    }
    // Reset
    messageText.value = '';
    attachments.value = [];
    replyToThread.value = null;
    mentionedUsers.value.clear();
    mentionedChannels.value.clear();
};

const handlePaste = async (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      await handleFileUpload(file);
    }
  }
};

const handleDrop = async (event) => {
  const files = event.dataTransfer?.files;
  if (!files) return;

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      await handleFileUpload(file);
    }
  }
};

const handleFileUpload = async (file) => {
  try {
    // TODO: Upload to your server
    // const response = await fetch('/api/upload', { method: 'POST', body: formData });
    // const { url } = await response.json();
    attachments.value.push({
      url: URL.createObjectURL(file), // Temporary preview
      type: file.type,
      name: file.name
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
  }
};

// ========== TEXT FORMATTING & SHORTCUTS ==========
const handleFormatClick = (formatType) => {
  const textarea = document.querySelector('.text-input');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = messageText.value.substring(start, end);

  let formattedText = '';
  let cursorOffset = 0;

  switch (formatType) {
    case Bold:
      formattedText = `**${selectedText}**`;
      cursorOffset = 2;
      break;
    case Italic:
      formattedText = `_${selectedText}_`;
      cursorOffset = 1;
      break;
    case Strikethrough:
      formattedText = `~~${selectedText}~~`;
      cursorOffset = 2;
      break;
    case Code:
      if (selectedText.includes('\n')) {
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        cursorOffset = 4;
      } else {
        formattedText = `\`${selectedText}\``;
        cursorOffset = 1;
      }
      break;
    case Quote:
      formattedText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
      cursorOffset = 2;
      break;
    case ListOrdered:
      formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
      cursorOffset = 3;
      break;
    case List:
      formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
      cursorOffset = 2;
      break;
    case Link:
      formattedText = `[${selectedText}](url)`;
      cursorOffset = 3;
      break;
  }

  messageText.value = 
    messageText.value.substring(0, start) +
    formattedText +
    messageText.value.substring(end);

  nextTick(() => {
    textarea.focus();
    if (start === end) {
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    } else {
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }
  });
};

const handleKeyDown = (e) => {
  // Handle channel dropdown navigation
  if (showChannelDropdown.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = filteredChannels.value.findIndex(
        channel => channel._id === selectedChannelIndex.value
      );
      const nextIndex = (currentIndex + 1) % filteredChannels.value.length;
      selectedChannelIndex.value = filteredChannels.value[nextIndex]._id;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = filteredChannels.value.findIndex(
        channel => channel._id === selectedChannelIndex.value
      );
      const prevIndex = currentIndex <= 0 ? filteredChannels.value.length - 1 : currentIndex - 1;
      selectedChannelIndex.value = filteredChannels.value[prevIndex]._id;
    } else if (e.key === 'Enter' && selectedChannelIndex.value) {
      e.preventDefault();
      const selectedChannel = filteredChannels.value.find(
        channel => channel._id === selectedChannelIndex.value
      );
      if (selectedChannel) {
        selectChannel(selectedChannel);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (selectedChannelIndex.value) {
        const selectedChannel = filteredChannels.value.find(
          channel => channel._id === selectedChannelIndex.value
        );
        if (selectedChannel) {
          selectChannel(selectedChannel);
        }
      }
    }
  }

  // Handle existing keyboard shortcuts
  if (e.metaKey || e.ctrlKey) {
    switch (e.key) {
      case 'b':
        e.preventDefault();
        handleFormatClick(Bold);
        break;
      case 'i':
        e.preventDefault();
        handleFormatClick(Italic);
        break;
      case 'k':
        e.preventDefault();
        handleFormatClick(Link);
        break;
      case 'e':
        e.preventDefault();
        handleFormatClick(Code);
        break;
      case 'q':
        e.preventDefault();
        handleFormatClick(Quote);
        break;
    }
  }
};

const getFormatTooltip = (icon) => {
  const tooltips = {
    [Bold]: 'Bold (⌘B)',
    [Italic]: 'Italic (⌘I)',
    [Strikethrough]: 'Strikethrough',
    [Link]: 'Link (⌘K)',
    [ListOrdered]: 'Numbered List',
    [List]: 'Bullet List',
    [Code]: 'Code (⌘E)',
    [Quote]: 'Quote (⌘Q)'
  };
  return tooltips[icon] || '';
};

// ========== MENTIONS ==========
const showChannelDropdown = ref(false);
const channelSearchTerm = ref("");
const channelStartIndex = ref(-1);
const selectedChannelIndex = ref(null);
const mentionedChannels = ref(new Set());

// Add computed property for channels
const channels = computed(() => store.getters['channels/channels'] || []);

// Add computed property for filtered channels
const filteredChannels = computed(() => {
  const rawTerm = channelSearchTerm.value.replace(/^#/, '');
  if (!rawTerm) return channels.value;

  const lowerTerm = rawTerm.toLowerCase();
  return channels.value.filter(channel =>
    channel.name.toLowerCase().includes(lowerTerm)
  );
});

// Modify handleInput to handle both @ and # mentions
const handleInput = (event) => {
  const text = messageText.value;
  const cursorPosition = event.target.selectionStart;

  // Check for '@' symbol
  if (text[cursorPosition - 1] === '@') {
    showMentionDropdown.value = true;
    showChannelDropdown.value = false;
    const afterAt = text.slice(mentionStartIndex.value + 1, cursorPosition);
    mentionSearchTerm.value = afterAt;
    mentionStartIndex.value = cursorPosition - 1;
    selectedMentionIndex.value = channelUsers.value[0]?._id;
  } 
  // Check for '#' symbol
  else if (text[cursorPosition - 1] === '#') {
    showChannelDropdown.value = true;
    showMentionDropdown.value = false;
    channelStartIndex.value = cursorPosition - 1;
    const afterHash = text.slice(channelStartIndex.value + 1, cursorPosition);
    channelSearchTerm.value = afterHash;
    selectedChannelIndex.value = channels.value[0]?._id;
  }
  // Update search terms for active dropdowns
  else {
    if (showMentionDropdown.value) {
      const afterAt = text.slice(mentionStartIndex.value + 1, cursorPosition);
      mentionSearchTerm.value = afterAt;
      if (!afterAt.length || afterAt.length > 25) {
        showMentionDropdown.value = false;
      }
    } else if (showChannelDropdown.value) {
      const afterHash = text.slice(channelStartIndex.value + 1, cursorPosition);
      channelSearchTerm.value = afterHash;
      if (!afterHash.length || afterHash.length > 25) {
        showChannelDropdown.value = false;
      }
    }
  }
};

// Add selectChannel method
const selectChannel = (channel) => {
  const text = messageText.value;
  const beforeMention = text.substring(0, channelStartIndex.value);
  const afterMention = text.substring(channelStartIndex.value).replace(/^#\w*/, '');

  // Replace with full channel mention
  messageText.value = `${beforeMention}#${channel.name}${afterMention}`;

  // Track the mentioned channel
  mentionedChannels.value.add(channel._id);

  // Move cursor
  nextTick(() => {
    const textarea = document.querySelector('.text-input');
    const cursorPosition = beforeMention.length + channel.name.length + 1;
    textarea.selectionStart = cursorPosition;
    textarea.selectionEnd = cursorPosition;
    textarea.focus();
  });

  showChannelDropdown.value = false;
};

// Modify handleClickOutside to handle both dropdowns
const handleClickOutside = (event) => {
  const mentionDropdown = document.querySelector('.mention-dropdown');
  const channelDropdown = document.querySelector('.channel-dropdown');
  const textInput = document.querySelector('.text-input');
  
  if (
    (showMentionDropdown.value || showChannelDropdown.value) &&
    !mentionDropdown?.contains(event.target) &&
    !channelDropdown?.contains(event.target) &&
    !textInput.contains(event.target)
  ) {
    showMentionDropdown.value = false;
    showChannelDropdown.value = false;
  }
};

// Modify handleKeydownGlobal to handle both dropdowns
const handleKeydownGlobal = (e) => {
  if (e.key === 'Escape') {
    showMentionDropdown.value = false;
    showChannelDropdown.value = false;
  }
};

// ========== LIFECYCLE HOOKS ==========
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydownGlobal);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydownGlobal);
});
</script>

<style scoped>
.chat-container {
  width: 100%;
  background-color: #222529;
  border: 1px solid #4B4B4B;
  border-radius: 4px;
}

.text-input-container {
  width: 100%;
}

.input-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.formatting-tools {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #4B4B4B;
}

.format-button {
  background: none;
  border: none;
  color: #ABABAD;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.format-button:hover {
  background-color: #27242C;
  color: #FFFFFF;
}

.tool-icon {
  width: 16px;
  height: 16px;
}

.text-input {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #FFFFFF;
  resize: none;
  padding: 12px;
  min-height: 40px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.text-input::placeholder {
  color: #9CA3AF;
}

.text-input:focus {
  outline: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.action-buttons-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-button {
  background: none;
  border: none;
  color: #1264A3;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: rgba(18, 100, 163, 0.1);
}

.send-button {
  background-color: #007a5a;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.send-button:hover {
  background-color: #006c4f;
}

.send-button:disabled {
  background-color: #238636;
  opacity: 0.5;
  cursor: not-allowed;
}

.mention-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  margin-bottom: 4px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mention-list {
  padding: 4px 0;
}

.mention-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
  gap: 12px;
}

.mention-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.mention-item.selected {
  background-color: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background-color: #4B4B4B;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.display-name {
  color: #FFFFFF;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  color: #A3A6AA;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.status-indicator.online {
  background-color: #43B581;
}

.status-indicator.away {
  background-color: #FAA61A;
}

.status-indicator.offline {
  background-color: #747F8D;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .mention-dropdown {
    max-height: 200px;
  }

  .mention-item {
    padding: 6px 8px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }

  .display-name {
    font-size: 13px;
  }

  .username {
    font-size: 11px;
  }
}

.channel-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  background-color: #1A1D21;
  border: 1px solid #4B4B4B;
  border-radius: 6px;
  margin-bottom: 4px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.channel-list {
  padding: 4px 0;
}

.channel-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
}

.channel-item:hover,
.channel-item.selected {
  background-color: rgba(255, 255, 255, 0.1);
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-name {
  color: #FFFFFF;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hash {
  color: #ABABAD;
}

.channel-description {
  color: #A3A6AA;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .channel-dropdown {
    max-height: 200px;
  }

  .channel-item {
    padding: 6px 8px;
  }

  .channel-name {
    font-size: 13px;
  }

  .channel-description {
    font-size: 11px;
  }
}
</style>