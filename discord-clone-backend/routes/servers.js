const express = require('express');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const { authenticateToken, checkServerMember, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/servers
// @desc    Create a new server
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user._id;

    // Check server limit (5 max)
    const userServers = await Server.find({ owner: ownerId });
    if (userServers.length >= 5) {
      return res.status(400).json({ message: 'Maximum server limit reached (5 servers)' });
    }

    // Create server
    const server = new Server({
      name,
      description: description || '',
      owner: ownerId
    });

    // Add owner as member
    server.addMember(ownerId, 'owner');

    // Generate invite code
    server.inviteCode = server.generateInviteCode();

    await server.save();

    // Create default channels
    const generalChannel = new Channel({
      name: 'general',
      type: 'text',
      server: server._id,
      description: 'General discussion'
    });

    const voiceChannel = new Channel({
      name: 'General',
      type: 'voice',
      server: server._id
    });

    await Promise.all([generalChannel.save(), voiceChannel.save()]);

    // Add channels to server
    server.channels.push(generalChannel._id, voiceChannel._id);
    await server.save();

    // Populate server data
    await server.populate('channels', 'name type description');
    await server.populate('members.user', 'username displayName avatar status');

    res.status(201).json({
      message: 'Server created successfully',
      server: {
        id: server._id,
        name: server.name,
        description: server.description,
        icon: server.icon,
        owner: server.owner,
        inviteCode: server.inviteCode,
        channels: server.channels,
        members: server.members,
        createdAt: server.createdAt
      }
    });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ message: 'Server error during creation' });
  }
});

// @route   GET /api/servers
// @desc    Get user's servers
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const servers = await Server.find({
      'members.user': userId
    })
    .populate('channels', 'name type description lastMessageAt')
    .populate('members.user', 'username displayName avatar status')
    .sort({ updatedAt: -1 });

    // If no servers, create a default one
    if (servers.length === 0) {
      const defaultServer = new Server({
        name: 'My Server',
        description: 'Welcome to your first server!',
        owner: userId
      });

      // Add owner as member
      defaultServer.addMember(userId, 'owner');
      defaultServer.inviteCode = defaultServer.generateInviteCode();

      await defaultServer.save();

      // Create default channels
      const generalChannel = new Channel({
        name: 'general',
        type: 'text',
        server: defaultServer._id,
        description: 'General discussion'
      });

      await generalChannel.save();

      // Add channel to server
      defaultServer.channels.push(generalChannel._id);
      await defaultServer.save();

      // Populate the server
      await defaultServer.populate('channels', 'name type description lastMessageAt');
      await defaultServer.populate('members.user', 'username displayName avatar status');

      res.json({ servers: [defaultServer] });
    } else {
      res.json({ servers });
    }
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/servers/:serverId
// @desc    Get server by ID
// @access  Private
router.get('/:serverId', authenticateToken, checkServerMember, async (req, res) => {
  try {
    const server = await Server.findById(req.params.serverId)
      .populate('channels', 'name type description lastMessageAt')
      .populate('members.user', 'username displayName avatar status role')
      .populate('owner', 'username displayName avatar');

    res.json({ server });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/servers/:serverId
// @desc    Update server
// @access  Private (Owner/Admin)
router.put('/:serverId', authenticateToken, checkServerMember, checkPermission('manageChannels'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const server = req.server;

    if (name) server.name = name;
    if (description !== undefined) server.description = description;
    if (icon !== undefined) server.icon = icon;

    await server.save();

    res.json({
      message: 'Server updated successfully',
      server: {
        id: server._id,
        name: server.name,
        description: server.description,
        icon: server.icon
      }
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});

// @route   DELETE /api/servers/:serverId
// @desc    Delete server
// @access  Private (Owner only)
router.delete('/:serverId', authenticateToken, checkServerMember, async (req, res) => {
  try {
    const server = req.server;

    // Only owner can delete server
    if (req.memberRole !== 'owner') {
      return res.status(403).json({ message: 'Only server owner can delete the server' });
    }

    // Delete all channels
    await Channel.deleteMany({ server: server._id });

    // Delete server
    await Server.findByIdAndDelete(server._id);

    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

// @route   POST /api/servers/:serverId/invite
// @desc    Generate new invite code
// @access  Private (Owner/Admin)
router.post('/:serverId/invite', authenticateToken, checkServerMember, checkPermission('manageChannels'), async (req, res) => {
  try {
    const server = req.server;

    // Generate new invite code
    server.inviteCode = server.generateInviteCode();
    await server.save();

    res.json({
      message: 'New invite code generated',
      inviteCode: server.inviteCode
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/servers/join/:inviteCode
// @desc    Join server with invite code
// @access  Private
router.post('/join/:inviteCode', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    const server = await Server.findOne({ inviteCode });
    if (!server) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if user is already a member
    const existingMember = server.members.find(m => m.user.toString() === userId.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this server' });
    }

    // Check server capacity
    if (server.members.length >= server.maxMembers) {
      return res.status(400).json({ message: 'Server is full' });
    }

    // Add user to server
    server.addMember(userId, 'member');
    await server.save();

    // Populate server data
    await server.populate('channels', 'name type description');
    await server.populate('members.user', 'username displayName avatar status');

    res.json({
      message: 'Successfully joined server',
      server: {
        id: server._id,
        name: server.name,
        description: server.description,
        icon: server.icon,
        channels: server.channels,
        members: server.members
      }
    });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/servers/:serverId/members
// @desc    Get server members
// @access  Private
router.get('/:serverId/members', authenticateToken, checkServerMember, async (req, res) => {
  try {
    const server = req.server;
    
    await server.populate('members.user', 'username displayName avatar status lastSeen');
    
    res.json({ members: server.members });
  } catch (error) {
    console.error('Get server members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/servers/:serverId/leave
// @desc    Leave server
// @access  Private
router.delete('/:serverId/leave', authenticateToken, checkServerMember, async (req, res) => {
  try {
    const server = req.server;
    const userId = req.user._id;

    // Owner cannot leave server (must transfer ownership or delete)
    if (req.memberRole === 'owner') {
      return res.status(400).json({ message: 'Server owner cannot leave. Transfer ownership or delete server.' });
    }

    // Remove user from server
    server.removeMember(userId);
    await server.save();

    res.json({ message: 'Successfully left server' });
  } catch (error) {
    console.error('Leave server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
