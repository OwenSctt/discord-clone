const express = require('express');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { authenticateToken, checkChannelAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/dm/:recipientId
// @desc    Get DM messages with a specific user
// @access  Private
router.get('/dm/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { author: userId, recipient: recipientId },
        { author: recipientId, recipient: userId }
      ]
    })
    .populate('author', 'username displayName avatar')
    .populate('recipient', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * 1)
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ 
      success: true,
      messages: messages.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get DM messages error:', error);
    res.status(500).json({ message: 'Server error during DM fetch' });
  }
});

// @route   POST /api/messages/dm
// @desc    Send a DM message
// @access  Private
router.post('/dm', authenticateToken, async (req, res) => {
  try {
    const { content, recipientId } = req.body;
    const userId = req.user._id;

    if (!content || !recipientId) {
      return res.status(400).json({ message: 'Content and recipient are required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create message
    const message = new Message({
      content,
      author: userId,
      recipient: recipientId,
      type: 'dm'
    });

    await message.save();

    // Populate the message
    await message.populate('author', 'username displayName avatar');
    await message.populate('recipient', 'username displayName avatar');

    // Emit to both users
    if (global.io) {
      global.io.to(`user-${userId}`).emit('dm-received', message);
      global.io.to(`user-${recipientId}`).emit('dm-received', message);
    }

    res.status(201).json({
      success: true,
      message: 'DM sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({ message: 'Server error during DM send' });
  }
});

// @route   GET /api/messages/:channelId
// @desc    Get messages for a channel
// @access  Private (Channel Access)
router.get('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get messages for the channel
    const messages = await Message.find({ channel: channelId })
      .populate('author', 'username displayName avatar')
      .populate('replyTo.author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ 
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:channelId
// @desc    Send a message to a channel
// @access  Private (Channel Access)
router.post('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo, attachments } = req.body;
    const userId = req.user._id;

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Create new message
    const message = new Message({
      content: content.trim(),
      author: userId,
      channel: channelId,
      replyTo: replyTo || null,
      attachments: attachments || []
    });

    await message.save();
    await message.populate('author', 'username displayName avatar');

    // Update channel's last message timestamp
    channel.lastMessageAt = new Date();
    await channel.save();

    // Emit message to all clients in the channel
    if (global.io) {
      console.log(`Emitting message to channel-${channelId}:`, message);
      global.io.to(`channel-${channelId}`).emit('message-received', message);
      console.log(`Message emitted to channel-${channelId}`);
    } else {
      console.log('Socket.io not available, message not emitted');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      channelId: req.params.channelId,
      userId: req.user?._id,
      content: req.body?.content
    });
    res.status(500).json({ message: 'Server error during message sending' });
  }
});

// @route   PUT /api/messages/:messageId
// @desc    Edit a message
// @access  Private (Message Author or Admin)
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user can edit message
    if (!message.canEdit(userId, req.memberRole)) {
      return res.status(403).json({ message: 'Cannot edit this message' });
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Populate message data
    await message.populate('author', 'username displayName avatar');
    await message.populate('replyTo', 'content author createdAt');
    await message.populate('mentions', 'username displayName');

    // Emit real-time event
    req.app.get('io').to(`channel-${message.channel}`).emit('message-updated', {
      id: message._id,
      content: message.content,
      isEdited: message.isEdited,
      editedAt: message.editedAt
    });

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error during message edit' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private (Message Author or Admin)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user can delete message
    if (!message.canDelete(userId, req.memberRole)) {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Emit real-time event
    req.app.get('io').to(`channel-${message.channel}`).emit('message-deleted', {
      id: messageId,
      channel: message.channel
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error during message deletion' });
  }
});

// @route   POST /api/messages/:messageId/reactions
// @desc    Add reaction to a message
// @access  Private (Channel Access)
router.post('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check channel access
    const channel = await Channel.findById(message.channel);
    if (!channel.canAccess(userId)) {
      return res.status(403).json({ message: 'Cannot access this channel' });
    }

    // Add reaction
    await message.addReaction(emoji, userId);

    // Populate message data
    await message.populate('author', 'username displayName avatar');
    await message.populate('reactions.users', 'username displayName');

    // Emit real-time event
    req.app.get('io').to(`channel-${message.channel}`).emit('reaction-added', {
      messageId: message._id,
      emoji: emoji,
      userId: userId,
      reactions: message.reactions
    });

    res.json({
      message: 'Reaction added successfully',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:messageId/reactions
// @desc    Remove reaction from a message
// @access  Private (Channel Access)
router.delete('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check channel access
    const channel = await Channel.findById(message.channel);
    if (!channel.canAccess(userId)) {
      return res.status(403).json({ message: 'Cannot access this channel' });
    }

    // Remove reaction
    await message.removeReaction(emoji, userId);

    // Emit real-time event
    req.app.get('io').to(`channel-${message.channel}`).emit('reaction-removed', {
      messageId: message._id,
      emoji: emoji,
      userId: userId,
      reactions: message.reactions
    });

    res.json({
      message: 'Reaction removed successfully',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/search/:channelId
// @desc    Search messages in a channel
// @access  Private (Channel Access)
router.get('/search/:channelId', authenticateToken, checkChannelAccess, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const messages = await Message.searchMessages(q, channelId, parseInt(limit));

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
