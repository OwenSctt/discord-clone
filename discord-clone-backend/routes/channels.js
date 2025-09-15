const express = require('express');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const { authenticateToken, checkChannelAccess, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private (Server Admin/Owner)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, description, serverId, isPrivate, userLimit } = req.body;
    const userId = req.user._id;

    // Validate server ownership/admin
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const member = server.members.find(m => m.user.toString() === userId.toString());
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to create channels' });
    }

    // Create channel
    const channel = new Channel({
      name,
      type: type || 'text',
      description: description || '',
      server: serverId,
      isPrivate: isPrivate || false,
      userLimit: userLimit || 0
    });

    await channel.save();

    // Add channel to server
    server.channels.push(channel._id);
    await server.save();

    res.status(201).json({
      message: 'Channel created successfully',
      channel: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        isPrivate: channel.isPrivate,
        userLimit: channel.userLimit,
        server: channel.server,
        createdAt: channel.createdAt
      }
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error during channel creation' });
  }
});

// @route   GET /api/channels/server/:serverId
// @desc    Get all channels for a server
// @access  Private (Server Member)
router.get('/server/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    // Check if user is member of server
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const member = server.members.find(m => m.user.toString() === userId.toString());
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    // Get channels
    const channels = await Channel.find({ server: serverId })
      .populate('lastMessage', 'content author createdAt')
      .sort({ position: 1, createdAt: 1 });

    res.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/channels/:channelId
// @desc    Get channel by ID
// @access  Private (Channel Access)
router.get('/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId)
      .populate('server', 'name icon')
      .populate('participants', 'username displayName avatar status');

    res.json({ channel });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/channels/:channelId
// @desc    Update channel
// @access  Private (Channel Admin/Owner)
router.put('/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const { name, description, isPrivate, userLimit } = req.body;
    const channel = req.channel;

    // Check permissions
    if (req.server) {
      const member = req.server.members.find(m => m.user.toString() === req.user._id.toString());
      if (!['owner', 'admin'].includes(member.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (isPrivate !== undefined) channel.isPrivate = isPrivate;
    if (userLimit !== undefined) channel.userLimit = userLimit;

    await channel.save();

    res.json({
      message: 'Channel updated successfully',
      channel: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        isPrivate: channel.isPrivate,
        userLimit: channel.userLimit
      }
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});

// @route   DELETE /api/channels/:channelId
// @desc    Delete channel
// @access  Private (Channel Admin/Owner)
router.delete('/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const channel = req.channel;

    // Check permissions
    if (req.server) {
      const member = req.server.members.find(m => m.user.toString() === req.user._id.toString());
      if (!['owner', 'admin'].includes(member.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }

    // Remove channel from server
    if (channel.server) {
      const server = await Server.findById(channel.server);
      if (server) {
        server.channels = server.channels.filter(id => id.toString() !== channel._id.toString());
        await server.save();
      }
    }

    // Delete channel
    await Channel.findByIdAndDelete(channel._id);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

// @route   POST /api/channels/:channelId/join
// @desc    Join a channel (for private channels)
// @access  Private
router.post('/:channelId/join', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const channel = req.channel;
    const userId = req.user._id;

    // Only for private channels
    if (!channel.isPrivate) {
      return res.status(400).json({ message: 'Channel is not private' });
    }

    // Add user to participants if not already present
    if (!channel.participants.includes(userId)) {
      channel.participants.push(userId);
      await channel.save();
    }

    res.json({ message: 'Successfully joined channel' });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/channels/:channelId/leave
// @desc    Leave a channel (for private channels)
// @access  Private
router.post('/:channelId/leave', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const channel = req.channel;
    const userId = req.user._id;

    // Only for private channels
    if (!channel.isPrivate) {
      return res.status(400).json({ message: 'Channel is not private' });
    }

    // Remove user from participants
    channel.participants = channel.participants.filter(id => id.toString() !== userId.toString());
    await channel.save();

    res.json({ message: 'Successfully left channel' });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
