const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    // Fields for existing data
    No: {
        type: String,
    },
    Name: {
        type: String,
        required: true,
    },
    Date: {
        type: String,
        required: true,
    },
    AM_In: {
        type: String,
    },
    AM_Out: {
        type: String,
    },
    Remark: {
        type: String,
    },
    
    // Field for user relationship
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Not required for existing data
    }
}, { timestamps: true });

// Add an index for faster queries
attendanceSchema.index({ Name: 1 });
attendanceSchema.index({ userId: 1 });
attendanceSchema.index({ Date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema, "attendance");
module.exports = Attendance;
