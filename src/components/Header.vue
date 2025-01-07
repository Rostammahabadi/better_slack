<template>
    <header class="bg-white shadow p-4">
      <h2 class="text-xl font-semibold"># {{ channelName }}</h2>
    </header>
  </template>
  
  <script setup>
  defineProps(['channelName']);
  </script>