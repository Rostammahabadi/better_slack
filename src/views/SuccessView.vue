<template>
  <div class="success-container">
    <div class="success-content">
      <img src="@/assets/slack-logo.svg" alt="Slack" class="logo" />
      <h1>You've made it! 🎉</h1>
      <p class="welcome-text">Welcome to Better Slack</p>
      <div class="user-info" v-if="user">
        <img :src="user.picture" :alt="user.name" class="avatar" />
        <p class="user-name">yeehawq</p>
        <p class="user-email">"wohoo"</p>
      </div>
    </div>
  </div>
</template>

<script setup>

</script>

<style scoped>
.success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 2rem;
}

.success-content {
  text-align: center;
  max-width: 400px;
}

.logo {
  width: 50px;
  height: auto;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: var(--slack-text);
  margin-bottom: 1rem;
}

.welcome-text {
  font-size: 1.25rem;
  color: var(--slack-subtle);
  margin-bottom: 2rem;
}

.user-info {
  padding: 2rem;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin-top: 2rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--slack-text);
  margin-bottom: 0.5rem;
}

.user-email {
  color: var(--slack-subtle);
  font-size: 1rem;
}
</style> 