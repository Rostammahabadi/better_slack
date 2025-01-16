import { createStore } from 'vuex';
import { useToast } from 'vue-toastification';
import workspaces from './modules/workspaces';
import channels from './modules/channels';
import messages from './modules/messages';
import auth from './modules/auth';
import invites from './modules/invites';
import socket from './modules/socket';
import conversations from './modules/conversations';
import users from './modules/users';
import chatbot from './modules/chatbot';

const toast = useToast();

export default createStore({
  state: {
    // Global state if needed
  },
  mutations: {
    // Global mutations if needed
  },
  actions: {
    // Global toast actions
    showToastSuccess({ commit }, message) {
      toast.success(message, {
        timeout: 3000,
        position: "top-right",
        closeOnClick: true,
      });
    },
    showToastError({ commit }, message) {
      toast.error(message, {
        timeout: 5000,
        position: "top-right",
        closeOnClick: true,
      });
    },
    showToastWarning({ commit }, message) {
      toast.warning(message, {
        timeout: 4000,
        position: "top-right",
        closeOnClick: true,
      });
    },
    showToastInfo({ commit }, message) {
      toast.info(message, {
        timeout: 3000,
        position: "top-right",
        closeOnClick: true,
      });
    }
  },
  modules: {
    workspaces,
    channels,
    messages,
    auth,
    invites,
    socket,
    conversations,
    users,
    chatbot
  }
}); 