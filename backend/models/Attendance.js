const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["clock-in", "clock-out"]
    }
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema, "attendance");
module.exports = Attendance;

