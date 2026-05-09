const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const TimeSlot = require('../models/TimeSlot');
const Attendance = require('../models/Attendance');
const { auth, adminOnly } = require('../middleware/auth');

// ========== CLASSROOMS ==========

router.get('/classrooms', auth, adminOnly, async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/classrooms', auth, adminOnly, async (req, res) => {
  try {
    const { name, latitude, longitude, radiusMeters } = req.body;
    const classroom = new Classroom({ name, latitude, longitude, radiusMeters: radiusMeters || 50 });
    await classroom.save();
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/classrooms/:id', auth, adminOnly, async (req, res) => {
  try {
    await Classroom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Classroom deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== TIME SLOTS ==========

router.get('/timeslots', auth, adminOnly, async (req, res) => {
  try {
    const slots = await TimeSlot.find().populate('classroom').sort({ createdAt: -1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/timeslots', auth, adminOnly, async (req, res) => {
  try {
    const { className, startTime, endTime, classroom, section, teacher } = req.body;
    const slot = new TimeSlot({ className, startTime, endTime, classroom, section, teacher });
    await slot.save();
    const populated = await slot.populate('classroom');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/timeslots/:id', auth, adminOnly, async (req, res) => {
  try {
    await TimeSlot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Time slot deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== STUDENTS ==========

router.get('/students', auth, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password -faceEmbeddings').sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/teachers', auth, adminOnly, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'admin' }).select('-password -faceEmbeddings').sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/students/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ student: req.params.id });
    res.json({ message: 'Student and their records deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students with face enrollment status (includes hasFaceData flag)
router.get('/students/enrollment', auth, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email faceEmbeddings createdAt').sort({ createdAt: -1 });
    const result = students.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      hasFaceData: s.faceEmbeddings && s.faceEmbeddings.length > 0,
      faceCount: s.faceEmbeddings ? s.faceEmbeddings.length : 0,
      createdAt: s.createdAt,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Advanced single-step enrollment (details + face)
router.post('/students/enroll', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, rollNumber, department, section, phoneNumber, faceEmbeddings } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email required' });

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { rollNumber }] });
    if (exists) return res.status(400).json({ message: 'Student with this email or roll number already exists' });

    const hashedPassword = await bcrypt.hash(password || 'student123', 10);
    const user = new User({
      name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword, role: 'student',
      rollNumber, department, section, phoneNumber, faceEmbeddings: faceEmbeddings || []
    });
    await user.save();
    res.status(201).json({ message: 'Student enrolled successfully', student: user });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk create students (admin adds multiple at once)
const bcrypt = require('bcryptjs');
router.post('/students/bulk', auth, adminOnly, async (req, res) => {
  try {
    const { students } = req.body; // Array of { name, email }
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Provide an array of students' });
    }

    const results = [];
    const defaultPassword = await bcrypt.hash('student123', 10);

    for (const s of students) {
      if (!s.name || !s.email) {
        results.push({ name: s.name || 'Unknown', email: s.email || '', status: 'SKIPPED', reason: 'Missing name or email' });
        continue;
      }

      const exists = await User.findOne({ email: s.email.toLowerCase().trim() });
      if (exists) {
        results.push({ name: s.name, email: s.email, status: 'SKIPPED', reason: 'Email already registered' });
        continue;
      }

      const user = new User({
        name: s.name.trim(),
        email: s.email.toLowerCase().trim(),
        password: defaultPassword,
        role: 'student',
        faceEmbeddings: [],
      });
      await user.save();
      results.push({ name: s.name, email: s.email, status: 'CREATED', id: user._id });
    }

    res.status(201).json({ message: `Processed ${results.length} students`, results });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll face data for a specific student (admin captures face on behalf of student)
router.post('/students/:id/face', auth, adminOnly, async (req, res) => {
  try {
    const { faceEmbeddings } = req.body; // Array of face descriptors
    if (!faceEmbeddings || !Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0) {
      return res.status(400).json({ message: 'No face embeddings provided' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.faceEmbeddings = faceEmbeddings;
    await student.save();

    res.json({ message: `Face data saved for ${student.name} (${faceEmbeddings.length} samples)`, student: { _id: student._id, name: student.name } });
  } catch (error) {
    console.error('Face enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear face data for a student
router.delete('/students/:id/face', auth, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.faceEmbeddings = [];
    await student.save();
    res.json({ message: `Face data cleared for ${student.name}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ATTENDANCE RECORDS ==========

router.get('/attendance', auth, adminOnly, async (req, res) => {
  try {
    const { date, timeSlotId } = req.query;
    const filter = {};

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    if (timeSlotId) {
      filter.timeSlot = timeSlotId;
    }

    const attendance = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('timeSlot')
      .sort({ date: -1 })
      .limit(500);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export attendance as CSV
router.get('/attendance/export', auth, adminOnly, async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('student', 'name email')
      .populate('timeSlot')
      .sort({ date: -1 });

    let csv = 'Student Name,Email,Class,Date,Status,Face Verified,Location Verified,Time Verified,Remarks\n';
    attendance.forEach((a) => {
      csv += `"${a.student?.name || 'N/A'}","${a.student?.email || 'N/A'}","${a.timeSlot?.className || 'N/A'}","${new Date(a.date).toLocaleDateString()}","${a.status}","${a.verifiedFace}","${a.verifiedLocation}","${a.verifiedTime}","${a.remarks}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClassrooms = await Classroom.countDocuments();
    const totalSlots = await TimeSlot.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const totalPresent = await Attendance.countDocuments({ status: 'PRESENT' });
    const totalAbsent = totalAttendance - totalPresent;

    res.json({ totalStudents, totalClassrooms, totalSlots, totalAttendance, totalPresent, totalAbsent });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
