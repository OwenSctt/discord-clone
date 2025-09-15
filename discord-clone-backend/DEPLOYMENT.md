# Discord Clone Backend - Deployment Guide

## Prerequisites

- Node.js 18+ or Docker
- MongoDB (local or cloud)
- Cloudinary account (for file uploads)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/discord-clone

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRE=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The server will be available at `http://localhost:5000`

## Docker Deployment

1. Build the Docker image:
```bash
npm run docker:build
```

2. Start with Docker Compose (includes MongoDB):
```bash
npm run docker:run
```

3. Stop the services:
```bash
npm run docker:stop
```

4. View logs:
```bash
npm run docker:logs
```

## Production Deployment

### Using Docker

1. Build the production image:
```bash
docker build -t discord-clone-backend .
```

2. Run with environment variables:
```bash
docker run -d \
  --name discord-clone-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  -e JWT_SECRET=your-production-jwt-secret \
  -e CLOUDINARY_CLOUD_NAME=your-cloud-name \
  -e CLOUDINARY_API_KEY=your-api-key \
  -e CLOUDINARY_API_SECRET=your-api-secret \
  -e FRONTEND_URL=https://your-frontend-domain.com \
  discord-clone-backend
```

### Using PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start scripts/start.js --name discord-clone-backend
```

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

### Using Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Using Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/verify-token` - Verify JWT token

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/:userId` - Get user by ID

### Servers
- `POST /api/servers` - Create server
- `GET /api/servers` - Get user's servers
- `GET /api/servers/:serverId` - Get server by ID
- `PUT /api/servers/:serverId` - Update server
- `DELETE /api/servers/:serverId` - Delete server
- `POST /api/servers/:serverId/invite` - Generate invite code
- `POST /api/servers/join/:inviteCode` - Join server with invite
- `DELETE /api/servers/:serverId/leave` - Leave server

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels/server/:serverId` - Get server channels
- `GET /api/channels/:channelId` - Get channel by ID
- `PUT /api/channels/:channelId` - Update channel
- `DELETE /api/channels/:channelId` - Delete channel
- `POST /api/channels/:channelId/join` - Join private channel
- `POST /api/channels/:channelId/leave` - Leave private channel

### Messages
- `GET /api/messages/:channelId` - Get channel messages
- `POST /api/messages/:channelId` - Send message
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions` - Remove reaction
- `GET /api/messages/search/:channelId` - Search messages

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/request/:requestId` - Accept/decline request
- `DELETE /api/friends/:friendId` - Remove friend

### File Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video
- `POST /api/upload/file` - Upload file
- `POST /api/upload/avatar` - Upload avatar
- `DELETE /api/upload/:publicId` - Delete file

## Health Check

The application includes a health check endpoint:
- `GET /api/health` - Returns server status

## Monitoring

- Application logs are available via `docker-compose logs`
- Health check endpoint for monitoring services
- Request logging middleware for debugging

## Security

- JWT authentication for all protected routes
- CORS configuration for frontend integration
- Rate limiting to prevent abuse
- Input validation and sanitization
- Error handling without sensitive information exposure

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in environment variables

2. **CORS Errors**
   - Update FRONTEND_URL environment variable
   - Check CORS configuration

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits

4. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check token expiration

### Logs

View application logs:
```bash
# Docker
docker-compose logs -f backend

# PM2
pm2 logs discord-clone-backend

# Direct
npm run dev
```
