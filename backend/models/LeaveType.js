const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Add other relevant fields if needed, e.g., default entitlement days
}, { timestamps: true });

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

module.exports = LeaveType;

