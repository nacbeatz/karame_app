const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveType",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "ApprovedByHR", "ApprovedByManager", "Approved", "RejectedByHR", "RejectedByManager", "Rejected", "CancelledByAdmin", "CancelledByEmployee"],
    default: "Pending",
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  cancellationReason: {
    type: String,
    trim: true,
  },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: String,
    timestamp: { type: Date, default: Date.now },
  }],
  numberOfDays: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

module.exports = LeaveRequest;

