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

        // Get the current date in YYYY-MM-DD format
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        // Get the current time in HH:MM format
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        // Create a new attendance record in the format matching your existing data
        const newAttendance = new Attendance({
            No: userExists.employeeId || String(Math.floor(Math.random() * 1000)), // Use employeeId or generate a random number
            Name: `${userExists.firstName} ${userExists.lastName}`,
            Date: dateStr,
            AM_In: timeStr,
            AM_Out: "null", // Will be updated on clock-out
            Remark: notes || null,
            userId: targetUserId, // Link to the user
        });

        await newAttendance.save();
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

        // Get the current date in YYYY-MM-DD format
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        // Get the current time in HH:MM format
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        // Find the most recent clock-in record for this user on this date
        const existingRecord = await Attendance.findOne({
            userId: targetUserId,
            Date: dateStr,
            AM_In: { $ne: "null" } // Has clocked in
        }).sort({ _id: -1 }); // Most recent first

        if (existingRecord) {
            // Update the existing record with clock-out time
            existingRecord.AM_Out = timeStr;
            if (notes) {
                existingRecord.Remark = notes;
            }
            await existingRecord.save();
            res.status(200).json(existingRecord);
        } else {
            // No clock-in record found, create a new record with only clock-out
            const newAttendance = new Attendance({
                No: userExists.employeeId || String(Math.floor(Math.random() * 1000)),
                Name: `${userExists.firstName} ${userExists.lastName}`,
                Date: dateStr,
                AM_In: "null", // No clock-in
                AM_Out: timeStr,
                Remark: notes || "Missing clock-in",
                userId: targetUserId,
            });
            await newAttendance.save();
            res.status(201).json(newAttendance);
        }
    } catch (err) {
        console.error("Clock-out error:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/attendance/all - Get all attendance logs (admin only)
router.get("/all", authenticateToken, async (req, res) => {
    console.log("req.user:", req.user); // Keep the debugging log

    // Restore the role-based access control condition
    if (req.user.role !== "Admin" && req.user.role !== "HR") {
        return res.status(403).json({ msg: "Access denied. Only Admin and HR can view all attendance records." });
    }

    try {
        // Fetch all attendance records
        const attendanceRecords = await Attendance.find({}).sort({ timestamp: -1 });
        res.json(attendanceRecords);
    } catch (err) {
        console.error("Error fetching attendance:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});


// GET /api/attendance - Get attendance logs for the current user
router.get("/", authenticateToken, async (req, res) => {
    const loggedInUser = req.user;
    const { startDate, endDate } = req.query;

    try {
        // Create a query that works with both userId and Name
        let query = {};

        // If we have a userId in the record, use that
        if (loggedInUser.id) {
            query.$or = [
                { userId: loggedInUser.id },
                // Also match by name for legacy records
                { Name: { $regex: new RegExp(`${loggedInUser.firstName}.*${loggedInUser.lastName}`, 'i') } }
            ];
        } else {
            // Fallback to just name matching
            query.Name = { $regex: new RegExp(`${loggedInUser.firstName}.*${loggedInUser.lastName}`, 'i') };
        }

        // Add date filtering if provided
        if (startDate || endDate) {
            query.Date = {};
            if (startDate) query.Date.$gte = startDate;
            if (endDate) query.Date.$lte = endDate;
        }

        // Execute the query
        const logs = await Attendance.find(query)
            .sort({ Date: -1 });

        res.json({
            logs,
            totalPages: 1,
            currentPage: 1,
            totalLogs: logs.length
        });
    } catch (err) {
        console.error("Error fetching attendance logs:", err.message);
        res.status(500).send("Server Error");
    }
});

// PUT /api/attendance/:logId - Manually edit an attendance log
router.put("/:logId", [authenticateToken, authorizeRole(["Admin", "HR"])], async (req, res) => {
    const { AM_In, AM_Out, Date, Remark, userId, Name } = req.body;
    try {
        let log = await Attendance.findById(req.params.logId);
        if (!log) {
            return res.status(404).json({ msg: "Attendance log not found" });
        }

        // Update fields if provided
        if (AM_In !== undefined) log.AM_In = AM_In;
        if (AM_Out !== undefined) log.AM_Out = AM_Out;
        if (Date !== undefined) log.Date = Date;
        if (Remark !== undefined) log.Remark = Remark;
        if (userId !== undefined) log.userId = userId;
        if (Name !== undefined) log.Name = Name;

        await log.save();
        res.json(log);
    } catch (err) {
        console.error("Error updating attendance log:", err.message);
        res.status(500).send("Server Error");
    }
});

// DELETE /api/attendance/:logId - Delete an attendance log
router.delete("/:logId", [authenticateToken, authorizeRole(["Admin", "HR"])], async (req, res) => {
    try {
        const log = await Attendance.findById(req.params.logId);
        if (!log) {
            return res.status(404).json({ msg: "Attendance log not found" });
        }

        await log.remove();
        res.json({ msg: "Attendance log deleted" });
    } catch (err) {
        console.error("Error deleting attendance log:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/attendance/summary/daily - Get daily attendance summary
router.get("/summary/daily", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader"])], async (req, res) => {
    const { date, department } = req.query;
    const targetDate = date ? date : new Date().toISOString().split('T')[0];

    let userQuery = {};
    if (req.user.role === "Manager" || req.user.role === "TeamLeader") {
        const managedUsers = await User.find({ manager: req.user.id }).select("_id");
        userQuery._id = { $in: managedUsers.map(u => u._id) };
    }
    if (department && (req.user.role === "Admin" || req.user.role === "HR")) {
        userQuery.department = department;
    }

    try {
        const users = await User.find(userQuery).select("_id firstName lastName employeeId");
        const userIds = users.map(u => u._id);
        const userNames = users.map(u => new RegExp(`${u.firstName}.*${u.lastName}`, 'i'));

        // Find attendance records for the target date
        const attendanceRecords = await Attendance.find({
            $or: [
                { userId: { $in: userIds } },
                { Name: { $in: userNames } }
            ],
            Date: targetDate
        });

        // Process the records to determine who is present/absent
        const presentUserIds = new Set();
        const presentUserNames = new Set();

        attendanceRecords.forEach(record => {
            if (record.AM_In && record.AM_In !== "null") {
                if (record.userId) {
                    presentUserIds.add(record.userId.toString());
                } else {
                    presentUserNames.add(record.Name.toLowerCase());
                }
            }
        });

        const presentUsers = users.filter(u =>
            presentUserIds.has(u._id.toString()) ||
            presentUserNames.has(`${u.firstName} ${u.lastName}`.toLowerCase())
        );

        const absentUsers = users.filter(u =>
            !presentUserIds.has(u._id.toString()) &&
            !presentUserNames.has(`${u.firstName} ${u.lastName}`.toLowerCase())
        );

        res.json({
            date: targetDate,
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

module.exports = router;
