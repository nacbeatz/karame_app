const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String, // HH:MM format
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"],
  },
  endTime: {
    type: String, // HH:MM format
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"],
  },
  durationHours: {
    type: Number,
    required: true,
  },
  department: {
    type: String,
    trim: true,
  },
  requiredSkills: [{
    type: String,
    trim: true,
  }],
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;

