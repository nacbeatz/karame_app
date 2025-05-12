const mongoose = require("mongoose");

// Renamed from Shift to ShiftType to better represent a template/definition of a shift
const shiftTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Assuming shift names (types) should be unique
  },
  startTime: {
    type: String, // HH:MM format (e.g., "09:00")
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"],
  },
  endTime: {
    type: String, // HH:MM format (e.g., "17:00")
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"],
  },
  // durationHours can be calculated from startTime and endTime, or stored if preferred
  // For simplicity, we can calculate it on the fly or when the shift type is created/updated.
  // If endTime < startTime, it implies an overnight shift.
  department: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  colorCode: {
    type: String, // For UI display, e.g., "#FF5733"
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const ShiftType = mongoose.model("ShiftType", shiftTypeSchema);

module.exports = ShiftType;

