import { createStore } from 'vuex';
import workspaces from './modules/workspaces';
import channels from './modules/channels';
import messages from './modules/messages';
import auth from './modules/auth';
import invites from './modules/invites';
import socket from './modules/socket';
import conversations from './modules/conversations';
import users from './modules/users';
import chatbot from './modules/chatbot';

export default createStore({
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