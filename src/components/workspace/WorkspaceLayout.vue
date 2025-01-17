<template>
  <div class="workspace-layout">
    <WorkspaceNavBar @toggle-sidebar="toggleSidebar"/>
    <div class="workspace-sidebar" :class="{ show: isSidebarVisible }">
      <WorkspaceSidebar />
    </div>
    <div class="workspace-main" @click="handleMainClick">
      <WorkspaceHeader />
      <div class="workspace-content">
        <slot></slot>
      </div>
    </div>
    <div v-if="showThreadSidebar" class="thread-sidebar" :class="{ show: showThreadSidebar }">
      <div class="thread-header">
        <h3>Thread</h3>
        <button class="close-thread" @click="closeThread">×</button>
      </div>
      <div class="thread-content">
        <div class="original-message">
          <img
            :src="threadParentMessage?.user?.avatarUrl" 
            :alt="`${threadParentMessage?.user?.displayName}'s avatar`" 
            class="avatar"
          />
          <div class="message-content">
            <div class="message-header">
              <span class="username">{{ threadParentMessage?.user?.displayName }}</span>
              <span class="timestamp">{{ formatTimestamp(threadParentMessage?.createdAt) }}</span>
            </div>
            <div class="message-text">
              {{ threadParentMessage?.content }}
            </div>
          </div>
        </div>
        
        <div class="thread-replies">
          <div 
            v-for="reply in threadReplies" 
            :key="reply._id" 
            class="thread-reply"
          >
            <img
              :src="reply.user.avatarUrl" 
              :alt="`${reply.user.displayName}'s avatar`" 
              class="avatar"
            />
            <div class="message-content">
              <div class="message-header">
                <span class="username">{{ reply.user.displayName }}</span>
                <span class="timestamp">{{ formatTimestamp(reply.createdAt) }}</span>
              </div>
              <div class="message-text">
                {{ reply.content }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="thread-reply-input">
          <TextEditor 
            placeholder="Reply in thread..."
            @edit-message="sendEditThreadReply"
            @send-message="sendThreadReply"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import WorkspaceNavBar from './WorkspaceNavBar.vue';
import WorkspaceSidebar from './WorkspaceSidebar.vue';
import WorkspaceHeader from './WorkspaceHeader.vue';
import TextEditor from '../TextEditor.vue';
import { useStore } from 'vuex';
import { useSocket } from '../../services/socketService';

const store = useStore();
const { sendWorkspaceJoined, sendChannelMessageEdit, sendConversationMessageEdit, sendChannelThreadReply, sendConversationThreadReply } = useSocket(store);

const showThreadSidebar = computed(() => {
  const activeThread = store.getters['messages/getActiveThread'];
  return !!activeThread;
});

const threadParentMessage = computed(() => store.getters['messages/getActiveThread']);
const threadReplies = computed(() => store.getters['messages/getThreadReplies'](threadParentMessage.value?._id));

const currentWorkspace = computed(() => store.getters['workspaces/currentWorkspace']);

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const closeThread = () => {
  store.dispatch('messages/setActiveThread', null);
};

const sendEditThreadReply = async (messageData) => {
  if (!messageData.content.trim() || !threadParentMessage.value) return;

  if (threadParentMessage.value.type === 'channel') {
    await store.dispatch('messages/editChannelMessage', {
      channelId: threadParentMessage.value.channelId,
      messageId: messageData.messageId,
      content: messageData.content
    });
    sendChannelMessageEdit(threadParentMessage.value.channelId, messageData.messageId, messageData.content);
  } else if (threadParentMessage.value.type === 'conversation') {
    await store.dispatch('messages/editConversationMessage', {
      conversationId: threadParentMessage.value.conversationId,
      messageId: messageData.messageId,
      content: messageData.content
    });
    sendConversationMessageEdit(threadParentMessage.value.conversationId, messageData.messageId, messageData.content);
  }
};

const sendThreadReply = async (messageData) => {
  if (!messageData.content.trim() || !threadParentMessage.value) return;
  
  try {
    const message = {
      content: messageData.content,
      user: store.state.auth.user.user._id,
      threadId: threadParentMessage.value._id,
      type: 'thread',
      status: 'sent'
    };

    // Add either channelId or conversationId based on the parent message type
    if (threadParentMessage.value.type === 'channel') {
      message.channelId = threadParentMessage.value.channelId;
    } else if (threadParentMessage.value.type === 'conversation') {
      message.conversationId = threadParentMessage.value.conversationId;
    }

    const response = await store.dispatch('messages/sendThreadReply', {
      message,
      token: store.state.auth.user.token
    });

    if (threadParentMessage.value.type === 'channel') {
      sendChannelThreadReply(threadParentMessage.value.channelId, threadParentMessage.value._id, response);
    } else if (threadParentMessage.value.type === 'conversation') {
      sendConversationThreadReply(threadParentMessage.value.conversationId, threadParentMessage.value._id, response);
    }

  } catch (error) {
    console.error('Failed to send thread reply:', error);
  }
};

const isSidebarVisible = ref(window.innerWidth > 768);
const isMobile = ref(window.innerWidth <= 768);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    isSidebarVisible.value = true;
  }
};

const toggleSidebar = () => {
  if (isMobile.value) {
    isSidebarVisible.value = !isSidebarVisible.value;
  }
};

const handleMainClick = () => {
  if (isMobile.value && isSidebarVisible.value) {
    isSidebarVisible.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  sendWorkspaceJoined(currentWorkspace.value, store.state.auth.user.user);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.workspace-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #1A1D21;
}

.workspace-sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: #19171D;
  color: #D1D2D3;
  overflow-y: auto;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 15;
}

.workspace-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #1A1D21;
  min-width: 0;
  position: relative;
  z-index: 10;
}

.workspace-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  position: relative;
}

.thread-sidebar {
  width: 400px;
  flex-shrink: 0;
  background-color: #1A1D21;
  border-left: 1px solid #4B4B4B;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 15;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .workspace-layout {
    position: fixed;
  }

  .workspace-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 85%;
    max-width: 320px;
    z-index: 25;
    transform: translateX(-100%);
    border-right: 1px solid #4B4B4B;
  }

  .workspace-sidebar.show {
    transform: translateX(0);
  }

  .workspace-main {
    width: 100%;
    margin-left: 0;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }

  /* Push main content when sidebar is shown */
  .workspace-sidebar.show ~ .workspace-main {
    transform: translateX(85%);
  }

  .thread-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    z-index: 30;
    transform: translateX(100%);
  }

  .thread-sidebar.show {
    transform: translateX(0);
  }

  /* Add overlay when sidebar is shown */
  .workspace-sidebar.show::before,
  .thread-sidebar.show::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .workspace-sidebar {
    width: 85%;
  }

  /* Push main content when sidebar is shown on small mobile */
  .workspace-sidebar.show ~ .workspace-main {
    transform: translateX(85%);
  }
}

/* Safe Area Handling */
@supports (padding: max(0px)) {
  .workspace-layout {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  @media (max-width: 768px) {
    .workspace-sidebar,
    .thread-sidebar {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}

.thread-header {
  padding: 16px 20px;
  border-bottom: 1px solid #4B4B4B;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thread-header h3 {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.close-thread {
  background: none;
  border: none;
  color: #ABABAD;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
}

.thread-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.original-message {
  padding: 20px;
  border-bottom: 1px solid #4B4B4B;
  display: flex;
  gap: 12px;
}

.thread-replies {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}

.thread-reply {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.message-content {
  flex: 1;
}

.message-header {
  margin-bottom: 4px;
}

.username {
  font-weight: 700;
  color: #FFFFFF;
}

.timestamp {
  margin-left: 8px;
  color: #ABABAD;
  font-size: 12px;
}

.message-text {
  color: #D1D2D3;
  white-space: pre-wrap;
  word-break: break-word;
}

.thread-reply-input {
  padding: 20px;
  border-top: 1px solid #4B4B4B;
  background-color: #1A1D21;
}
</style> 