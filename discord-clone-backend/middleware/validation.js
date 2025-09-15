const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 2, max: 32 })
    .withMessage('Username must be between 2 and 32 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('displayName')
    .isLength({ min: 2, max: 32 })
    .withMessage('Display name must be between 2 and 32 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 32 })
    .withMessage('Display name must be between 2 and 32 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('status')
    .optional()
    .isIn(['online', 'away', 'busy', 'invisible'])
    .withMessage('Status must be one of: online, away, busy, invisible'),
  handleValidationErrors
];

// Server validation rules
const validateServerCreation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Server name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  handleValidationErrors
];

const validateServerUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Server name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('icon')
    .optional()
    .isURL()
    .withMessage('Icon must be a valid URL'),
  handleValidationErrors
];

// Channel validation rules
const validateChannelCreation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Channel name must be between 1 and 100 characters')
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('type')
    .optional()
    .isIn(['text', 'voice', 'video', 'announcement', 'custom'])
    .withMessage('Channel type must be one of: text, voice, video, announcement, custom'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),
  body('userLimit')
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage('User limit must be between 0 and 99'),
  handleValidationErrors
];

const validateChannelUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Channel name must be between 1 and 100 characters')
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),
  body('userLimit')
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage('User limit must be between 0 and 99'),
  handleValidationErrors
];

// Message validation rules
const validateMessageCreation = [
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Message content must be less than 2000 characters'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('ReplyTo must be a valid message ID'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be valid'),
  body('attachments.*.filename')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Attachment filename must be less than 255 characters'),
  body('attachments.*.size')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Attachment size must be a positive integer'),
  body('attachments.*.type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Attachment type must be less than 100 characters'),
  handleValidationErrors
];

const validateMessageUpdate = [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  handleValidationErrors
];

// Friend validation rules
const validateFriendRequest = [
  body('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

const validateFriendRequestAction = [
  body('action')
    .isIn(['accept', 'decline'])
    .withMessage('Action must be either "accept" or "decline"'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (maxSize, allowedTypes) => [
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      });
    }

    next();
  }
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateServerCreation,
  validateServerUpdate,
  validateChannelCreation,
  validateChannelUpdate,
  validateMessageCreation,
  validateMessageUpdate,
  validateFriendRequest,
  validateFriendRequestAction,
  validateFileUpload,
  validateObjectId,
  validatePagination,
  validateSearch
};
