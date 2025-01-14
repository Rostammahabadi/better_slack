<template>
  <div class="workspace-layout">
    <WorkspaceNavBar/>
    <div class="workspace-sidebar">
      <WorkspaceSidebar />
    </div>
    <div class="workspace-main">
      <WorkspaceHeader />
      <div class="workspace-content">
        <slot></slot>
      </div>
    </div>
    <div v-if="showThreadSidebar" class="thread-sidebar">
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
import { computed, onMounted } from 'vue';
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

onMounted(() => {
  sendWorkspaceJoined(currentWorkspace.value._id, store.state.auth.user.user);
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
}

.workspace-sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: #19171D;
  color: #D1D2D3;
  overflow-y: auto;
}

.workspace-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #1A1D21;
  min-width: 0;
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