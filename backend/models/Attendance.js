const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  remarks: { type: String, default: '' },
  verifiedFace: { type: Boolean, default: false },
  verifiedLocation: { type: Boolean, default: false },
  verifiedTime: { type: Boolean, default: false },
  subject: { type: String, default: '' },
  rollNumber: { type: String, default: '' },
  classroomName: { type: String, default: '' }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
