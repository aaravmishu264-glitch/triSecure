require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const enrollmentRoutes = require('./routes/enrollment');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enrollment', enrollmentRoutes);

async function seedData() {
  const Classroom = require('./models/Classroom');
  const TimeSlot = require('./models/TimeSlot');

  const existingRooms = await Classroom.countDocuments();
  if (existingRooms > 0) return; // Already seeded

  console.log('Seeding default classrooms and time slots...');

  // Create default classroom (using a generic campus location)
  const room101 = await Classroom.create({
    name: 'Room 101 — Main Building',
    latitude: 30.877164,
    longitude: 76.871861,
    radiusMeters: 100
  });

  const labA3 = await Classroom.create({
    name: 'Lab A3 — Computer Block',
    latitude: 30.877300,
    longitude: 76.872100,
    radiusMeters: 80
  });

  // Create realistic time slots
  const slots = [
    { className: 'Mathematics', startTime: '09:30', endTime: '10:20', classroom: room101._id },
    { className: 'Data Structures', startTime: '10:20', endTime: '11:10', classroom: room101._id },
    { className: 'Computer Networks', startTime: '11:10', endTime: '12:00', classroom: labA3._id },
    { className: 'Operating Systems', startTime: '12:00', endTime: '12:50', classroom: room101._id },
    { className: 'DBMS Lab', startTime: '14:00', endTime: '15:30', classroom: labA3._id },
    { className: 'Web Development', startTime: '15:00', endTime: '16:00', classroom: room101._id },
  ];

  for (const slot of slots) {
    await TimeSlot.create(slot);
  }

  console.log('✓ Seeded 2 classrooms and 6 time slots');
}

async function startServer() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trisecure';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB (local/atlas)');
  } catch (err) {
    console.log('Local MongoDB not available, starting in-memory server...');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Memory Server at', mongoUri);
  }

  // Auto-seed on first start
  await seedData();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
