<template>
  <Transition name="fade">
    <div v-if="show" class="success-popover">
      <div class="success-content">
        <div class="success-icon">✓</div>
        <div class="success-message">
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
        </div>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

defineEmits(['close']);
</script>

<style scoped>
.success-popover {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  max-width: 400px;
  background-color: #1A1D21;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #4B4B4B;
  overflow: hidden;
}

.success-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.success-icon {
  width: 24px;
  height: 24px;
  background-color: #007A5A;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.success-message {
  flex: 1;
}

.success-message h3 {
  color: #FFFFFF;
  font-size: 16px;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.success-message p {
  color: #ABABAD;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: #ABABAD;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -4px -4px 0 0;
}

.close-button:hover {
  color: #FFFFFF;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 