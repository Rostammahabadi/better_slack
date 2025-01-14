<template>
    <div class="chat-container">
      <div class="messages">
        <div v-for="msg in messages" :key="msg.timestamp" class="message">
          <span>{{ msg.sender }}:</span> {{ msg.text }}
        </div>
      </div>
      <input
        v-model="userInput"
        placeholder="Type a message..."
        @keyup.enter="handleMessage"
      />
    </div>
  </template>
  
  <script>
  import { mapState, mapActions } from 'vuex';
  
  export default {
    computed: {
      ...mapState('chatbot', ['messages', 'userInput']),
    },
    methods: {
      ...mapActions('chatbot', ['addMessage', 'activateBot']),
      handleMessage() {
        if (this.userInput === '/bot' || this.userInput.startsWith('bot')) {
          this.startBot();
        } else {
          this.socket.emit('message', { text: this.userInput });
          this.addMessage({ sender: 'User', text: this.userInput });
        }
        this.userInput = '';
      },
      startBot() {
        if (!this.socket) {
          this.socket = new WebSocket('ws://your-backend-url');
          this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.addMessage(message);
          };
          this.activateBot({ socket: this.socket });
        }
      },
    },
  };
  </script>