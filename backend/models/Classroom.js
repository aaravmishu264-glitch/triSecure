const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Classroom', classroomSchema);
