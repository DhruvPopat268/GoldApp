const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized: no token provided' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the id in the token is a valid ObjectId before trusting it
    if (!mongoose.Types.ObjectId.isValid(decoded.id))
      return res.status(401).json({ error: 'Unauthorized: invalid token payload' });

    req.user = { id: decoded.id };
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Unauthorized: token has expired'
        : 'Unauthorized: invalid token';
    return res.status(401).json({ error: message });
  }
};
