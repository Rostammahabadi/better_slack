<template>
  <div class="workspace-header">
    <div class="header-left">
      <div class="channel-info">
        <div class="channel-name">
          Channel Name
        </div>
        <div class="channel-description">
          Channel Description
        </div>
      </div>
      <div class="header-actions">
        <button class="action-button" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 19L8.5 12L15.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="action-button" title="Forward">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 19L15.5 12L8.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.workspace-header {
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #4B4B4B;
  background-color: #1A1D21;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 12;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.channel-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.channel-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-description {
  font-size: 14px;
  color: #ABABAD;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-button {
  background: none;
  border: none;
  color: #ABABAD;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background-color: #27242C;
  color: #FFFFFF;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .workspace-header {
    height: 56px;
    padding: 0 16px;
  }

  .header-left {
    gap: 12px;
  }

  .channel-name {
    font-size: 16px;
    gap: 6px;
  }

  .channel-description {
    font-size: 13px;
  }

  .header-actions {
    gap: 12px;
  }

  .action-button {
    padding: 6px;
  }

  /* Hide less important actions on mobile */
  .action-button.secondary {
    display: none;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .workspace-header {
    height: 48px;
    padding: 0 12px;
  }

  .header-left {
    gap: 8px;
  }

  .channel-name {
    font-size: 15px;
    gap: 4px;
  }

  .channel-description {
    font-size: 12px;
  }

  .header-actions {
    gap: 8px;
  }

  .action-button {
    padding: 4px;
  }
}

/* Safe Area Handling */
@supports (padding: max(0px)) {
  .workspace-header {
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
    padding-top: max(0px, env(safe-area-inset-top));
  }

  @media (max-width: 768px) {
    .workspace-header {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
  }

  @media (max-width: 480px) {
    .workspace-header {
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
    }
  }
}
</style> 