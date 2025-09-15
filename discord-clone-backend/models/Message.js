const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function() {
      return !this.attachments || this.attachments.length === 0;
    },
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: function() {
      return this.type !== 'dm';
    }
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  },
  // For DM messages
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type === 'dm';
    }
  },
  type: {
    type: String,
    enum: ['channel', 'dm'],
    default: 'channel'
  },
  // Message attachments
  attachments: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    width: Number,
    height: Number
  }],
  // Message reactions
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Message mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Message flags
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date
  },
  // For system messages
  isSystem: {
    type: Boolean,
    default: false
  },
  systemType: {
    type: String,
    enum: ['user_joined', 'user_left', 'channel_created', 'channel_updated', 'role_created', 'role_updated']
  },
  // Message embeds (for rich content)
  embeds: [{
    title: String,
    description: String,
    url: String,
    color: String,
    fields: [{
      name: String,
      value: String,
      inline: Boolean
    }],
    thumbnail: {
      url: String,
      width: Number,
      height: Number
    },
    image: {
      url: String,
      width: Number,
      height: Number
    },
    footer: {
      text: String,
      icon_url: String
    },
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Update reaction count
messageSchema.methods.updateReactionCount = function() {
  this.reactions.forEach(reaction => {
    reaction.count = reaction.users.length;
  });
  return this.save();
};

// Add reaction
messageSchema.methods.addReaction = function(emoji, userId) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = {
      emoji: emoji,
      users: [],
      count: 0
    };
    this.reactions.push(reaction);
  }
  
  if (!reaction.users.includes(userId)) {
    reaction.users.push(userId);
    reaction.count = reaction.users.length;
  }
  
  return this.save();
};

// Remove reaction
messageSchema.methods.removeReaction = function(emoji, userId) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (reaction) {
    reaction.users = reaction.users.filter(id => id.toString() !== userId.toString());
    reaction.count = reaction.users.length;
    
    // Remove reaction if no users
    if (reaction.count === 0) {
      this.reactions = this.reactions.filter(r => r.emoji !== emoji);
    }
  }
  
  return this.save();
};

// Check if user can edit message
messageSchema.methods.canEdit = function(userId, userRole = 'member') {
  // Author can always edit their own messages
  if (this.author.toString() === userId.toString()) return true;
  
  // Admins and moderators can edit any message
  if (['admin', 'moderator'].includes(userRole)) return true;
  
  return false;
};

// Check if user can delete message
messageSchema.methods.canDelete = function(userId, userRole = 'member') {
  // Author can delete their own messages
  if (this.author.toString() === userId.toString()) return true;
  
  // Admins and moderators can delete any message
  if (['admin', 'moderator'].includes(userRole)) return true;
  
  return false;
};

// Search messages
messageSchema.statics.searchMessages = function(query, channelId, limit = 50) {
  return this.find({
    channel: channelId,
    content: { $regex: query, $options: 'i' }
  })
  .populate('author', 'username displayName avatar')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Message', messageSchema);
