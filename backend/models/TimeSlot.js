const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  className: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  section: { type: String, default: '' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
