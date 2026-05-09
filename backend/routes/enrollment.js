const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ========== PUBLIC FACE ENROLLMENT STATION ==========
// These routes are used by the student-facing enrollment kiosk
// Students can select their name and enroll their face without needing admin to be present

// Get all students with enrollment status (public — no auth needed for kiosk mode)
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email rollNumber department section faceEmbeddings createdAt')
      .sort({ name: 1 });

    const result = students.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || '',
      department: s.department || '',
      section: s.section || '',
      hasFaceData: s.faceEmbeddings && s.faceEmbeddings.length > 0,
      faceCount: s.faceEmbeddings ? s.faceEmbeddings.length : 0,
      createdAt: s.createdAt,
    }));
    res.json(result);
  } catch (error) {
    console.error('Enrollment list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student self-enrolls face data (public — student selects themselves from list)
router.post('/students/:id/face', async (req, res) => {
  try {
    const { faceEmbeddings } = req.body;
    if (!faceEmbeddings || !Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0) {
      return res.status(400).json({ message: 'No face embeddings provided' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.faceEmbeddings = faceEmbeddings;
    await student.save();

    res.json({
      message: `Face data saved for ${student.name} (${faceEmbeddings.length} samples)`,
      student: { _id: student._id, name: student.name, hasFaceData: true }
    });
  } catch (error) {
    console.error('Self-enroll face error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student re-enrolls (overwrites existing face data)
router.put('/students/:id/face', async (req, res) => {
  try {
    const { faceEmbeddings } = req.body;
    if (!faceEmbeddings || !Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0) {
      return res.status(400).json({ message: 'No face embeddings provided' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.faceEmbeddings = faceEmbeddings;
    await student.save();

    res.json({
      message: `Face data re-enrolled for ${student.name} (${faceEmbeddings.length} samples)`,
      student: { _id: student._id, name: student.name, hasFaceData: true }
    });
  } catch (error) {
    console.error('Re-enroll face error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
