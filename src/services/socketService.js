import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useStore } from 'vuex';

export function useSocket() {
  const store = useStore();
  const socket = io('http://localhost:3000', {
    autoConnect: false,
    withCredentials: true,
    auth: {
      token: store.getters['auth/token']
    }
  });

  const isConnected = ref(false);
  const currentUserChannel = ref(null);
  const channelUsers = ref([]);
  const messages = ref([]);
  const typingUsers = ref(new Set());

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
    messages.value.push(message);
  });

  socket.on('channel:typing', ({ username, isTyping }) => {
    if (isTyping) {
      typingUsers.value.add(username);
    } else {
      typingUsers.value.delete(username);
    }
  });

  socket.on('channel:user_joined', ({ username }) => {
    console.log(`${username} joined the channel`);
  });

  socket.on('channel:user_left', ({ username }) => {
    console.log(`${username} left the channel`);
    typingUsers.value.delete(username);
  });

  // Channel actions
  const joinChannel = (channelId, user) => {
    currentUserChannel.value = channelId;
    socket.emit('channel:join', { channelId, user });
  };

  const leaveChannel = () => {
    if (currentUserChannel.value) {
      socket.emit('channel:leave', { channelId: currentUserChannel.value });
      currentUserChannel.value = null;
      messages.value = [];
      typingUsers.value.clear();
    }
  };

  const sendRealtimeMessage = (message) => {
    if (currentUserChannel.value) {
      socket.emit('channel:message', {
        channelId: currentUserChannel.value,
        message
      });
    }
  };

  const sendTyping = (isTyping) => {
    if (currentUserChannel.value) {
      socket.emit('channel:typing', {
        channelId: currentUserChannel.value,
        isTyping
      });
    }
  };

  // Connect/Disconnect methods
  const connect = () => socket.connect();
  const disconnect = () => socket.disconnect();

  // Cleanup on component unmount
  onUnmounted(() => {
    socket.disconnect();
  });

  return {
    isConnected,
    currentUserChannel,
    channelUsers,
    messages,
    typingUsers,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendRealtimeMessage,
    sendTyping
  };
}