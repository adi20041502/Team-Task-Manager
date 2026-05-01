const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_MAP = {
  admin: 'Admin',
  member: 'Member',
};

const createToken = (user) =>
  jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '24h' });

const normalizeRole = (value) => ROLE_MAP[String(value || '').trim().toLowerCase()] || '';

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

const buildAuthResponse = (user) => ({
  token: createToken(user),
  user: sanitizeUser(user),
});

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const requestedRole = normalizeRole(req.body.role);

    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (req.body.role !== undefined && !requestedRole) {
      return res.status(400).json({ message: 'Role must be either Admin or Member.' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole || 'Member',
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Unable to create account right now.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!EMAIL_REGEX.test(email) || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to login right now.' });
  }
});

module.exports = router;
