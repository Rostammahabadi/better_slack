import { createStore } from 'vuex';
import workspaces from './modules/workspaces';
import channels from './modules/channels';
import messages from './modules/messages';
import auth from './modules/auth';
import invites from './modules/invites';

export default createStore({
  modules: {
    workspaces,
    channels,
    messages,
    auth,
    invites
  }
}); 