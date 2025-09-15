# Discord Clone

A full-featured Discord clone built with Next.js, Express.js, MongoDB, and Socket.io. This project includes real-time messaging, direct messages, server management, friend systems, and more.

## 🚀 Features

### ✅ **Fully Functional Features:**
- **Real-time Messaging** - Instant message delivery with Socket.io
- **Direct Messages (DMs)** - Private conversations between users
- **Server Management** - Create, join, and manage servers
- **Channel System** - Text and voice channels within servers
- **Friend System** - Add friends, send requests, manage relationships
- **User Authentication** - Secure JWT-based authentication
- **File Uploads** - Share images and files via Cloudinary
- **Message Reactions** - React to messages with emojis
- **Message Actions** - Edit, delete, and reply to messages
- **Real-time Notifications** - Live updates for messages and friend requests
- **Responsive Design** - Works on desktop and mobile devices

### 🎯 **Core Functionality:**
- **Server Creation & Joining** - Create servers with invite codes
- **Channel Management** - Create text and voice channels
- **User Management** - User profiles, avatars, and status
- **Message Threading** - Organized conversation flow
- **Search & Discovery** - Find users and servers
- **Settings & Preferences** - Customize your experience

## 🛠️ Tech Stack

### Frontend:
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful UI components
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API calls

### Backend:
- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Cloudinary** - Image and file upload service
- **Bcrypt** - Password hashing

## 🚀 Quick Start

### Prerequisites:
- Node.js 18+ 
- MongoDB
- Cloudinary account (for file uploads)

### Installation:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/OwenSctt/discord-clone.git
   cd discord-clone
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd discord-clone-backend
   npm install
   
   # Frontend
   cd ../discord-clone
   npm install
   ```

3. **Environment Setup:**
   
   Create `.env` in `discord-clone-backend/`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/discord-clone
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   PORT=5000
   ```

   Create `.env.local` in `discord-clone/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

4. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd discord-clone-backend
   node server.js
   
   # Terminal 2 - Frontend
   cd discord-clone
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
discord-clone-project/
├── discord-clone-backend/          # Express.js API server
│   ├── config/                     # Database and service configs
│   ├── middleware/                 # Authentication & validation
│   ├── models/                     # MongoDB schemas
│   ├── routes/                     # API endpoints
│   └── server.js                   # Main server file
├── discord-clone/                  # Next.js frontend
│   ├── app/                        # Next.js App Router
│   ├── components/                 # React components
│   ├── contexts/                   # React Context providers
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utility functions
└── README.md
```

## 🔧 API Endpoints

### Authentication:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Servers:
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create new server
- `POST /api/servers/join/:inviteCode` - Join server with invite

### Messages:
- `GET /api/messages/:channelId` - Get channel messages
- `POST /api/messages/:channelId` - Send message to channel
- `GET /api/messages/dm/:recipientId` - Get DM messages
- `POST /api/messages/dm` - Send DM message

### Friends:
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/respond` - Accept/decline friend request

## 🎨 Key Components

### Frontend Components:
- **ServerSidebar** - Server list and navigation
- **ChannelSidebar** - Channel list for selected server
- **ChatArea** - Main messaging interface
- **DMChatArea** - Direct message interface
- **FriendManagement** - Friend system management
- **ServerInviteModal** - Server invitation system

### Backend Features:
- **Real-time messaging** with Socket.io
- **JWT authentication** with middleware
- **MongoDB integration** with Mongoose
- **File upload** support with Cloudinary
- **Error handling** and validation

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Protected routes and middleware

## 🚀 Deployment

The project includes Docker configuration for easy deployment:

```bash
# Using Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- Voice chat functionality
- Video calls
- Screen sharing
- Bot integration
- Mobile app
- Advanced moderation tools
- Custom emojis and reactions

---

**Built with ❤️ using Next.js, Express.js, MongoDB, and Socket.io**