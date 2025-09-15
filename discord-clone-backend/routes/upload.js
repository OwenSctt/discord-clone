const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but could be restricted
    cb(null, true);
  }
});

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Private
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check file size (8MB limit for images)
    if (req.file.size > 8 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image file too large. Maximum size is 8MB.' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'discord-clone/images',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'Image uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        width: result.width,
        height: result.height,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload' });
  }
});

// @route   POST /api/upload/video
// @desc    Upload video file
// @access  Private
router.post('/video', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    // Check file size (50MB limit for videos)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ message: 'Video file too large. Maximum size is 50MB.' });
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.' 
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'discord-clone/videos',
          transformation: [
            { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'Video uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        width: result.width,
        height: result.height,
        duration: result.duration,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Server error during video upload' });
  }
});

// @route   POST /api/upload/file
// @desc    Upload any file type
// @access  Private
router.post('/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Check file size (50MB limit for general files)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'discord-clone/files'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    // Check file size (2MB limit for avatars)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: 'Avatar file too large. Maximum size is 2MB.' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Upload to Cloudinary with specific transformations for avatars
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'discord-clone/avatars',
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: {
        url: result.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error during avatar upload' });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete uploaded file
// @access  Private
router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
});

module.exports = router;
