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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { 
  Bold, Italic, Strikethrough, Link, ListOrdered, List, AlignLeft, 
  Code, Quote, Plus, Type, Smile, AtSign, Image, Mic, PenTool
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
  }
});

const store = useStore();
const messageText = ref(props.message?.content || '');
const attachments = ref(props.message?.attachments || []);
const replyToThread = ref(props.message?.threadId || null);

const topRowIcons = [Bold, Italic, Strikethrough, Link, ListOrdered, List, AlignLeft, Code, Quote];

const emit = defineEmits(['send-message', 'edit-message', 'cancel']);

const handleCancel = () => {
  messageText.value = '';
  attachments.value = [];
  replyToThread.value = null;
  emit('cancel');
};

const handleSend = () => {
  if (!messageText.value.trim()) return;

  const messageData = {
    content: messageText.value.trim(),
    threadId: replyToThread.value,
    attachments: attachments.value.map(attachment => ({
      url: attachment.url,
      type: attachment.type,
      name: attachment.name
    }))
  };

  if (props.message) {
    // If we have a message prop, we're editing
    emit('edit-message', messageData);
  } else {
    // If no message prop, we're sending a new message
    emit('send-message', messageData);
    // Only reset form for new messages
    messageText.value = '';
    attachments.value = [];
    replyToThread.value = null;
  }
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
    // Here you would typically upload the file to your server/storage
    // and get back a URL. This is a placeholder for that logic.
    const formData = new FormData();
    formData.append('file', file);

    // TODO: Implement file upload endpoint
    // const response = await fetch('/api/upload', {
    //   method: 'POST',
    //   body: formData
    // });
    // const { url } = await response.json();

    attachments.value.push({
      url: URL.createObjectURL(file), // Temporary URL for preview
      type: file.type,
      name: file.name
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
  }
};

const handleFormatClick = (formatType) => {
  const textarea = document.querySelector('textarea');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = messageText.value.substring(start, end);

  switch(formatType) {
    case Bold:
      wrapText(start, end, '**', '**');
      break;
    case Italic:
      wrapText(start, end, '_', '_');
      break;
    case Strikethrough:
      wrapText(start, end, '~~', '~~');
      break;
    case Code:
      wrapText(start, end, '`', '`');
      break;
    case Quote:
      wrapText(start, end, '> ', '');
      break;
    case Link:
      if (selectedText) {
        wrapText(start, end, '[', '](url)');
      }
      break;
    case ListOrdered:
      insertList(true);
      break;
    case List:
      insertList(false);
      break;
  }
};
const wrapText = (start, end, prefix, suffix) => {
  const beforeText = messageText.value.substring(0, start);
  const selectedText = messageText.value.substring(start, end);
  const afterText = messageText.value.substring(end);
  
  messageText.value = beforeText + prefix + selectedText + suffix + afterText;
};

const insertList = (ordered) => {
  const lines = messageText.value.split('\n');
  const newLines = lines.map((line, index) => {
    if (line.trim()) {
      return ordered ? `${index + 1}. ${line}` : `- ${line}`;
    }
    return line;
  });
  messageText.value = newLines.join('\n');
};

const handleActionClick = async (actionType) => {
  switch(actionType) {
    case Image:
      // Open file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          await handleFileUpload(file);
        }
      };
      input.click();
      break;
    case AtSign:
      messageText.value += '@';
      break;
    case Smile:
      // TODO: Implement emoji picker
      break;
  }
};
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
</style>