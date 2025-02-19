# Better Slack

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

**Better Slack** is a real‑time chat application built with Vue 3 and Vite. It leverages Vuex for state management, Socket.IO for real‑time messaging, and integrates with Auth0 for authentication. The project also features a built‑in chatbot that responds to messages across channels, conversations, and direct messages.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Development](#development)
- [Production Build & Deployment](#production-build--deployment)
- [Environment Variables](#environment-variables)
- [Coding Conventions](#coding-conventions)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real‑time Messaging:** Instant communication via channels, direct messages, and threaded replies
- **Chatbot Integration:** A configurable chatbot that responds to user messages in channels and conversations
- **Auth0 Authentication:** Secure, password‑free sign‑in (with social providers and magic links)
- **Responsive Design:** Mobile‑first, fully responsive UI with safe‑area support
- **State Management:** Vuex‑driven global state for channels, conversations, users, and more
- **Socket.IO Integration:** Reliable, real‑time socket connection for chat events and status updates
- **Markdown Support:** Rich text formatting with markdown, syntax highlighting, and inline formatting
- **File Uploads:** Drag-and‑drop file uploads with immediate preview
- **Production Ready:** Fully linted, formatted, and configured for production environments

## Tech Stack

- **Framework:** Vue 3 with Composition API
- **Bundler:** Vite
- **State Management:** Vuex
- **Routing:** Vue Router
- **Real‑time Communication:** Socket.IO
- **Authentication:** Auth0
- **Markdown Parsing:** Marked + DOMPurify + Highlight.js
- **Chat Editor:** Tiptap + custom formatting tools
- **Styling:** SCSS with mobile‑first responsive design
- **Backend Communication:** Axios
- **Containerization:** Docker & Nginx for production serving

## Project Structure

The project is organized as follows:

```
better_slack/
├── .next/                  # Next.js cache (if used for SSR)
├── nginx/                  # Nginx configuration files
├── public/                 # Public assets (images, icons, etc.)
└── src/
    ├── assets/            # Styles, images, and other assets
    │   └── styles/        # SCSS/CSS files
    ├── components/        # Vue components
    ├── router/            # Vue Router configuration
    ├── services/          # API and Socket.IO service modules
    ├── store/             # Vuex store with modular state management
    └── views/             # Application views
```

Each module (e.g. `auth`, `channels`, `messages`, `chatbot`) is placed under `src/store/modules` and follows Vue 3 best practices.

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/better_slack.git
   cd better_slack
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create a `.env` file:**
   ```
   VITE_AUTH0_DOMAIN=your-auth0-domain
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   VITE_AUTH0_AUDIENCE=your-auth0-audience
   VITE_API_URL=https://your-api-url.com
   VITE_API_BASE_URL=https://your-api-base-url.com
   VITE_SOCKET_URL=https://your-socket-url.com
   ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```

## Production Build & Deployment

To build the application for production:

```sh
npm run build
```

The production bundle is optimized, tree-shaken, and minified according to best practices for Vue 3 and Vite.

## Environment Variables

The application uses several environment variables (prefixed with `VITE_`):

- `VITE_AUTH0_DOMAIN`: Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID
- `VITE_AUTH0_AUDIENCE`: Your Auth0 audience
- `VITE_API_URL`: The base URL for your API
- `VITE_API_BASE_URL`: Base URL for additional API endpoints
- `VITE_SOCKET_URL`: The URL for your Socket.IO server

## Coding Conventions

- **Vue 3 Best Practices:** All components use the Composition API
- **Responsive CSS:** All styles are written in SCSS/CSS and account for different screen sizes
- **State Management:** Vuex is used for centralized state management
- **Real‑time Communication:** All realtime events are handled in `src/services/socketService.js`
- **Code Quality:** ESLint and Prettier are configured for code consistency
- **Modular Structure:** New files follow the established folder structure

## Contributing

1. Fork the repository and create your branch from main
2. Follow the coding conventions as described above
3. Write tests for new features
4. Ensure linting and formatting pass:
   ```sh
   npm run lint
   npm run format
   ```
5. Submit a pull request with a detailed description of your changes

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- Vue 3
- Vite
- Auth0
- Socket.IO
- MarkDown & Tiptap
- Lucide Icons

Many thanks to the open‑source community for all the libraries and tools used in this project.

Happy coding!