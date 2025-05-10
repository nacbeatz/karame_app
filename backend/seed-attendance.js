const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('../backend/models/Attendance');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

// Sample attendance data
const attendanceData = [
    // Anac Anaclet (Employee)
    {
        No: "1",
        Name: "Anac Anaclet",
        Date: "2025-05-08",
        AM_In: "08:30",
        AM_Out: "17:45",
        Remark: null,
        userId: "681ca765e9b7cc37593cbbcc"
    },
    {
        No: "1",
        Name: "Anac Anaclet",
        Date: "2025-05-07",
        AM_In: "08:15",
        AM_Out: "17:30",
        Remark: null,
        userId: "681ca765e9b7cc37593cbbcc"
    },
    {
        No: "1",
        Name: "Anac Anaclet",
        Date: "2025-05-06",
        AM_In: "09:05",
        AM_Out: "18:00",
        Remark: "Late arrival",
        userId: "681ca765e9b7cc37593cbbcc"
    },

    // Aman Delphin (Admin)
    {
        No: "2",
        Name: "Aman Delphin",
        Date: "2025-05-08",
        AM_In: "08:00",
        AM_Out: "18:30",
        Remark: null,
        userId: "681ca823e9b7cc37593cbbe0"
    },
    {
        No: "2",
        Name: "Aman Delphin",
        Date: "2025-05-07",
        AM_In: "08:05",
        AM_Out: "18:15",
        Remark: null,
        userId: "681ca823e9b7cc37593cbbe0"
    },

    // Niyo Nathanael (HR)
    {
        No: "3",
        Name: "Niyo Nathanael",
        Date: "2025-05-08",
        AM_In: "08:10",
        AM_Out: "17:30",
        Remark: null,
        userId: "681ca83fe9b7cc37593cbbe5"
    },
    {
        No: "3",
        Name: "Niyo Nathanael",
        Date: "2025-05-07",
        AM_In: "08:20",
        AM_Out: "17:45",
        Remark: null,
        userId: "681ca83fe9b7cc37593cbbe5"
    },
    {
        No: "3",
        Name: "Niyo Nathanael",
        Date: "2025-05-06",
        AM_In: null,
        AM_Out: null,
        Remark: "Absent",
        userId: "681ca83fe9b7cc37593cbbe5"
    },

    // crox dev (TeamLeader)
    {
        No: "4",
        Name: "crox dev",
        Date: "2025-05-08",
        AM_In: "07:55",
        AM_Out: "17:30",
        Remark: null,
        userId: "681ca8b1e9b7cc37593cbbf0"
    },
    {
        No: "4",
        Name: "crox dev",
        Date: "2025-05-07",
        AM_In: "08:00",
        AM_Out: "17:45",
        Remark: null,
        userId: "681ca8b1e9b7cc37593cbbf0"
    },

    // UWAYEZU Dane (Employee)
    {
        No: "5",
        Name: "UWAYEZU Dane",
        Date: "2025-05-08",
        AM_In: "08:45",
        AM_Out: "17:30",
        Remark: null,
        userId: "681d086b8357cac0ec000fa2"
    },
    {
        No: "5",
        Name: "UWAYEZU Dane",
        Date: "2025-05-07",
        AM_In: "08:30",
        AM_Out: "17:15",
        Remark: null,
        userId: "681d086b8357cac0ec000fa2"
    },
    {
        No: "5",
        Name: "UWAYEZU Dane",
        Date: "2025-05-06",
        AM_In: "09:15",
        AM_Out: "17:30",
        Remark: "Late arrival",
        userId: "681d086b8357cac0ec000fa2"
    }
];

// Insert data
const seedDatabase = async () => {
    try {
        // Clear existing data (optional)
        await Attendance.deleteMany({});
        console.log('Cleared existing attendance records');

        // Insert new data
        const result = await Attendance.insertMany(attendanceData);
        console.log(`${result.length} attendance records inserted successfully`);

        // Disconnect from MongoDB
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.disconnect();
    }
};

// Run the seeding function
seedDatabase();
