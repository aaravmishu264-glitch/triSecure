const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const TimeSlot = require('../models/TimeSlot');
const Attendance = require('../models/Attendance');
const { auth } = require('../middleware/auth');

// Haversine formula to calculate distance between two GPS coordinates
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Euclidean distance between two face embeddings
function euclideanDistance(arr1, arr2) {
  if (arr1.length !== arr2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += (arr1[i] - arr2[i]) ** 2;
  }
  return Math.sqrt(sum);
}

// Mark attendance - CORE triple verification
router.post('/mark', auth, async (req, res) => {
  try {
    const { faceDescriptor, latitude, longitude, timeSlotId } = req.body;

    if (!faceDescriptor || !latitude || !longitude || !timeSlotId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const timeSlot = await TimeSlot.findById(timeSlotId).populate('classroom');
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Check if already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      student: req.user._id,
      timeSlot: timeSlotId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for this slot today', attendance: existing });
    }

    // ========== VERIFICATION 1: Face Recognition ==========
    let verifiedFace = false;
    const student = await User.findById(req.user._id);
    if (student.faceEmbeddings && student.faceEmbeddings.length > 0) {
      const THRESHOLD = 0.6;
      for (const embedding of student.faceEmbeddings) {
        const distance = euclideanDistance(faceDescriptor, embedding);
        if (distance < THRESHOLD) {
          verifiedFace = true;
          break;
        }
      }
    }

    // ========== VERIFICATION 2: Location (GPS) ==========
    let verifiedLocation = false;
    const classroom = timeSlot.classroom;
    if (classroom) {
      const distance = getDistanceMeters(latitude, longitude, classroom.latitude, classroom.longitude);
      verifiedLocation = distance <= classroom.radiusMeters;
    }

    // ========== VERIFICATION 3: Time Slot ==========
    let verifiedTime = false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = timeSlot.startTime.split(':').map(Number);
    const [endH, endM] = timeSlot.endTime.split(':').map(Number);
    const slotStart = startH * 60 + startM;
    const slotEnd = endH * 60 + endM;
    verifiedTime = currentMinutes >= slotStart && currentMinutes <= slotEnd;

    // ========== FINAL DECISION ==========
    const allVerified = verifiedFace && verifiedLocation && verifiedTime;
    const status = allVerified ? 'PRESENT' : 'ABSENT';

    const remarks = [];
    if (!verifiedFace) remarks.push('Face not recognized');
    if (!verifiedLocation) remarks.push('Location mismatch');
    if (!verifiedTime) remarks.push('Outside time slot');

    const attendance = new Attendance({
      student: req.user._id,
      timeSlot: timeSlotId,
      status,
      remarks: allVerified ? 'All verifications passed' : remarks.join(', '),
      verifiedFace,
      verifiedLocation,
      verifiedTime,
      subject: timeSlot.className || '',
      rollNumber: student.rollNumber || '',
      classroomName: classroom ? classroom.name : ''
    });

    await attendance.save();

    res.json({
      message: allVerified ? 'Attendance marked as PRESENT!' : 'Attendance marked as ABSENT.',
      attendance: {
        status,
        verifiedFace,
        verifiedLocation,
        verifiedTime,
        remarks: attendance.remarks
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance for multiple students in one frame (multi-face)
router.post('/mark-multi', auth, async (req, res) => {
  try {
    const { faceDescriptors, latitude, longitude, timeSlotId } = req.body;

    if (!faceDescriptors || !Array.isArray(faceDescriptors) || faceDescriptors.length === 0) {
      return res.status(400).json({ message: 'No face descriptors provided' });
    }

    const timeSlot = await TimeSlot.findById(timeSlotId).populate('classroom');
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Time verification
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = timeSlot.startTime.split(':').map(Number);
    const [endH, endM] = timeSlot.endTime.split(':').map(Number);
    const slotStart = startH * 60 + startM;
    const slotEnd = endH * 60 + endM;
    const verifiedTime = currentMinutes >= slotStart && currentMinutes <= slotEnd;

    // Location verification
    let verifiedLocation = false;
    const classroom = timeSlot.classroom;
    if (classroom) {
      const distance = getDistanceMeters(latitude, longitude, classroom.latitude, classroom.longitude);
      verifiedLocation = distance <= classroom.radiusMeters;
    }

    // Get all students with face data
    const students = await User.find({ role: 'student', faceEmbeddings: { $ne: [] } });

    const THRESHOLD = 0.6;
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const descriptor of faceDescriptors) {
      let matchedStudent = null;
      let bestDistance = Infinity;

      for (const student of students) {
        for (const embedding of student.faceEmbeddings) {
          const dist = euclideanDistance(descriptor, embedding);
          if (dist < THRESHOLD && dist < bestDistance) {
            bestDistance = dist;
            matchedStudent = student;
          }
        }
      }

      if (matchedStudent) {
        // Check existing
        const existing = await Attendance.findOne({
          student: matchedStudent._id,
          timeSlot: timeSlotId,
          date: { $gte: today, $lt: tomorrow }
        });

        if (!existing) {
          const allVerified = true && verifiedLocation && verifiedTime;
          const status = allVerified ? 'PRESENT' : 'ABSENT';
          const remarks = [];
          if (!verifiedLocation) remarks.push('Location mismatch');
          if (!verifiedTime) remarks.push('Outside time slot');

          const attendance = new Attendance({
            student: matchedStudent._id,
            timeSlot: timeSlotId,
            status,
            remarks: allVerified ? 'All verifications passed' : remarks.join(', '),
            verifiedFace: true,
            verifiedLocation,
            verifiedTime,
            subject: timeSlot.className || '',
            rollNumber: matchedStudent.rollNumber || '',
            classroomName: classroom ? classroom.name : ''
          });

          await attendance.save();
          results.push({ studentName: matchedStudent.name, status, remarks: attendance.remarks });
        } else {
          results.push({ studentName: matchedStudent.name, status: 'ALREADY_MARKED', remarks: 'Already marked today' });
        }
      }
    }

    res.json({ message: `Processed ${results.length} students`, results });
  } catch (error) {
    console.error('Mark multi error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance history for current student
router.get('/history', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user._id })
      .populate('timeSlot')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance stats for current student
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Attendance.countDocuments({ student: req.user._id });
    const present = await Attendance.countDocuments({ student: req.user._id, status: 'PRESENT' });
    const absent = total - present;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ total, present, absent, percentage });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active time slots
router.get('/timeslots', auth, async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find().populate('classroom');
    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
