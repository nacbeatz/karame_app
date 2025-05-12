const express = require("express");
const ShiftType = require("../models/ShiftType"); // Updated to ShiftType
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/shifttypes - Create a new shift type
router.post("/", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    // Removed durationHours from destructuring as it's calculated or less critical for a "type"
    const { name, startTime, endTime, department, notes, colorCode, isActive } = req.body;

    if (!name || !startTime || !endTime) {
        return res.status(400).json({ msg: "Name, startTime, and endTime are required for a shift type." });
    }

    try {
        let shiftType = await ShiftType.findOne({ name });
        if (shiftType) {
            return res.status(400).json({ msg: "Shift type with this name already exists." });
        }

        shiftType = new ShiftType({
            name,
            startTime,
            endTime,
            department,
            // requiredSkills, // This was in old Shift, not in new ShiftType by default, add if needed
            notes,
            colorCode,
            isActive
        });

        await shiftType.save();
        res.status(201).json(shiftType);
    } catch (err) {
        console.error("Create shift type error:", err.message);
        if (err.name === "ValidationError") {
            return res.status(400).json({ msg: "Validation Error", errors: err.errors });
        }
        res.status(500).send("Server Error");
    }
});

// GET /api/shifttypes - Get all active shift types
// router.get("/all", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader", "Employee"])], async (req, res) => {
//     try {
//         const shiftTypes = await ShiftType.find({ isActive: true }).sort({ name: 1 });
//         res.json(shiftTypes);
//     } catch (err) {
//         console.error("Get shift types error:", err.message);
//         res.status(500).send("Server Error");
//     }
// });
router.get("/all", async (req, res) => {
  try {
    const shifts = await ShiftType.find().sort({ name: 1 });
    res.json(shifts);
  } catch (err) {
    console.error("Get all shifts error:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/shifttypes/all - Get all shift types (including inactive)
router.get("/all", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    try {
        const shiftTypes = await ShiftType.find().sort({ name: 1 });
        res.json(shiftTypes);
    } catch (err) {
        console.error("Get all shift types error:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/shifttypes/:shiftTypeId - Get a specific shift type
router.get("/:shiftTypeId", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader", "Employee"])], async (req, res) => {
    try {
        const shiftType = await ShiftType.findById(req.params.shiftTypeId);
        if (!shiftType) {
            return res.status(404).json({ msg: "Shift type not found." });
        }
        // Allow access to inactive if user has higher roles
        if (!shiftType.isActive && !["Admin", "HR", "Manager"].includes(req.user.role)) {
             return res.status(404).json({ msg: "Shift type not found or not active." });
        }
        res.json(shiftType);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Shift type not found." });
        }
        res.status(500).send("Server Error");
    }
});

// PUT /api/shifttypes/:shiftTypeId - Update a shift type
router.put("/:shiftTypeId", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    const { name, startTime, endTime, department, notes, colorCode, isActive } = req.body;
    const shiftTypeFields = {};
    if (name !== undefined) shiftTypeFields.name = name;
    if (startTime !== undefined) shiftTypeFields.startTime = startTime;
    if (endTime !== undefined) shiftTypeFields.endTime = endTime;
    if (department !== undefined) shiftTypeFields.department = department;
    // if (requiredSkills !== undefined) shiftTypeFields.requiredSkills = requiredSkills; // Add if needed
    if (notes !== undefined) shiftTypeFields.notes = notes;
    if (colorCode !== undefined) shiftTypeFields.colorCode = colorCode;
    if (isActive !== undefined) shiftTypeFields.isActive = isActive;

    try {
        let shiftType = await ShiftType.findById(req.params.shiftTypeId);
        if (!shiftType) {
            return res.status(404).json({ msg: "Shift type not found." });
        }

        if (name && name !== shiftType.name) {
            const existing = await ShiftType.findOne({ name: name });
            if (existing && existing._id.toString() !== req.params.shiftTypeId) {
                return res.status(400).json({ msg: "Another shift type with this name already exists." });
            }
        }

        shiftType = await ShiftType.findByIdAndUpdate(
            req.params.shiftTypeId,
            { $set: shiftTypeFields },
            { new: true, runValidators: true }
        );
        res.json(shiftType);
    } catch (err) {
        console.error("Update shift type error:", err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Shift type not found." });
        }
        if (err.name === "ValidationError") {
            return res.status(400).json({ msg: "Validation Error", errors: err.errors });
        }
        res.status(500).send("Server Error");
    }
});

// DELETE /api/shifttypes/:shiftTypeId - Delete a shift type (soft delete by setting isActive to false)
router.delete("/:shiftTypeId", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    try {
        const shiftType = await ShiftType.findById(req.params.shiftTypeId);
        if (!shiftType) {
            return res.status(404).json({ msg: "Shift type not found." });
        }

        // Check if the shift type is in use by active schedules before allowing hard delete or deactivation
        // For now, implementing soft delete by setting isActive to false
        // const activeSchedules = await Schedule.countDocuments({ shiftTypeId: req.params.shiftTypeId, isActive: true });
        // if (activeSchedules > 0) {
        //     return res.status(400).json({ msg: "Cannot delete shift type. It is currently assigned to active schedules. Consider deactivating it instead." });
        // }
        // await ShiftType.findByIdAndDelete(req.params.shiftTypeId); // Hard delete
 
        shiftType.isActive = false;
        await shiftType.save();
        res.json({ msg: "Shift type deactivated successfully." });

    } catch (err) {
        console.error("Deactivate shift type error:", err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Shift type not found." });
        }
        res.status(500).send("Server Error");
    }
});

module.exports = router;

