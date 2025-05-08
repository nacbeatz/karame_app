// import_attendance.js
// Usage: node import_attendance.js
// Make sure to install dependencies: npm install mongoose
// Place this script in backend/scripts/ and run from backend directory

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Update this to your Atlas connection string or use process.env.MONGO_URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hospital:hospital_app@cluster0.iy79buv.mongodb.net/hospital_app';

// Path to your original JSON file
const DATA_PATH = path.join(__dirname, '../models/February_2025_Attendance.json');

// Attendance schema fields
const attendanceSchema = new mongoose.Schema({
    userId: String,
    timestamp: Date,
    type: String,
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance');

function parseTimestamp(dateStr, timeStr) {
    if (!dateStr || !timeStr || timeStr === 'null') return null;
    // Combine date and time, assume local time, convert to ISO
    return new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`);
}

async function importData() {
    await mongoose.connect(MONGO_URI);
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const records = JSON.parse(raw);
    const docs = [];

    for (const rec of records) {
        // Clock-in
        const clockInTime = parseTimestamp(rec.Date, rec.AM_In);
        if (clockInTime) {
            docs.push({
                userId: rec.Name,
                timestamp: clockInTime,
                type: 'clock-in',
            });
        }
        // Clock-out
        const clockOutTime = parseTimestamp(rec.Date, rec.AM_Out);
        if (clockOutTime) {
            docs.push({
                userId: rec.Name,
                timestamp: clockOutTime,
                type: 'clock-out',
            });
        }
    }

    if (docs.length === 0) {
        console.log('No valid attendance records to import.');
        process.exit(0);
    }

    // Optional: Clear existing attendance data first
    await Attendance.deleteMany({});

    const result = await Attendance.insertMany(docs);
    console.log(`Imported ${result.length} attendance records.`);
    await mongoose.disconnect();
}

importData().catch(err => {
    console.error('Error importing attendance:', err);
    process.exit(1);
}); 