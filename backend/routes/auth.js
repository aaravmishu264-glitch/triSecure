const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, faceEmbeddings } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      faceEmbeddings: faceEmbeddings || []
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'trisecure_jwt_secret_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceData: user.faceEmbeddings.length > 0
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'trisecure_jwt_secret_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceData: user.faceEmbeddings.length > 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      hasFaceData: req.user.faceEmbeddings.length > 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update face embeddings
router.post('/update-face', auth, async (req, res) => {
  try {
    const { faceEmbeddings } = req.body;
    if (!faceEmbeddings || faceEmbeddings.length === 0) {
      return res.status(400).json({ message: 'No face data provided' });
    }

    await User.findByIdAndUpdate(req.user._id, { faceEmbeddings });

    res.json({ message: 'Face data updated successfully', hasFaceData: true });
  } catch (error) {
    console.error('Update face error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
