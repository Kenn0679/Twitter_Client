# 🐦 Twitter Client - Frontend Demo

<div align="center">

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black&style=flat-square)](https://www.javascript.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**A modern React frontend client for the Twitter Clone API**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🔗 Backend API](https://github.com/Kenn0679/Twitter) • [💻 Tech Stack](#-tech-stack)

</div>

---

## 📖 **About This Project**

This is a **frontend demo client** for the [Twitter Clone API](https://github.com/Kenn0679/Twitter) - a comprehensive social media platform backend. Built with modern React and Vite, this client demonstrates core features including authentication, video streaming, and user interface components.

### ✨ **Key Features**

| 🎬 **Video Streaming**    | 🔐 **Authentication**        | 🎨 **Modern UI**    |
| ------------------------- | ---------------------------- | ------------------- |
| Progressive MP4 streaming | Google OAuth 2.0 integration | Responsive design   |
| HLS adaptive streaming    | JWT token management         | Toast notifications |
| Advanced video player     | Secure login/logout          | Smooth animations   |

---

## 🚀 **Quick Start**

### **Prerequisites**

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- The [Twitter Clone Backend API](https://github.com/Kenn0679/Twitter) running on `localhost:5000`

### **Installation Steps**

#### 1️⃣ **Clone and Install**

```bash
# Clone the repository
git clone https://github.com/yourusername/twitter-client.git
cd twitter-client

# Install dependencies
npm install
```

#### 2️⃣ **Environment Setup**

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/login/oauth

# AWS Configuration
VITE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
VITE_AWS_REGION=ap-southeast-1
VITE_SES_FROM_ADDRESS=your-email@example.com
VITE_BUCKET_NAME=your-s3-bucket-name

# API Endpoints
VITE_API_URL=http://localhost:5000
VITE_API_URL_WS=ws://localhost:5000
```

> 💡 **Note:** Ensure the Google OAuth redirect URI matches exactly with the settings in the [Google Cloud Console](https://console.cloud.google.com/).

#### 3️⃣ **Start Development Server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 📁 **Project Structure**

```
twitter-client/
├── public/              # Static assets
│   └── vite.svg
├── src/
│   ├── components/     # Reusable components
│   │   ├── VideoStream.jsx      # MP4 progressive streaming
│   │   └── HLSVideoStream.jsx   # HLS adaptive streaming
│   ├── assets/         # Images and static files
│   ├── App.jsx         # Main app component
│   ├── App.css         # App styles
│   ├── Home.jsx        # Home page component
│   ├── Login.jsx       # OAuth callback handler
│   ├── router.jsx      # Route configuration
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── README.md          # This file
```

---

## 🎯 **Features Overview**

### 🔐 **Authentication System**

#### **Google OAuth 2.0 Integration**

- Seamless login with Google account
- Automatic token storage in localStorage
- Redirect handling after authentication
- User feedback with toast notifications

**Flow:**

1. User clicks "Login with Google"
2. Redirects to Google OAuth consent screen
3. User authorizes the application
4. Backend processes OAuth callback
5. Frontend receives tokens via query parameters
6. Tokens stored in localStorage
7. User redirected to home page

### 🎬 **Video Streaming**

#### **Progressive MP4 Streaming**

- Standard HTML5 video player
- Direct MP4 file playback
- Simple, lightweight solution
- Compatible with all modern browsers

```jsx
<VideoStream src='http://localhost:5000/static/videos-stream/video.mp4' title='My Video' width='85%' />
```

#### **HLS Adaptive Streaming**

- Advanced video player powered by Vidstack
- Adaptive bitrate streaming
- Thumbnail preview support (VTT format)
- Professional-grade video playback
- Automatic quality adjustment based on bandwidth

```jsx
<HLSVideoStream
  src='http://localhost:5000/static/videos-hls/playlist/master.m3u8'
  thumbnails='https://example.com/thumbnails.vtt'
/>
```

---

## 🛠️ **Tech Stack**

### **Core Technologies**

- ⚛️ **React 19.1.1** - Modern UI library
- ⚡ **Vite 7.1.7** - Fast build tool and dev server
- 🛣️ **React Router DOM 7.9.4** - Client-side routing
- 🎬 **@vidstack/react** - Advanced video player with HLS support
- 🔔 **react-hot-toast** - Beautiful toast notifications

### **Development Tools**

- 🔍 **ESLint 9.36.0** - Code linting
- 💅 **Prettier** - Code formatting
- 🔄 **SWC** - Fast compilation

---

## 📡 **API Integration**

This client connects to the [Twitter Clone Backend API](https://github.com/Kenn0679/Twitter) running on `localhost:5000`.

### **Expected Backend Endpoints**

| Endpoint                  | Method | Purpose                         |
| ------------------------- | ------ | ------------------------------- |
| `/users/oauth/google`     | GET    | Initiate Google OAuth           |
| `/static/videos-stream/*` | GET    | Serve MP4 video files           |
| `/static/videos-hls/*`    | GET    | Serve HLS manifest and segments |

### **Authentication Flow**

```
Frontend (localhost:3000)
    ↓
[User clicks "Login with Google"]
    ↓
Redirects to Google OAuth
    ↓
Google redirects to Backend (localhost:5000/users/oauth/google)
    ↓
Backend processes OAuth → Redirects to Frontend
    ↓
Frontend (localhost:3000/login/oauth?access_token=...&refresh_token=...)
    ↓
Tokens stored in localStorage
    ↓
Redirect to Home page
```

---

## 🎨 **UI Components**

### **VideoStream Component**

A simple HTML5 video player for progressive MP4 streaming.

**Props:**

- `src` (required): Video source URL
- `title` (optional): Video title
- `width` (optional): Player width (default: '85%')

### **HLSVideoStream Component**

An advanced video player with HLS support using Vidstack.

**Props:**

- `src` (required): HLS manifest URL (.m3u8)
- `title` (optional): Video title
- `thumbnails` (optional): VTT thumbnails URL
- `sectionTitle` (optional): Section heading

---

## 📜 **Available Scripts**

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start development server (port 3000) |
| `npm run build`        | Build for production                 |
| `npm run preview`      | Preview production build             |
| `npm run lint`         | Check code quality                   |
| `npm run lint:fix`     | Auto-fix linting issues              |
| `npm run prettier`     | Check code formatting                |
| `npm run prettier:fix` | Auto-fix code formatting             |

---

## 📝 **License**

This project is licensed under the MIT License.
