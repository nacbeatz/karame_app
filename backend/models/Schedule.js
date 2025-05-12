const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shiftTypeId: { // Changed from shiftId to reference ShiftType
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShiftType", // References the new ShiftType model
    required: true,
  },
  assignmentType: {
    type: String,
    required: true,
    enum: ["single", "daily", "weekly", "monthly", "permanent"],
    default: "single",
  },
  startDate: {
    type: Date, // The date the assignment begins (YYYY-MM-DD, time part usually ignored or set to 00:00:00)
    required: true,
  },
  endDate: {
    type: Date, // Optional: The date the assignment ends (inclusive)
  },
  // For weekly recurring shifts
  daysOfWeek: [{
    type: Number, // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    min: 0,
    max: 6,
  }],
  // For monthly recurring shifts
  dayOfMonth: {
    type: Number, // 1-31
    min: 1,
    max: 31,
  },
  // To store specific dates when this recurring shift should NOT occur
  exceptions: [{
    type: Date, // Dates on which this scheduled shift is an exception
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: { // To easily deactivate a schedule entry instead of deleting
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// Indexes for efficient querying
scheduleSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
scheduleSchema.index({ shiftTypeId: 1 });

// Compound index to ensure an employee isn't assigned the same shift type on the same start date for single assignments
// For recurring, uniqueness logic will be more complex and handled at the application layer during creation/update
scheduleSchema.index({ employeeId: 1, shiftTypeId: 1, startDate: 1, assignmentType: 1 }, { unique: true, partialFilterExpression: { assignmentType: "single" } });

const Schedule = mongoose.model("Schedule", scheduleSchema);

module.exports = Schedule;

