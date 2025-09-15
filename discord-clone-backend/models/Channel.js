const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'video', 'announcement', 'custom'],
    default: 'text'
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: function() {
      return this.type !== 'dm' && this.type !== 'group';
    }
  },
  // For DM and group chats
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For group chats
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Channel permissions
  permissions: [{
    role: {
      type: String,
      enum: ['@everyone', 'admin', 'moderator', 'member']
    },
    allow: [String], // Array of allowed permissions
    deny: [String]   // Array of denied permissions
  }],
  // Channel settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  isNsfw: {
    type: Boolean,
    default: false
  },
  slowMode: {
    type: Number,
    default: 0 // seconds between messages
  },
  position: {
    type: Number,
    default: 0
  },
  // For voice/video channels
  userLimit: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  // Last message for sorting
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update last message
channelSchema.methods.updateLastMessage = function(messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  return this.save();
};

// Check if user can access channel
channelSchema.methods.canAccess = function(userId, userRole = 'member') {
  // If it's a DM or group chat, check participants
  if (this.type === 'dm' || this.type === 'group') {
    return this.participants.some(p => p.toString() === userId.toString());
  }
  
  // For server channels, check if user is member of server
  // This would need to be checked at the server level
  return true; // Will be validated in the route handler
};

// Check if user can send messages
channelSchema.methods.canSendMessage = function(userId, userRole = 'member') {
  // Check slow mode
  if (this.slowMode > 0) {
    // This would need to be checked with last message timestamp
    // Implementation would be in the message creation route
  }
  
  // Check permissions
  const permission = this.permissions.find(p => p.role === userRole || p.role === '@everyone');
  if (permission) {
    return !permission.deny.includes('SEND_MESSAGES') && 
           (permission.allow.includes('SEND_MESSAGES') || userRole === 'admin');
  }
  
  return true; // Default allow
};

module.exports = mongoose.model('Channel', channelSchema);
