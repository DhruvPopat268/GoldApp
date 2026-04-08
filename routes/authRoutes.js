const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { signup, login } = require('../controllers/authController');
const { signupRules, loginRules, validate } = require('../middleware/validators');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later' },
});

router.post('/signup', authLimiter, signupRules, validate, signup);
router.post('/login', authLimiter, loginRules, validate, login);

module.exports = router;
