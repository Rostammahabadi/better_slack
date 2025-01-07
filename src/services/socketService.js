// src/services/socketService.js
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  auth: (cb) => {
    const token = localStorage.getItem('authToken'); // Retrieve token from storage
    cb({ token });
  },
  transports: ['websocket'],
  reconnectionAttempts: 5,
  timeout: 60000,
});

export default socket;