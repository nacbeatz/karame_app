const express = require("express");
const Attendance = require("../models/Attendance");
const User = require("../models/User"); // Needed for validating userId
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/attendance/clock-in - Record a clock-in
router.post("/clock-in", authenticateToken, async (req, res) => {
    const { userId, timestamp, deviceId, notes, manualEntryReason } = req.body;
    const loggedInUser = req.user;

    try {
        let targetUserId = userId;
        // If userId is not provided, assume it's for the logged-in user (e.g. mobile clock-in)
        // Or if Admin/HR are manually entering for someone else, they must provide userId.
        if (!targetUserId && (loggedInUser.role === "Admin" || loggedInUser.role === "HR")) {
            return res.status(400).json({ msg: "User ID is required for manual entry by Admin/HR." });
        }
        if (!targetUserId) {
            targetUserId = loggedInUser.id;
        }

        const userExists = await User.findById(targetUserId);
        if (!userExists) {
            return res.status(404).json({ msg: "User to clock-in not found." });
        }

        // Authorization: Admin/HR can clock-in anyone. Others can only clock-in themselves.
        if (loggedInUser.id !== targetUserId && !(loggedInUser.role === "Admin" || loggedInUser.role === "HR")) {
            return res.status(403).json({ msg: "Access denied. You can only clock-in for yourself." });
        }

        const newAttendance = new Attendance({
            userId: targetUserId,
            timestamp: timestamp || new Date(), // Use provided timestamp or now
            type: "clock-in",
            deviceId,
            notes,
            isManualEntry: (loggedInUser.role === "Admin" || loggedInUser.role === "HR") && !!userId, // Mark as manual if Admin/HR provides userId
            manualEntryReason: (loggedInUser.role === "Admin" || loggedInUser.role === "HR") && !!userId ? manualEntryReason : undefined,
        });

        await newAttendance.save();
        // TODO: Emit socket event for real-time update
        // io.emit("attendance_update", newAttendance);
        res.status(201).json(newAttendance);
    } catch (err) {
        console.error("Clock-in error:", err.message);
        res.status(500).send("Server Error");
    }
});

// POST /api/attendance/clock-out - Record a clock-out
router.post("/clock-out", authenticateToken, async (req, res) => {
    const { userId, timestamp, deviceId, notes, manualEntryReason } = req.body;
    const loggedInUser = req.user;

    try {
        let targetUserId = userId;
        if (!targetUserId && (loggedInUser.role === "Admin" || loggedInUser.role === "HR")) {
            return res.status(400).json({ msg: "User ID is required for manual entry by Admin/HR." });
        }
        if (!targetUserId) {
            targetUserId = loggedInUser.id;
        }

        const userExists = await User.findById(targetUserId);
        if (!userExists) {
            return res.status(404).json({ msg: "User to clock-out not found." });
        }

        if (loggedInUser.id !== targetUserId && !(loggedInUser.role === "Admin" || loggedInUser.role === "HR")) {
            return res.status(403).json({ msg: "Access denied. You can only clock-out for yourself." });
        }

        const newAttendance = new Attendance({
            userId: targetUserId,
            timestamp: timestamp || new Date(),
            type: "clock-out",
            deviceId,
            notes,
            isManualEntry: (loggedInUser.role === "Admin" || loggedInUser.role === "HR") && !!userId,
            manualEntryReason: (loggedInUser.role === "Admin" || loggedInUser.role === "HR") && !!userId ? manualEntryReason : undefined,
        });

        await newAttendance.save();
        // io.emit("attendance_update", newAttendance);
        res.status(201).json(newAttendance);
    } catch (err) {
        console.error("Clock-out error:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/attendance - Get attendance logs
router.get("/", authenticateToken, async (req, res) => {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const loggedInUser = req.user;

    let query = { No: loggedInUser.No }; // Use the No field to filter attendance records

    if (startDate || endDate) {
        query.Date = {};
        if (startDate) query.Date.$gte = startDate;
        if (endDate) query.Date.$lte = endDate;
    }

    try {
        const logs = await Attendance.find(query)
            .sort({ Date: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Attendance.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalLogs: total
        });
    } catch (err) {
        console.error("Error fetching attendance logs:", err.message);
        res.status(500).send("Server Error");
    }
});

// PUT /api/attendance/:logId - Manually edit an attendance log
router.put("/:logId", [authenticateToken, authorizeRole(["Admin", "HR"])], async (req, res) => {
    const { timestamp, type, notes, manualEntryReason, userId } = req.body;
    try {
        let log = await Attendance.findById(req.params.logId);
        if (!log) {
            return res.status(404).json({ msg: "Attendance log not found" });
        }

        if (timestamp) log.timestamp = timestamp;
        if (type) log.type = type;
        if (notes !== undefined) log.notes = notes;
        if (userId) log.userId = userId; // Allow changing user if correcting error

        log.isManualEntry = true;
        log.manualEntryReason = manualEntryReason || "Edited by Admin/HR";

        await log.save();
        res.json(log);
    } catch (err) {
        console.error("Error updating attendance log:", err.message);
        res.status(500).send("Server Error");
    }
});

// --- Reporting Endpoints (Examples based on API design) ---

// GET /api/attendance/summary/daily - Get daily attendance summary
router.get("/summary/daily", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader"])], async (req, res) => {
    const { date, department, teamId } = req.query; // teamId might require User model to have team field
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    let userQuery = {};
    if (req.user.role === "Manager" || req.user.role === "TeamLeader") {
        const managedUsers = await User.find({ manager: req.user.id }).select("_id");
        userQuery._id = { $in: managedUsers.map(u => u._id) };
    }
    if (department && (req.user.role === "Admin" || req.user.role === "HR")) {
        userQuery.department = department;
    }
    // Add teamId filter if User model supports it and user has access

    try {
        const users = await User.find(userQuery).select("_id firstName lastName employeeId");
        const userIds = users.map(u => u._id);

        const attendanceToday = await Attendance.find({
            userId: { $in: userIds },
            timestamp: { $gte: startOfDay, $lte: endOfDay },
            type: "clock-in" // Retrieve all clock-in records
        });

        // Process the attendance data as needed
        const presentUsers = users.filter(u => attendanceToday.some(record => record.userId.equals(u._id)));
        const absentUserIds = userIds.filter(id => !attendanceToday.some(record => record.userId.equals(id)));
        const absentUsers = users.filter(u => absentUserIds.some(id => id.equals(u._id)));

        res.json({
            date: startOfDay.toISOString().split("T")[0],
            presentCount: presentUsers.length,
            absentCount: absentUsers.length,
            presentUsers: presentUsers.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}`, employeeId: u.employeeId })),
            absentUsers: absentUsers.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}`, employeeId: u.employeeId })),
            attendanceRecords: attendanceToday // Include all attendance records in the response
        });

    } catch (err) {
        console.error("Daily summary error:", err.message);
        res.status(500).send("Server Error");
    }
});

// More reporting endpoints (monthly-hours, supplementary-hours, absenteeism) would follow a similar pattern of aggregation.

module.exports = router;

