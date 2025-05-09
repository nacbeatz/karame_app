// backend/scripts/fix_attendance_user_ids.js

const mongoose = require('mongoose');
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const connectDB = require("../config/db");

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hospital:hospital_app@cluster0.iy79buv.mongodb.net/hospital_app';

async function fixUserIds() {
    await mongoose.connect(MONGO_URI);

    // Find all users
    const users = await User.find();

    let totalUpdated = 0;

    for (const user of users) {
        // Build possible name variants
        const fullName = `${user.firstName} ${user.lastName}`;
        const fullNameUpper = `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`;
        const fullNameLower = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`;

        // Update all attendance records with matching userId string
        const result = await Attendance.updateMany(
            { userId: { $in: [fullName, fullNameUpper, fullNameLower] } },
            { $set: { userId: user._id } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated ${result.modifiedCount} records for ${fullName}`);
            totalUpdated += result.modifiedCount;
        }
    }

    console.log(`Done! Total updated: ${totalUpdated}`);
    process.exit(0);
}

fixUserIds();