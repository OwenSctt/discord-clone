const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  icon: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      manageChannels: { type: Boolean, default: false },
      manageRoles: { type: Boolean, default: false },
      kickMembers: { type: Boolean, default: false },
      banMembers: { type: Boolean, default: false },
      manageMessages: { type: Boolean, default: false },
      mentionEveryone: { type: Boolean, default: false }
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  roles: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#99aab5'
    },
    permissions: {
      manageChannels: { type: Boolean, default: false },
      manageRoles: { type: Boolean, default: false },
      kickMembers: { type: Boolean, default: false },
      banMembers: { type: Boolean, default: false },
      manageMessages: { type: Boolean, default: false },
      mentionEveryone: { type: Boolean, default: false }
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  maxMembers: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

// Generate unique invite code
serverSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if user has permission
serverSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return false;
  
  // Owner has all permissions
  if (member.role === 'owner') return true;
  
  // Check member-specific permissions
  if (member.permissions[permission]) return true;
  
  // Check role permissions
  const role = this.roles.find(r => r.name === member.role);
  if (role && role.permissions[permission]) return true;
  
  return false;
};

// Add member to server
serverSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) return false;
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  return true;
};

// Remove member from server
serverSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) return false;
  
  this.members.splice(memberIndex, 1);
  return true;
};

module.exports = mongoose.model('Server', serverSchema);
