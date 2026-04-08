const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/responseHandler');

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    process.env.NODE_ENV === 'development' ? {} : { expiresIn: '7d' }
  );

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return error(res, 'Email already registered', 400);

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    return success(
      res,
      { token, user: { id: user._id, name: user.name, email: user.email } },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    const passwordMatch = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatch) return error(res, 'Invalid email or password', 401);

    const token = signToken(user._id);
    return success(
      res,
      { token, user: { id: user._id, name: user.name, email: user.email } },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};
