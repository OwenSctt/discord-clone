const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search for users
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username displayName avatar status')
    .limit(parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error during user search' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username displayName avatar bio status lastSeen')
      .populate('servers.server', 'name icon');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/friend-request
// @desc    Send friend request
// @access  Private
router.post('/friend-request', authenticateToken, async (req, res) => {
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

// @route   PUT /api/users/friend-request/:requestId
// @desc    Accept or decline friend request
// @access  Private
router.put('/friend-request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const currentUserId = req.user._id;

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

// @route   DELETE /api/users/friends/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
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

// @route   GET /api/users/friends/requests
// @desc    Get friend requests
// @access  Private
router.get('/friends/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.user', 'username displayName avatar')
      .select('friendRequests');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
