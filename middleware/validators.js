const { body, validationResult } = require('express-validator');

// Sends first validation error as { error: '...' }
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

exports.signupRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ max: 100 })
    .withMessage('name too long'),
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required'),
];

exports.bankRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Bank name is required')
    .isLength({ max: 150 })
    .withMessage('Bank name too long'),
];

exports.bankUpdateRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Bank name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Bank name too long'),
];

exports.categoryRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name too long'),
];

exports.categoryUpdateRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name too long'),
];
