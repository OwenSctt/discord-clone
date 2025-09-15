const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is server member
const checkServerMember = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const Server = require('../models/Server');
    const server = await Server.findById(serverId);
    
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const member = server.members.find(m => m.user.toString() === userId.toString());
    if (!member) {
      console.log('User not found in server members:', {
        userId: userId.toString(),
        serverId: serverId,
        members: server.members.map(m => ({ user: m.user.toString(), role: m.role }))
      });
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    req.server = server;
    req.memberRole = member.role;
    next();
  } catch (error) {
    console.error('Server member check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user has specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      const { server } = req;
      const userId = req.user._id;
      const userRole = req.memberRole;

      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }

      if (server.hasPermission(userId, permission)) {
        next();
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

// Check if user can access channel
const checkChannelAccess = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    const Channel = require('../models/Channel');
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user can access the channel
    if (channel.type === 'dm' || channel.type === 'group') {
      if (!channel.participants.includes(userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (channel.server) {
      // For server channels, check if user is member of the server
      const Server = require('../models/Server');
      const server = await Server.findById(channel.server);
      
      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }

      const member = server.members.find(m => m.user.toString() === userId.toString());
      if (!member) {
        return res.status(403).json({ message: 'Not a member of this server' });
      }

      req.server = server;
      req.memberRole = member.role;
    }

    req.channel = channel;
    next();
  } catch (error) {
    console.error('Channel access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkServerMember,
  checkPermission,
  checkChannelAccess
};
