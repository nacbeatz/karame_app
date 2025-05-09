// import_attendance.js
// Usage: node import_attendance.js
// Make sure to install dependencies: npm install mongoose
// Place this script in backend/scripts/ and run from backend directory

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const connectDB = require("../config/db");

// Update this to your Atlas connection string or use process.env.MONGO_URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hospital:hospital_app@cluster0.iy79buv.mongodb.net/hospital_app';

// Path to your original JSON file
const DATA_PATH = path.join(__dirname, '../models/February_2025_Attendance.json');

function parseTimestamp(dateStr, timeStr) {
    if (!dateStr || !timeStr || timeStr === 'null' || timeStr === 'nan') return null;
    // Combine date and time, assume local time, convert to ISO
    return new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`);
}

async function importData() {
    await mongoose.connect(MONGO_URI);
    // Drop all existing attendance records before import
    await Attendance.deleteMany({});
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const records = JSON.parse(raw);
    const docs = [];
    const unmatchedNames = new Set();

    for (const rec of records) {
        // Robustly split and trim name
        const name = rec.Name.trim().replace(/\s+/g, ' ');
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        // Find user (case-insensitive, trimmed)
        const user = await User.findOne({
            firstName: new RegExp(`^${firstName.trim()}$`, 'i'),
            lastName: new RegExp(`^${lastName.trim()}$`, 'i')
        });
        if (!user) {
            unmatchedNames.add(name);
            continue;
        }
        // Clock-in
        const clockInTime = parseTimestamp(rec.Date, rec.AM_In);
        if (clockInTime) {
            docs.push({
                userId: user._id,
                timestamp: clockInTime,
                type: 'clock-in',
            });
        }
        // Clock-out
        const clockOutTime = parseTimestamp(rec.Date, rec.AM_Out);
        if (clockOutTime) {
            docs.push({
                userId: user._id,
                timestamp: clockOutTime,
                type: 'clock-out',
            });
        }
    }

    if (docs.length === 0) {
        console.log('No valid attendance records to import.');
        if (unmatchedNames.size > 0) {
            console.log('Unmatched names:', Array.from(unmatchedNames));
        }
        process.exit(0);
    }

    // Insert new attendance data
    const result = await Attendance.insertMany(docs);
    console.log(`Imported ${result.length} attendance records.`);
    if (unmatchedNames.size > 0) {
        console.log('Unmatched names:', Array.from(unmatchedNames));
    }
    await mongoose.disconnect();
}

// Only run importData
importData().catch(err => {
    console.error('Error importing attendance:', err);
    process.exit(1);
}); 