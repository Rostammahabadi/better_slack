<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Invite people to workspace</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="input-section">
          <label for="emails">To:</label>
          <textarea
            id="emails"
            v-model="emails"
            placeholder="Enter email addresses separated by commas (e.g., user@example.com, another@example.com)"
            rows="4"
            class="email-input"
          ></textarea>
        </div>

        <button 
          class="invite-button" 
          @click="handleSubmit"
          :disabled="!isValid"
        >
          Send Invites
        </button>
      </div>
    </div>
  </div>

  <!-- Success Popover -->
  <SuccessPopover
    :show="showSuccess"
    title="Invites Sent!"
    :message="successMessage"
    @close="showSuccess = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SuccessPopover from '../common/SuccessPopover.vue';

const props = defineProps({
  workspaceId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);
const store = useStore();
const emails = ref('');
const showSuccess = ref(false);
const successMessage = ref('');

const isValid = computed(() => {
  const emailList = emails.value.split(/[,\s]+/).filter(Boolean);
  return emailList.every(email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  });
});

// Generate a cryptographically secure random token
function generateInviteToken() {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const handleSubmit = async () => {
  if (!isValid.value) return;

  const emailList = emails.value.split(/[,\s]+/)
    .filter(Boolean)
    .map(email => ({
      email: email.trim().toLowerCase(),
      isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    }))
    .filter(({ isValid }) => isValid)
    .map(({ email }) => email);

  // Create properly structured invites
  const invites = emailList.map(email => {
    const token = generateInviteToken();
    return {
      workspaceId: props.workspaceId,
      invitedBy: store.getters['auth/currentUser']._id,
      invitedEmail: email,
      status: 'pending',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  });

  try {
    const result = await store.dispatch('invites/sendInvites', {
      invites,
      token: store.getters['auth/token']
    });

    // Show success message
    successMessage.value = `Successfully sent ${result.length} invitation${result.length > 1 ? 's' : ''}`;
    showSuccess.value = true;

    // Auto close success message after 5 seconds
    setTimeout(() => {
      showSuccess.value = false;
    }, 5000);

    // Clear the input
    emails.value = '';

    // Close the modal
    emit('close');
  } catch (error) {
    console.error('Failed to send invites:', error);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1A1D21;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  margin: 20px;
}

.modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(75, 75, 75, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(26, 29, 33, 0.8) 0%, #1A1D21 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
}

.modal-header h2 {
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.3px;
  line-height: 1.3;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 24px;
  background: #1264A3;
  border-radius: 2px;
  margin-right: 4px;
}

.close-button {
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  line-height: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}

.close-button:active {
  background-color: rgba(255, 255, 255, 0.05);
  transform: scale(0.95);
}

.modal-body {
  padding: 28px;
}

.input-section {
  margin-bottom: 24px;
}

.input-section label {
  display: block;
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: 8px;
}

.email-input {
  width: 100%;
  background-color: #222529;
  border: 1px solid #565856;
  border-radius: 4px;
  padding: 12px;
  color: #FFFFFF;
  font-size: 15px;
  resize: vertical;
  font-family: inherit;
}

.email-input:focus {
  outline: none;
  border-color: #1264A3;
}

.invite-button {
  width: 100%;
  padding: 12px 24px;
  background-color: #1264A3;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.invite-button:disabled {
  background-color: #2C2D30;
  color: #9CA3AF;
  cursor: not-allowed;
  box-shadow: none;
}

.invite-button:not(:disabled):hover {
  background-color: #0F528A;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.invite-button:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Add a subtle loading state */
.invite-button:not(:disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.invite-button:not(:disabled):active::after {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}
</style> 