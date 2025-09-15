# Discord Clone Project

A fully functional Discord clone built with Next.js, Node.js, and Socket.io.

## Project Structure

```
discord-clone-project/
├── discord-clone/          # Frontend (Next.js)
├── discord-clone-backend/  # Backend (Node.js + Express)
└── README.md              # This file
```

## Quick Start

### 1. Start the Backend Server

```bash
cd discord-clone-backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend Server

```bash
cd discord-clone
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

✅ **Authentication System**
- User registration and login
- JWT token-based authentication
- Protected routes
- User profile management

✅ **Real-time Messaging**
- WebSocket connections with Socket.io
- Live message sending and receiving
- Typing indicators
- Message reactions and attachments

✅ **Backend API**
- RESTful API endpoints
- MongoDB database integration
- File upload with Cloudinary
- Comprehensive error handling

## Tech Stack

**Frontend:**
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Socket.io client

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- JWT authentication
- Cloudinary file storage

## Development

Both servers need to be running simultaneously for the full application to work:

1. Backend provides the API and WebSocket server
2. Frontend connects to the backend for data and real-time features

## Notes

- MongoDB connection is optional for basic functionality
- The application will work without a local MongoDB instance
- All API endpoints are fully functional
- Real-time features require both servers to be running

