const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  rollNumber: { type: String, sparse: true },
  department: { type: String, default: '' },
  section: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  faceEmbeddings: { type: [[Number]], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
