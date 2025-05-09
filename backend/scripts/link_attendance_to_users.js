const mongoose = require('mongoose');
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hospital:hospital_app@cluster0.iy79buv.mongodb.net/hospital_app';

async function linkAttendance() {
    await mongoose.connect(MONGO_URI);

    const unmatchedNames = new Set();
    const attendances = await Attendance.find({ Name: { $exists: true, $type: 'string' } });

    for (const att of attendances) {
        if (!att.Name || typeof att.Name !== 'string') {
            unmatchedNames.add('(missing Name)');
            continue;
        }
        const name = att.Name.trim().replace(/\s+/g, ' ');
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        if (!firstName || !lastName) {
            unmatchedNames.add(name);
            continue;
        }
        const user = await User.findOne({
            firstName: new RegExp(`^${firstName}$`, 'i'),
            lastName: new RegExp(`^${lastName}$`, 'i')
        });
        if (!user) {
            unmatchedNames.add(name);
            continue;
        }
        att.userId = user._id;
        await att.save();
    }

    if (unmatchedNames.size > 0) {
        console.log('Unmatched names:', Array.from(unmatchedNames));
    } else {
        console.log('All attendance records linked to users!');
    }
    await mongoose.disconnect();
}

linkAttendance().catch(err => {
    console.error('Error linking attendance:', err);
    process.exit(1);
});
