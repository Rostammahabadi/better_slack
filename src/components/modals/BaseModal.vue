<template>
  <Transition name="modal">
    <div class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button 
            @click="$emit('close')" 
            class="modal-close"
          >
            ×
          </button>
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
})

defineEmits(['close'])

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    event.currentTarget.dispatchEvent(new CustomEvent('close', { bubbles: true }))
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-container {
  background-color: #2D2D2D;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  margin: 0 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #3D3D3D;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #FFFFFF;
}

.modal-content {
  position: relative;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  animation: modal-in 0.3s ease-out;
}

.modal-leave-active .modal-container {
  animation: modal-in 0.3s ease-in reverse;
}

@keyframes modal-in {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 