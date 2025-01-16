import { ref } from 'vue';
import { io } from 'socket.io-client';

let socket = null;

export function useSocket(store) {
  const isConnected = ref(false);
  const channelUsers = ref([]);
  const messages = ref([]);
  const typingUsers = ref(new Set());

  const initSocket = (token) => {
    if (socket) return;

    console.log('[Socket] Initializing socket connection...');
    
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected successfully', { socketId: socket.id });
      isConnected.value = true;
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', { 
        error: error.message,
        type: error.type,
        description: error.description 
      });
      isConnected.value = false;
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', { 
        reason,
        wasConnected: isConnected.value,
        socketId: socket?.id,
        transportState: socket?.io?.engine?.transport?.ws?.readyState
      });
      isConnected.value = false;
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      isConnected.value = true;
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Attempting to reconnect:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', {
        error: error.message,
        type: error.type,
        description: error.description
      });
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect after all attempts');
      isConnected.value = false;
    });

    // Channel events
    socket.on('channel:users', (users) => {
      channelUsers.value = users;
    });

    socket.on('channel:message', (message) => {
      store.dispatch('messages/addMessage', { message, type: 'channel' });
    });

    socket.on('channel:typing', ({ username, isTyping }) => {
      if (isTyping) {
        typingUsers.value.add(username);
      } else {
        typingUsers.value.delete(username);
      }
    });

    socket.on('channel:user_joined', ({ userId, channelId }) => {
      console.log(`User ${userId} joined channel ${channelId}`);
    });

    socket.on('channel:user_left', ({ username }) => {
      console.log(`${username} left the channel`);
      typingUsers.value.delete(username);
    });

    // Conversation events
    socket.on('conversation:message', (message) => {
      store.dispatch('messages/addMessage', { message, type: 'conversation' });
    });

    socket.on('conversation:typing', ({ conversationId, userId, isTyping }) => {
      store.commit('conversations/setUserTyping', { conversationId, userId, isTyping });
    });

    socket.on('conversation:users', ({ conversationId, users }) => {
      store.commit('conversations/updateConversationUsers', { conversationId, users });
    });

    socket.on('conversation:user_joined', ({ conversationId, userId }) => {
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on('conversation:user_left', ({ conversationId, userId }) => {
      console.log(`User ${userId} left conversation ${conversationId}`);
      store.commit('conversations/removeUser', { conversationId, userId });
    });

    // Add handler for conversation thread replies
    socket.on('conversation:thread_reply', ({ conversationId, threadId, reply }) => {
      store.commit('messages/addConversationThreadReply', { 
        conversationId, 
        threadId, 
        reply 
      });
    });

    // Reaction events
    socket.on('channel:reaction', ({ channelId, messageId, reaction }) => {
      store.commit('messages/ADD_CHANNEL_REACTION', { messageId, reaction, channelId });
    });

    socket.on('channel:reaction_removed', ({ channelId, messageId, reaction }) => {
      store.commit('messages/REMOVE_CHANNEL_REACTION', { messageId, reaction, channelId });
    });

    // Conversation events
    socket.on('conversation:reaction', ({ conversationId, messageId, reaction }) => {
      store.commit('messages/ADD_CONVERSATION_REACTION', { messageId, reaction, conversationId });
    });

    socket.on('conversation:reaction_removed', ({ conversationId, messageId, reaction }) => {
      store.commit('messages/REMOVE_CONVERSATION_REACTION', { messageId, reaction, conversationId });
    });

    // Message edit events
    socket.on('channel:edit_message', ({ channelId, messageId, message }) => {
      store.commit('messages/UPDATE_CHANNEL_MESSAGE', {
        channelId,
        messageId,
        message
      });
    });

    socket.on('conversation:edit_message', ({ conversationId, messageId, content }) => {
      store.commit('messages/UPDATE_CONVERSATION_MESSAGE', { conversationId, messageId, content });
    });

    socket.on('bot:message', (message) => {
      store.dispatch('chatbot/addBotResponse', message);
      store.dispatch('chatbot/setLoading', false);
    });

    socket.on('bot:connect', ( message) => {
      store.dispatch('chatbot/addMessage', message);
    });

    // Add handler for channel thread replies
    socket.on('channel:thread_reply', ({ channelId, threadId, reply }) => {
      store.commit('messages/addChannelThreadReply', { 
        channelId, 
        threadId, 
        reply 
      });
    });
  };

  const activateBot = (userId) => {
    if (!socket) return;
    socket.emit('bot:connect', { userId });
  };

  // Channel actions
  const joinChannel = (channelId, user) => {
    if (!socket) return;
    socket.emit('channel:join', channelId, user._id);
  };

  const sendBotMessage = (message, userId, workspaceId) => {
    if (!socket) return;
    socket.emit('bot:message', { message, userId, workspaceId });
  };

  const leaveChannel = (channelId) => {
    if (!socket) return;
    socket.emit('channel:leave', { channelId });
    messages.value = [];
    typingUsers.value.clear();
  };

  const sendWorkspaceLeft = (workspaceId, user) => {
    if (!socket) return;
    socket.emit('workspace:leave', workspaceId, user._id);
  };

  const sendWorkspaceJoined = (workspaceId, user) => {
    if (!socket) return;
    socket.emit('workspace:join', workspaceId, user._id);
  };

  // Conversation actions
  const sendConversationConnected = (conversationId, user) => {
    if (!socket) return;
    socket.emit('conversation:connect', conversationId, user._id);
  };

  const sendConversationLeft = (conversationId, user) => {
    if (!socket) return;
    socket.emit('conversation:leave', conversationId, user._id);
  };

  const sendConversationTyping = (conversationId, isTyping) => {
    if (!socket) return;
    socket.emit('conversation:typing', { conversationId, isTyping });
  };

  const sendAddedUsersToChannel = (channelId, userIds) => {
    if (!socket) return;
    socket.emit('channel:added_users', { channelId, userIds });
  };

  const sendConversationMessage = (message) => {
    if (!socket) return;
    socket.emit('conversation:message', message);
  };

  // Message actions
  const sendChannelMessage = (message) => {
    if (!socket) return;
    socket.emit('channel:message', message);
  };

  const sendConversationReaction = (messageId, reaction, conversationId) => {
    if (!socket) return;
    socket.emit('conversation:reaction', { messageId, reaction, conversationId });
  };

  const sendChannelReactionRemoved = (messageId, reaction, channelId) => {
    if (!socket) return;
    socket.emit('channel:reaction_removed', { messageId, reaction, channelId });
  };

  const sendConversationReactionRemoved = (messageId, reaction, conversationId) => {
    if (!socket) return;
    socket.emit('conversation:reaction_removed', { messageId, reaction, conversationId });
  };

  const sendEditMessage = (messageId, message, channelId) => {
    if (!socket) return;
    socket.emit('channel:edit_message', { messageId, message, channelId });
  };

  const sendEditConversationMessage = (messageId, message, conversationId) => {
    if (!socket) return;
    socket.emit('conversation:edit_message', { messageId, message, conversationId });
  };

  const sendChannelThreadReply = (channelId, threadId, reply) => {
    if (!socket) return;
    socket.emit('channel:thread_reply', {
      channelId,
      threadId,
      reply
    });
  };

  const sendConversationThreadReply = (conversationId, threadId, reply) => {
    if (!socket) return;
    socket.emit('conversation:thread_reply', {
      conversationId,
      threadId,
      reply
    });
  };

  // Connect/Disconnect methods
  const connect = (token) => {
    initSocket(token);
    socket?.connect();
  };

  const disconnect = () => {
    if (!socket) {
      console.log('[Socket] No socket connection to disconnect');
      return;
    }

    console.log('[Socket] Starting disconnect process', {
      socketId: socket.id,
      isConnected: socket.connected,
      hasTransport: !!socket.io?.engine?.transport
    });

    // Clean up all conversations
    const activeConversations = Object.keys(store.state.conversations.activeUsers);
    console.log('[Socket] Cleaning up conversations:', activeConversations);
    
    activeConversations.forEach(conversationId => {
      try {
        sendConversationLeft(conversationId, store.state.auth.user);
      } catch (error) {
        console.error('[Socket] Error leaving conversation:', {
          conversationId,
          error: error.message
        });
      }
    });
    
    try {
      socket.disconnect();
      console.log('[Socket] Disconnected successfully');
    } catch (error) {
      console.error('[Socket] Error during disconnect:', error);
    }

    socket.removeAllListeners();
    console.log('[Socket] Removed all listeners');
    
    socket = null;
    isConnected.value = false;
    console.log('[Socket] Reset socket instance');
  };

  const sendChannelCreated = (channel) => {
    if (!socket) return;
    socket.emit('channel:created', channel);
  };

  const sendChannelReaction = (messageId, reaction, channelId) => {
    if (!socket) return;
    socket.emit('channel:reaction', { messageId, reaction, channelId });
  };

  const sendChannelMessageEdit = (channelId, messageId, content) => {
    if (socket) {
      socket.emit('channel:edit_message', {
        channelId,
        messageId,
        content
      });
    }
  };

  const sendConversationMessageEdit = (conversationId, messageId, content) => {
    if (socket) {
      socket.emit('conversation:edit_message', {
        conversationId,
        messageId,
        content
      });
    }
  };

  const cleanup = () => {
    messages.value = [];
    typingUsers.value.clear();
    channelUsers.value = [];
  };

  return {
    isConnected,
    channelUsers,
    messages,
    typingUsers,
    connect,
    disconnect,
    cleanup,
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    sendConversationMessage,
    sendConversationConnected,
    sendConversationLeft,
    sendConversationTyping,
    sendChannelReactionRemoved,
    sendConversationReaction,
    sendConversationReactionRemoved,
    sendEditMessage,
    sendEditConversationMessage,
    sendWorkspaceJoined,
    sendWorkspaceLeft,
    sendChannelMessageEdit,
    sendConversationMessageEdit,
    sendChannelThreadReply,
    sendConversationThreadReply,
    sendChannelCreated,
    activateBot,
    sendBotMessage,
    sendChannelReaction,
    sendAddedUsersToChannel,
  };
}