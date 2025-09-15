const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username displayName avatar status lastSeen')
      .select('friends');

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.user', 'username displayName avatar status')
      .select('friendRequests');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (targetUser.friends.includes(currentUserId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.user.toString() === currentUserId.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if there's a pending request from target user
    const currentUser = await User.findById(currentUserId);
    const reverseRequest = currentUser.friendRequests.find(
      req => req.user.toString() === userId && req.status === 'pending'
    );

    if (reverseRequest) {
      return res.status(400).json({ message: 'This user has already sent you a friend request' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      user: currentUserId,
      status: 'pending'
    });

    await targetUser.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/friends/request/:requestId
// @desc    Accept or decline friend request
// @access  Private
router.put('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const currentUserId = req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "accept" or "decline"' });
    }

    const user = await User.findById(currentUserId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    if (action === 'accept') {
      // Add to friends list
      user.friends.push(request.user);
      
      // Add current user to requester's friends list
      const requester = await User.findById(request.user);
      if (requester) {
        requester.friends.push(currentUserId);
        await requester.save();
      }
    }

    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'declined';
    await user.save();

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      action 
    });
  } catch (error) {
    console.error('Friend request action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/friends/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they are actually friends
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'Not friends with this user' });
    }

    // Remove from both friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== currentUserId.toString());

    await Promise.all([user.save(), friend.save()]);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/blocked
// @desc    Get blocked users (future feature)
// @access  Private
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    // This would be implemented when blocking feature is added
    res.json({ blocked: [] });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/block
// @desc    Block a user (future feature)
// @access  Private
router.post('/block', authenticateToken, async (req, res) => {
  try {
    // This would be implemented when blocking feature is added
    res.status(501).json({ message: 'Blocking feature not yet implemented' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/respond
// @desc    Respond to friend request (accept/decline)
// @access  Private
router.post('/respond', authenticateToken, async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const currentUserId = req.user._id;

    if (!requestId || !action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Find the user and the friend request
    const user = await User.findById(currentUserId);
    const friendRequest = user.friendRequests.find(req => req._id.toString() === requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    if (action === 'accept') {
      // Add to friends list
      user.friends.push(friendRequest.user);
      
      // Add current user to the requester's friends list
      const requester = await User.findById(friendRequest.user);
      requester.friends.push(currentUserId);
      await requester.save();
    }

    // Update the request status
    friendRequest.status = action === 'accept' ? 'accepted' : 'declined';
    await user.save();

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      success: true 
    });
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
