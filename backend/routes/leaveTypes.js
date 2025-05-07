const express = require("express");
const LeaveType = require("../models/LeaveType");
// Add middleware for authentication/authorization later (e.g., check if user is HR/Admin)

const router = express.Router();

// @route   GET /api/leave-types
// @desc    Get all leave types
// @access  Private (HR/Admin)
router.get("/", async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    res.json(leaveTypes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/leave-types
// @desc    Create a new leave type
// @access  Private (HR/Admin)
router.post("/", async (req, res) => {
  const { name, description } = req.body;

  // Basic validation
  if (!name) {
    return res.status(400).json({ msg: "Leave type name is required" });
  }

  try {
    let leaveType = await LeaveType.findOne({ name });
    if (leaveType) {
      return res.status(400).json({ msg: "Leave type already exists" });
    }

    leaveType = new LeaveType({
      name,
      description,
    });

    await leaveType.save();
    res.json(leaveType);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/leave-types/:id
// @desc    Update a leave type
// @access  Private (HR/Admin)
router.put("/:id", async (req, res) => {
  const { name, description } = req.body;

  // Build leave type object
  const leaveTypeFields = {};
  if (name) leaveTypeFields.name = name;
  if (description !== undefined) leaveTypeFields.description = description; // Allow clearing description

  try {
    let leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) return res.status(404).json({ msg: "Leave type not found" });

    // Check if new name conflicts with an existing one (excluding the current one)
    if (name && name !== leaveType.name) {
        const existing = await LeaveType.findOne({ name: name });
        if (existing) {
            return res.status(400).json({ msg: "Another leave type with this name already exists" });
        }
    }

    leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { $set: leaveTypeFields },
      { new: true } // Return the updated document
    );

    res.json(leaveType);
  } catch (err) {
    console.error(err.message);
    // Handle potential CastError if ID format is invalid
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Leave type not found' });
    }
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/leave-types/:id
// @desc    Delete a leave type
// @access  Private (HR/Admin)
router.delete("/:id", async (req, res) => {
  try {
    let leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) return res.status(404).json({ msg: "Leave type not found" });

    // Add checks here if needed: e.g., prevent deletion if leave type is in use

    await LeaveType.findByIdAndDelete(req.params.id);

    res.json({ msg: "Leave type removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Leave type not found' });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;

