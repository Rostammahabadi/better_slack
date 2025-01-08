// src/services/socketService.js
import { io } from 'socket.io-client';

console.log('Initializing socket connection...');
const socket = io('http://localhost:3000', {
  auth: (cb) => {
    const token = localStorage.getItem('auth_token');
    cb({ token });
  },
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: true,
  forceNew: true
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error details:', {
    message: error.message,
    description: error.description,
    type: error.type,
    data: error.data
  });
});

socket.on('connect', () => {
  console.log('Socket connected successfully. Socket details:', {
    id: socket.id,
    connected: socket.connected,
    disconnected: socket.disconnected
  });
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected. Reason:', reason, 'Socket details:', {
    id: socket.id,
    connected: socket.connected,
    disconnected: socket.disconnected,
    wasConnected: socket.wasConnected
  });
});

socket.on('error', (error) => {
  console.error('Socket general error:', error);
});

// Debug socket state
socket.onAny((event, ...args) => {
  console.log('Socket event received:', event, args);
});

export default socket;