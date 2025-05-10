const express = require("express");
const LeaveRequest = require("../models/LeaveRequest");
const LeaveType = require("../models/LeaveType");
const User = require("../models/User");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({}, { strict: false });
const Notification = mongoose.model("Notification", notificationSchema);

const router = express.Router();

// POST /api/leave-requests - Submit a new leave request
router.post("/", authenticateToken, async (req, res) => {
    const { leaveTypeId, startDate, endDate, reason, numberOfDays } = req.body;
    const employeeId = req.user.id;

    if (!leaveTypeId || !startDate || !endDate || !numberOfDays) {
        return res.status(400).json({ msg: "Please provide all required fields for leave request." });
    }

    try {
        console.log('leaveTypeId received:', leaveTypeId);
        const leaveType = await LeaveType.findById(leaveTypeId);
        console.log('leaveType found:', leaveType);
        if (!leaveType) {
            return res.status(400).json({ msg: "Invalid leave type selected." });
        }

        // TODO: Add logic to check if employee has sufficient balance for this leaveType
        // TODO: Add logic to calculate numberOfDays more accurately (e.g., excluding weekends/holidays if applicable)

        const newLeaveRequest = new LeaveRequest({
            employeeId,
            leaveTypeId,
            startDate,
            endDate,
            reason,
            numberOfDays,
            status: "Pending" // Initial status
        });

        await newLeaveRequest.save();

        // Notify relevant Manager/HR (placeholder logic)
        const employee = await User.findById(employeeId).populate("manager");
        if (employee && employee.manager) {
            const notificationForManager = new Notification({
                recipientId: employee.manager._id,
                senderId: employeeId,
                message: `New leave request submitted by ${employee.firstName} ${employee.lastName} for ${leaveType.name}.`,
                type: "LeaveRequest",
                link: `/leave-approvals/${newLeaveRequest._id}`
            });
            await notificationForManager.save();
            // TODO: Emit socket event to manager (io.to(employee.manager._id.toString()).emit(...))
        }
        // Potentially notify HR as well (e.g., find all HR users)

        res.status(201).json(newLeaveRequest);
    } catch (err) {
        console.error("Leave request submission error:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/leave-requests - Get leave requests
router.get("/", authenticateToken, async (req, res) => {
    const { employeeId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const loggedInUser = req.user;
    let query = {};

    if (loggedInUser.role === "Employee") {
        query.employeeId = loggedInUser.id;
    } else if (loggedInUser.role === "TeamLeader" || loggedInUser.role === "Manager") {
        const managedUsers = await User.find({ manager: loggedInUser.id }).select("_id");
        const managedUserIds = managedUsers.map(u => u._id);
        if (employeeId) {
            if (!managedUserIds.some(id => id.equals(employeeId)) && employeeId !== loggedInUser.id) {
                return res.status(403).json({ msg: "Access denied to view this employee\\\'s leave requests." });
            }
            query.employeeId = employeeId;
        } else {
            query.employeeId = { $in: [...managedUserIds, loggedInUser.id] };
        }
    } else if (loggedInUser.role === "Admin" || loggedInUser.role === "HR") {
        if (employeeId) {
            query.employeeId = employeeId;
        }
    } else {
        return res.status(403).json({ msg: "Access denied." });
    }

    if (status) query.status = status;
    if (startDate || endDate) {
        query.startDate = {}; // Assuming filtering by start date of leave
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    try {
        const requests = await LeaveRequest.find(query)
            .populate("employeeId", "firstName lastName employeeId username")
            .populate("leaveTypeId", "name")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await LeaveRequest.countDocuments(query);

        res.json({
            requests,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalRequests: total
        });
    } catch (err) {
        console.error("Error fetching leave requests:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/leave-requests/:requestId - Get details of a specific leave request
router.get("/:requestId", authenticateToken, async (req, res) => {
    try {
        const request = await LeaveRequest.findById(req.params.requestId)
            .populate("employeeId", "firstName lastName employeeId username department manager")
            .populate("leaveTypeId", "name description")
            .populate("approvedBy", "firstName lastName username")
            .populate("rejectedBy", "firstName lastName username")
            .populate("cancelledBy", "firstName lastName username")
            .populate("comments.userId", "firstName lastName username");

        if (!request) {
            return res.status(404).json({ msg: "Leave request not found" });
        }

        const loggedInUser = req.user;
        const isOwner = request.employeeId._id.equals(loggedInUser.id);
        const isManagerOfOwner = loggedInUser.role === "Manager" && request.employeeId.manager && request.employeeId.manager.equals(loggedInUser.id);
        const isTeamLeaderOfOwner = loggedInUser.role === "TeamLeader" && request.employeeId.manager && request.employeeId.manager.equals(loggedInUser.id);

        if (loggedInUser.role === "Admin" || loggedInUser.role === "HR" || isOwner || isManagerOfOwner || isTeamLeaderOfOwner) {
            return res.json(request);
        }
        return res.status(403).json({ msg: "Access denied to view this leave request." });

    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Leave request not found" });
        }
        res.status(500).send("Server Error");
    }
});

// PUT /api/leave-requests/:requestId/approve - Approve a leave request
router.put("/:requestId/approve", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    const { comment } = req.body;
    const approver = req.user;

    try {
        let leaveRequest = await LeaveRequest.findById(req.params.requestId).populate("employeeId", "firstName lastName manager");
        if (!leaveRequest) {
            return res.status(404).json({ msg: "Leave request not found." });
        }

        // Admin can approve regardless of current status (override)
        // HR can approve if Pending (or if multi-step, if ApprovedByManager)
        // Manager can approve if Pending and it's their team member
        if (approver.role === "Admin") {
            // Admin override
        } else if (approver.role === "HR") {
            if (leaveRequest.status !== "Pending" && leaveRequest.status !== "ApprovedByManager") { // Adjust if multi-step approval exists
                return res.status(400).json({ msg: `HR cannot approve request in ${leaveRequest.status} state.` });
            }
        } else if (approver.role === "Manager") {
            if (leaveRequest.status !== "Pending") {
                return res.status(400).json({ msg: `Manager cannot approve request in ${leaveRequest.status} state.` });
            }
            if (!leaveRequest.employeeId.manager || !leaveRequest.employeeId.manager.equals(approver.id)) {
                return res.status(403).json({ msg: "Manager can only approve requests for their team members." });
            }
        }

        leaveRequest.status = "Approved";
        leaveRequest.approvedBy = approver.id;
        leaveRequest.rejectedBy = undefined;
        leaveRequest.rejectionReason = undefined;
        leaveRequest.cancelledBy = undefined;
        leaveRequest.cancellationReason = undefined;
        if (comment) {
            leaveRequest.comments.push({ userId: approver.id, comment: `Approved by ${approver.role}: ${comment || ""}`.trim() });
        }
        await leaveRequest.save();

        const notificationForEmployee = new Notification({
            recipientId: leaveRequest.employeeId._id,
            senderId: approver.id,
            message: `Your leave request for ${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()} has been approved by ${approver.username}.`,
            type: "LeaveRequest",
            link: `/my-leave/${leaveRequest._id}`
        });
        await notificationForEmployee.save();
        // TODO: Emit socket event

        res.json(leaveRequest);
    } catch (err) {
        console.error("Leave approval error:", err.message);
        res.status(500).send("Server Error");
    }
});

// PUT /api/leave-requests/:requestId/reject - Reject a leave request
router.put("/:requestId/reject", [authenticateToken, authorizeRole(["Admin", "HR", "Manager"])], async (req, res) => {
    const { rejectionReason, comment } = req.body;
    const rejector = req.user;

    if (!rejectionReason && rejector.role !== "Admin") { // Admin might override without explicit new reason if changing mind
        return res.status(400).json({ msg: "Rejection reason is required." });
    }

    try {
        let leaveRequest = await LeaveRequest.findById(req.params.requestId).populate("employeeId", "firstName lastName manager");
        if (!leaveRequest) {
            return res.status(404).json({ msg: "Leave request not found." });
        }

        if (rejector.role === "Admin") {
            // Admin override
        } else if (rejector.role === "HR") {
            if (leaveRequest.status !== "Pending" && leaveRequest.status !== "ApprovedByManager") {
                return res.status(400).json({ msg: `HR cannot reject request in ${leaveRequest.status} state.` });
            }
        } else if (rejector.role === "Manager") {
            if (leaveRequest.status !== "Pending") {
                return res.status(400).json({ msg: `Manager cannot reject request in ${leaveRequest.status} state.` });
            }
            if (!leaveRequest.employeeId.manager || !leaveRequest.employeeId.manager.equals(rejector.id)) {
                return res.status(403).json({ msg: "Manager can only reject requests for their team members." });
            }
        }

        leaveRequest.status = "Rejected";
        leaveRequest.rejectedBy = rejector.id;
        leaveRequest.rejectionReason = rejectionReason || "Rejected by Admin";
        leaveRequest.approvedBy = undefined;
        leaveRequest.cancelledBy = undefined;
        leaveRequest.cancellationReason = undefined;
        if (comment) {
            leaveRequest.comments.push({ userId: rejector.id, comment: `Rejected by ${rejector.role}: ${comment || ""}`.trim() });
        }
        await leaveRequest.save();

        const notificationForEmployee = new Notification({
            recipientId: leaveRequest.employeeId._id,
            senderId: rejector.id,
            message: `Your leave request for ${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()} has been rejected by ${rejector.username}. Reason: ${leaveRequest.rejectionReason}`,
            type: "LeaveRequest",
            link: `/my-leave/${leaveRequest._id}`
        });
        await notificationForEmployee.save();
        // TODO: Emit socket event

        res.json(leaveRequest);
    } catch (err) {
        console.error("Leave rejection error:", err.message);
        res.status(500).send("Server Error");
    }
});

// PUT /api/leave-requests/:requestId/cancel - Cancel a leave request
router.put("/:requestId/cancel", authenticateToken, async (req, res) => {
    const { cancellationReason, comment } = req.body;
    const canceller = req.user;

    try {
        let leaveRequest = await LeaveRequest.findById(req.params.requestId).populate("employeeId");
        if (!leaveRequest) {
            return res.status(404).json({ msg: "Leave request not found." });
        }

        const isOwner = leaveRequest.employeeId._id.equals(canceller.id);

        if (canceller.role === "Admin") {
            leaveRequest.status = "CancelledByAdmin";
            leaveRequest.cancelledBy = canceller.id;
            leaveRequest.cancellationReason = cancellationReason || "Cancelled by Admin";
            if (comment) leaveRequest.comments.push({ userId: canceller.id, comment: `Cancelled by Admin: ${comment || ""}`.trim() });
        } else if (isOwner && (leaveRequest.status === "Pending" || leaveRequest.status === "Approved")) { // Employee can cancel their pending or approved requests
            leaveRequest.status = "CancelledByEmployee";
            leaveRequest.cancelledBy = canceller.id;
            leaveRequest.cancellationReason = cancellationReason || "Cancelled by Employee";
            if (comment) leaveRequest.comments.push({ userId: canceller.id, comment: `Cancelled by Employee: ${comment || ""}`.trim() });
        } else {
            return res.status(403).json({ msg: "Access denied or request cannot be cancelled in its current state by your role." });
        }

        leaveRequest.approvedBy = undefined;
        leaveRequest.rejectedBy = undefined;
        leaveRequest.rejectionReason = undefined;
        await leaveRequest.save();

        // Notify relevant parties (e.g., manager if employee cancelled, employee if admin cancelled)
        if (canceller.role === "Admin" && !isOwner) {
            const notificationForEmployee = new Notification({
                recipientId: leaveRequest.employeeId._id,
                senderId: canceller.id,
                message: `Your leave request for ${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()} has been cancelled by Admin.`,
                type: "LeaveRequest",
                link: `/my-leave/${leaveRequest._id}`
            });
            await notificationForEmployee.save();
        } else if (isOwner && leaveRequest.employeeId.manager) {
            const notificationForManager = new Notification({
                recipientId: leaveRequest.employeeId.manager,
                senderId: canceller.id,
                message: `Leave request for ${leaveRequest.employeeId.firstName} ${leaveRequest.employeeId.lastName} (${leaveRequest.startDate.toDateString()} - ${leaveRequest.endDate.toDateString()}) has been cancelled by the employee.`,
                type: "LeaveRequest",
                link: `/leave-approvals/${leaveRequest._id}`
            });
            await notificationForManager.save();
        }

        res.json(leaveRequest);
    } catch (err) {
        console.error("Leave cancellation error:", err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/leave-requests/balances/:userId - Get leave balances for a specific user
router.get("/balances/:userId", authenticateToken, async (req, res) => {
    const targetUserId = req.params.userId;
    const loggedInUser = req.user;

    try {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ msg: "Target user not found." });
        }

        if (loggedInUser.id !== targetUserId &&
            !(loggedInUser.role === "Admin" || loggedInUser.role === "HR") &&
            !((loggedInUser.role === "Manager" || loggedInUser.role === "TeamLeader") && targetUser.manager && targetUser.manager.equals(loggedInUser.id))) {
            return res.status(403).json({ msg: "Access denied to view this user\\\'s leave balances." });
        }

        // TODO: Implement actual leave balance calculation logic
        const leaveTypes = await LeaveType.find({});
        const approvedLeaves = await LeaveRequest.find({ employeeId: targetUserId, status: "Approved" });
        const pendingLeaves = await LeaveRequest.find({ employeeId: targetUserId, status: "Pending" }); // Or other statuses considered "taken" from balance perspective

        const balances = leaveTypes.map(lt => {
            const totalTaken = approvedLeaves
                .filter(al => al.leaveTypeId.equals(lt._id))
                .reduce((sum, current) => sum + current.numberOfDays, 0);
            const totalPending = pendingLeaves
                .filter(pl => pl.leaveTypeId.equals(lt._id))
                .reduce((sum, current) => sum + current.numberOfDays, 0);

            // This is a simplified entitlement. Real system might have accruals based on hire date, etc.
            const entitled = lt.defaultEntitlementDays;

            return {
                leaveTypeName: lt.name,
                leaveTypeId: lt._id,
                entitled: entitled,
                taken: totalTaken,
                pending: totalPending,
                balance: entitled - totalTaken
            };
        });

        res.json(balances);
    } catch (err) {
        console.error("Error fetching leave balances:", err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/test", (req, res) => res.send("LeaveRequests route is working!"));

module.exports = router;

