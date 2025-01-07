<template>
  <div class="editor-container">
    <div class="toolbar top-toolbar">
      <button 
        v-for="(icon, index) in topRowIcons" 
        :key="index" 
        class="toolbar-button"
        @click="handleFormatClick(icon)"
      >
        <component :is="icon" />
      </button>
    </div>
    <div class="editor-content">
      <textarea
        v-model="messageText"
        rows="3"
        placeholder="Start a new message"
        class="message-input"
        @keydown.enter.prevent="handleSend"
        @keydown.enter.shift.exact="messageText += '\n'"
        @paste="handlePaste"
        @drop.prevent="handleDrop"
      ></textarea>
      <div class="toolbar bottom-toolbar">
        <div class="toolbar-left">
          <button 
            v-for="(icon, index) in bottomRowIcons" 
            :key="index"
            class="toolbar-button"
            @click="handleActionClick(icon)"
          >
            <component :is="icon" />
          </button>
        </div>
        <div class="toolbar-right" v-show="messageText.trim()">
          <button 
            class="send-button"
            @click="handleSend"
            :disabled="!messageText.trim()"
          >
            Send
          </button>
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

const store = useStore();
const messageText = ref('');
const attachments = ref([]);
const replyToThread = ref(null);

const topRowIcons = [Bold, Italic, Strikethrough, Link, ListOrdered, List, AlignLeft, Code, Quote];
const bottomRowIcons = [Plus, Type, Smile, AtSign, Image, Mic, PenTool];

const emit = defineEmits(['send-message']);

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

  emit('send-message', messageData);
  
  // Reset the form
  messageText.value = '';
  attachments.value = [];
  replyToThread.value = null;
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
.editor-container {
  background-color: #1a1a1a;
  color: #d1d1d1;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-button {
  background: transparent;
  border: none;
  color: #d1d1d1;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.toolbar-button:hover {
  background-color: #333333;
}

.toolbar-button svg {
  width: 16px;
  height: 16px;
}

.editor-content {
  position: relative;
}

.message-input {
  width: 100%;
  background-color: #2a2a2a;
  color: #d1d1d1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.message-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.message-input::placeholder {
  color: #666666;
}

.bottom-toolbar {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.send-button {
  background-color: #2c974b;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.send-button:hover {
  background-color: #238636;
}

.send-button:disabled {
  background-color: #238636;
  opacity: 0.5;
  cursor: not-allowed;
}

/* Add hover effect for buttons */
.toolbar-button:active {
  transform: translateY(1px);
}

/* Ensure proper spacing between toolbar sections */
.top-toolbar {
  border-bottom: 1px solid #333333;
  padding-bottom: 8px;
}

/* Add a subtle transition for smoother interactions */
.toolbar-button, .message-input {
  transition: all 0.2s ease;
}

/* Improve focus states for accessibility */
.toolbar-button:focus {
  outline: 2px solid #4a4a4a;
  outline-offset: 2px;
}

/* Ensure proper contrast for disabled state */
.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>