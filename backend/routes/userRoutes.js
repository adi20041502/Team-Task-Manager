const express = require('express');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('name email role').sort({ name: 1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch users right now.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  return res.status(200).json({
    id: req.user._id.toString(),
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
