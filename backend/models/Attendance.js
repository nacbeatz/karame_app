const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        // Consider adding a ref to an Employee model later
        // ref: 'Employee'
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    type: {
        type: String,
        required: true,
        enum: ["clock-in", "clock-out"] // Define possible types
    },
    // Add other relevant fields if needed, e.g., deviceId
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;

