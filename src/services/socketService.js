import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

let socket = null; // Make socket a module-level variable

export function useSocket(store) {
  const isConnected = ref(false);

  const channelUsers = ref([]);
  const messages = ref([]);
  const typingUsers = ref(new Set());

  const initSocket = (token) => {
    if (socket) return; // Prevent multiple socket instances
    socket = io('http://localhost:3001', {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: token
      }
    });
    // Connection events
    socket.on('connect', () => {
      isConnected.value = true;
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      isConnected.value = false;
      console.log('Disconnected from server');
    });

    // Channel events
    socket.on('channel:users', (users) => {
      channelUsers.value = users;
    });

    socket.on('channel:message', (message) => {
      store.dispatch('messages/addMessage', message);
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

    socket.on('channel:reaction', ({ channelId, messageId, reaction }) => {
      store.commit('messages/ADD_REACTION', { messageId, reaction, channelId });
    });

    socket.on('channel:reaction_removed', ({ channelId, messageId, reactionId }) => {
      store.dispatch('messages/removeReaction', { messageId, reactionId, channelId });
    });

    socket.on('channel:edit_message', ({ messageId, message }) => {
      store.dispatch('messages/editMessage', { messageId, message });
    });
  };

  // Channel actions
  const joinChannel = (channelId, user) => {
    if (!socket) return;
    console.log("joining channel", channelId, user._id); // Assuming user has _id
    socket.emit('channel:join', channelId, user._id); // Send as separate parameters
  };

  const leaveChannel = (channelId) => {
    if (!socket) return;
    socket.emit('channel:leave', { channelId });
    messages.value = [];
    typingUsers.value.clear();
  };
  
  const sendRealtimeMessage = (message) => {
    if (!socket) return;
    socket.emit('channel:message', message);
  };

  const sendReaction = (messageId, reaction, channelId) => {
    if (!socket) return;
    socket.emit('channel:reaction', { messageId, reaction, channelId });
  };

  const sendEditMessage = (messageId, message) => {
    if (!socket) return;
    socket.emit('channel:edit_message', { messageId, message });
  };

  const sendTyping = (isTyping, channelId) => {
    if (!socket) return;
    socket.emit('channel:typing', {
      channelId: channelId,
      isTyping
    });
  };

  // Connect/Disconnect methods
  const connect = (token) => {
    initSocket(token);
    socket?.connect();
  };

  const disconnect = () => {
    if (!socket) return;
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  };

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    channelUsers,
    messages,
    typingUsers,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendRealtimeMessage,
    sendTyping,
    sendReaction,
    sendEditMessage
  };
}