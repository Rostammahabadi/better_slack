<template>
    <div>
      <div v-for="message in messages" :key="message.id" class="mb-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              {{ message.user.charAt(0) }}
            </div>
          </div>
          <div class="ml-3">
            <p class="font-semibold">{{ message.user }}</p>
            <p>{{ message.content }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(message.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  
  defineProps(['messages']);
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  </script>