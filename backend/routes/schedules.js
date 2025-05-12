const express = require("express");
const Schedule = require("../models/Schedule");
const User = require("../models/User");
const ShiftType = require("../models/ShiftType"); // Updated from Shift to ShiftType
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const { expandRecurringSchedules, checkScheduleConflict } = require("../utils/scheduleUtils"); // Assuming helper functions

const router = express.Router();

// POST /api/schedules - Create a new schedule assignment (single or recurring)

router.post("/", async (req, res) => {
    console.log("Schedule creation route hit with body:", req.body);
    
    const {
        employeeId,
        shiftTypeId,
        assignmentType,
        startDate,
        endDate,
        daysOfWeek,
        dayOfMonth,
        exceptions,
        notes
    } = req.body;
    
    // Use a hardcoded value for assignedBy that exists in your database
    // This should be a valid ObjectId from your users collection
    const assignedBy = employeeId; // Use the employee ID as the assignedBy for now
    
    if (!employeeId || !shiftTypeId || !assignmentType || !startDate) {
        return res.status(400).json({ msg: "Employee ID, Shift Type ID, Assignment Type, and Start Date are required." });
    }
    
    try {
        console.log("Finding employee with ID:", employeeId);
        const employee = await User.findById(employeeId);
        if (!employee) {
            console.log("Employee not found with ID:", employeeId);
            return res.status(404).json({ msg: "Employee not found." });
        }
        
        console.log("Finding shift type with ID:", shiftTypeId);
        const shiftType = await ShiftType.findById(shiftTypeId);
        if (!shiftType) {
            console.log("Shift type not found with ID:", shiftTypeId);
            return res.status(404).json({ msg: "Shift type not found." });
        }
        
        if (!shiftType.isActive) {
            console.log("Shift type is inactive:", shiftTypeId);
            return res.status(400).json({ msg: "Cannot assign an inactive shift type." });
        }
        
        console.log("Creating schedule data object");
        const scheduleData = {
            employeeId,
            shiftTypeId,
            assignmentType,
            startDate: new Date(startDate),
            assignedBy,
            notes,
            isActive: true
        };
        
        if (endDate) scheduleData.endDate = new Date(endDate);
        if (assignmentType === "weekly" && daysOfWeek) scheduleData.daysOfWeek = daysOfWeek;
        if (assignmentType === "monthly" && dayOfMonth) scheduleData.dayOfMonth = dayOfMonth;
        if (exceptions) scheduleData.exceptions = exceptions.map(ex => new Date(ex));
        
        console.log("Creating new schedule rule with data:", scheduleData);
        const newScheduleRule = new Schedule(scheduleData);
        
        console.log("Saving schedule rule to database");
        await newScheduleRule.save();
        console.log("Schedule rule saved successfully with ID:", newScheduleRule._id);
        
        // Skip notification creation for now
        
        res.status(201).json(newScheduleRule);
    } catch (err) {
        console.error("Create schedule rule error:", err);
        console.error("Error stack:", err.stack);
        
        if (err.name === "ValidationError") {
            console.error("Validation error details:", err.errors);
            return res.status(400).json({ 
                msg: "Validation Error", 
                errors: err.errors 
            });
        }
        if (err.code === 11000) {
            return res.status(400).json({ msg: "This specific single shift assignment already exists for the employee on this date." });
        }
        res.status(500).send("Server Error: " + err.message);
    }
});



// GET /api/schedules - Get expanded scheduled shifts for a given view period
// GET /api/schedules - Get expanded scheduled shifts for a given view period
router.get("/", async (req, res) => {
    console.log("GET /schedules route hit with query:", req.query);
    
    const {
        employeeId,
        teamId,
        department,
        viewStartDate,
        viewEndDate,
        page = 1,
        limit = 100
    } = req.query;

    if (!viewStartDate || !viewEndDate) {
        console.log("Missing required parameters: viewStartDate and viewEndDate");
        return res.status(400).json({ msg: "viewStartDate and viewEndDate are required query parameters." });
    }

    try {
        console.log("Processing date range:", viewStartDate, "to", viewEndDate);
        const vStartDate = new Date(new Date(viewStartDate).setHours(0, 0, 0, 0));
        const vEndDate = new Date(new Date(viewEndDate).setHours(23, 59, 59, 999));
        console.log("Processed date range:", vStartDate, "to", vEndDate);

        // Set a default user filter if none is provided
        let userFilterIds = [];
        
        // Check if req.user exists before accessing its properties
        const loggedInUser = req.user || { role: "Guest" };
        console.log("User role:", loggedInUser.role);

        if (employeeId) {
            console.log("Filtering by employee ID:", employeeId);
            userFilterIds = [employeeId];
        } else {
            console.log("No employee filter, fetching all users");
            // Fetch all users if no specific filter
            const allUsers = await User.find({}).select("_id");
            userFilterIds = allUsers.map(u => u._id.toString());
            console.log(`Found ${userFilterIds.length} users`);
        }

        console.log("Fetching schedule rules for users:", userFilterIds);
        // Fetch schedule rules
        const scheduleRules = await Schedule.find({
            employeeId: { $in: userFilterIds },
            isActive: true,
            $or: [
                { endDate: { $gte: vStartDate } },
                { endDate: null }
            ],
            startDate: { $lte: vEndDate }
        })
        .populate("employeeId", "firstName lastName employeeId username")
        .populate("shiftTypeId")
        .populate("assignedBy", "username");

        console.log(`Found ${scheduleRules.length} schedule rules`);

        // Define a simple expansion function if the imported one isn't available
        const expandRecurringSchedulesLocal = (rule, startDate, endDate) => {
            console.log(`Expanding rule: ${rule._id}`);
            
            // For single assignments, just return the rule as is
            if (rule.assignmentType === "single") {
                const ruleDate = new Date(rule.startDate);
                if (ruleDate >= startDate && ruleDate <= endDate) {
                    return [{
                        _id: rule._id,
                        employeeId: rule.employeeId,
                        shiftTypeId: rule.shiftTypeId,
                        date: ruleDate,
                        notes: rule.notes,
                        assignedBy: rule.assignedBy,
                        ruleId: rule._id // Reference to the original rule
                    }];
                }
                return [];
            }
            
            // For now, just handle single assignments
            // You can implement the logic for weekly, monthly, etc. later
            return [];
        };

        const allExpandedSchedules = [];
        for (const rule of scheduleRules) {
            if (rule.shiftTypeId) {
                try {
                    // Use the local function if the imported one isn't available
                    const expandFn = typeof expandRecurringSchedules === 'function' 
                        ? expandRecurringSchedules 
                        : expandRecurringSchedulesLocal;
                        
                    const expanded = expandFn(rule, vStartDate, vEndDate);
                    allExpandedSchedules.push(...expanded);
                } catch (expansionError) {
                    console.error(`Error expanding rule ${rule._id}:`, expansionError);
                    // Continue with other rules
                }
            } else {
                console.log(`Rule ${rule._id} has no shiftTypeId, skipping expansion`);
            }
        }
        
        console.log(`Expanded to ${allExpandedSchedules.length} schedule instances`);
        
        // If no expanded schedules, return the raw rules instead
        const schedulesToReturn = allExpandedSchedules.length > 0 
            ? allExpandedSchedules 
            : scheduleRules.map(rule => ({
                ...rule.toObject(),
                date: rule.startDate // Add date field for consistency
            }));
        
        // Sort all schedules by date
        schedulesToReturn.sort((a,b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));

        const totalSchedules = schedulesToReturn.length;
        const paginatedSchedules = schedulesToReturn.slice(
            (parseInt(page) - 1) * parseInt(limit), 
            parseInt(page) * parseInt(limit)
        );

        console.log(`Returning ${paginatedSchedules.length} paginated schedules`);
        res.json({
            expandedSchedules: paginatedSchedules,
            totalPages: Math.ceil(totalSchedules / limit),
            currentPage: parseInt(page),
            totalSchedules
        });
    } catch (err) {
        console.error("Get expanded schedules error:", err);
        console.error("Error stack:", err.stack);
        res.status(500).json({ 
            msg: "Server Error: " + err.message,
            error: err.toString()
        });
    }
});


// GET /api/schedules/rules/:ruleId - Get a specific schedule assignment rule
router.get("/rules/:ruleId", authenticateToken, async (req, res) => {
    try {
        const scheduleRule = await Schedule.findById(req.params.ruleId)
            .populate("employeeId", "firstName lastName employeeId username department")
            .populate("shiftTypeId")
            .populate("assignedBy", "username");

        if (!scheduleRule) {
            return res.status(404).json({ msg: "Schedule rule not found." });
        }
        // Add authorization checks similar to individual schedule GET if needed
        res.json(scheduleRule);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Schedule rule not found." });
        }
        res.status(500).send("Server Error");
    }
});

// PUT /api/schedules/rules/:ruleId - Update a schedule assignment rule
router.put("/rules/:ruleId", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader"])], async (req, res) => {
    const { shiftTypeId, assignmentType, startDate, endDate, daysOfWeek, dayOfMonth, exceptions, notes, isActive } = req.body;
    try {
        let scheduleRule = await Schedule.findById(req.params.ruleId);
        if (!scheduleRule) {
            return res.status(404).json({ msg: "Schedule rule not found." });
        }

        // Authorization: Ensure manager/TL is updating their own team's schedule rule
        if (req.user.role === "Manager" || req.user.role === "TeamLeader") {
            const employeeToUpdate = await User.findById(scheduleRule.employeeId);
            if (!employeeToUpdate || !employeeToUpdate.manager || !employeeToUpdate.manager.equals(req.user.id)) {
                return res.status(403).json({ msg: "Access denied to update this schedule rule." });
            }
        }

        // Update fields
        if (shiftTypeId) scheduleRule.shiftTypeId = shiftTypeId;
        if (assignmentType) scheduleRule.assignmentType = assignmentType;
        if (startDate) scheduleRule.startDate = new Date(startDate);
        scheduleRule.endDate = endDate ? new Date(endDate) : null; // Allow unsetting endDate for permanent

        if (assignmentType === "weekly" && daysOfWeek !== undefined) scheduleRule.daysOfWeek = daysOfWeek;
        else if (assignmentType !== "weekly") scheduleRule.daysOfWeek = [];

        if (assignmentType === "monthly" && dayOfMonth !== undefined) scheduleRule.dayOfMonth = dayOfMonth;
        else if (assignmentType !== "monthly") scheduleRule.dayOfMonth = null;

        if (exceptions !== undefined) scheduleRule.exceptions = exceptions.map(ex => new Date(ex));
        if (notes !== undefined) scheduleRule.notes = notes;
        if (isActive !== undefined) scheduleRule.isActive = isActive;
        scheduleRule.assignedBy = req.user.id; // Record who last updated

        // TODO: Add conflict checking if critical fields change

        await scheduleRule.save();
        res.json(scheduleRule);
    } catch (err) {
        console.error("Update schedule rule error:", err.message);
        if (err.name === "ValidationError") {
            return res.status(400).json({ msg: "Validation Error", errors: err.errors });
        }
        res.status(500).send("Server Error");
    }
});

// DELETE /api/schedules/rules/:ruleId - Deactivate (soft delete) a schedule assignment rule
router.delete("/rules/:ruleId", [authenticateToken, authorizeRole(["Admin", "HR", "Manager", "TeamLeader"])], async (req, res) => {
    try {
        const scheduleRule = await Schedule.findById(req.params.ruleId);
        if (!scheduleRule) {
            return res.status(404).json({ msg: "Schedule rule not found." });
        }

        if (req.user.role === "Manager" || req.user.role === "TeamLeader") {
            const employeeToUpdate = await User.findById(scheduleRule.employeeId);
            if (!employeeToUpdate || !employeeToUpdate.manager || !employeeToUpdate.manager.equals(req.user.id)) {
                return res.status(403).json({ msg: "Access denied to delete this schedule rule." });
            }
        }

        scheduleRule.isActive = false; // Soft delete
        await scheduleRule.save();

        res.json({ msg: "Schedule rule deactivated successfully." });
    } catch (err) {
        console.error("Deactivate schedule rule error:", err.message);
        res.status(500).send("Server Error");
    }
});




//route for testing here 
// Add this new route at the beginning of your routes
// GET /api/schedules/all - Get all schedules without authentication (for development/testing)
router.get("/all", async (req, res) => {
    try {
        // Fetch all schedules
        const schedules = await Schedule.find({ isActive: true })
            .populate("employeeId", "firstName lastName employeeId username")
            .populate("shiftTypeId")
            .populate("assignedBy", "username");

        // Get the view period from query params or use default (current month + next month)
        const viewStartDate = req.query.viewStartDate 
            ? new Date(req.query.viewStartDate) 
            : new Date(new Date().setDate(1)); // First day of current month
        
        const viewEndDate = req.query.viewEndDate
            ? new Date(req.query.viewEndDate)
            : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0); // Last day of next month

        // Expand recurring schedules
        const allExpandedSchedules = [];
        for (const rule of schedules) {
            if (rule.shiftTypeId) { // Ensure shiftType is populated
                // Since expandRecurringSchedules might not be available, we'll implement a simple version here
                const expanded = expandScheduleRule(rule, viewStartDate, viewEndDate);
                allExpandedSchedules.push(...expanded);
            }
        }
        
        // Sort all expanded schedules by date
        allExpandedSchedules.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            expandedSchedules: allExpandedSchedules,
            totalSchedules: allExpandedSchedules.length
        });
    } catch (err) {
        console.error("Get all schedules error:", err.message);
        res.status(500).send("Server Error");
    }
});

// Simple function to expand a schedule rule into individual instances
function expandScheduleRule(rule, viewStartDate, viewEndDate) {
    const expanded = [];
    const startDate = new Date(Math.max(rule.startDate, viewStartDate));
    const endDate = rule.endDate ? new Date(Math.min(rule.endDate, viewEndDate)) : viewEndDate;
    
    // For single assignments, just add the one instance if it falls within the view period
    if (rule.assignmentType === 'single') {
        const date = new Date(rule.startDate);
        if (date >= viewStartDate && date <= viewEndDate) {
            expanded.push({
                _id: rule._id,
                date: date,
                employeeId: rule.employeeId,
                shiftTypeId: rule.shiftTypeId,
                notes: rule.notes,
                assignmentType: rule.assignmentType,
                assignedBy: rule.assignedBy
            });
        }
        return expanded;
    }
    
    // For weekly assignments
    if (rule.assignmentType === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const current = new Date(startDate);
        while (current <= endDate) {
            const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
            if (rule.daysOfWeek.includes(dayOfWeek)) {
                // Check if this date is in the exceptions list
                const isException = rule.exceptions && rule.exceptions.some(ex => 
                    new Date(ex).toDateString() === current.toDateString()
                );
                
                if (!isException) {
                    expanded.push({
                        _id: `${rule._id}-${current.toISOString()}`,
                        date: new Date(current),
                        employeeId: rule.employeeId,
                        shiftTypeId: rule.shiftTypeId,
                        notes: rule.notes,
                        assignmentType: rule.assignmentType,
                        assignedBy: rule.assignedBy
                    });
                }
            }
            // Move to next day
            current.setDate(current.getDate() + 1);
        }
        return expanded;
    }
    
    // For monthly assignments
    if (rule.assignmentType === 'monthly' && rule.dayOfMonth) {
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // Start at first day of month
        while (current <= endDate) {
            // Set to the specified day of month, handling months with fewer days
            const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
            const targetDay = Math.min(rule.dayOfMonth, daysInMonth);
            current.setDate(targetDay);
            
            // If this date is within our view period and not an exception
            if (current >= startDate && current <= endDate) {
                const isException = rule.exceptions && rule.exceptions.some(ex => 
                    new Date(ex).toDateString() === current.toDateString()
                );
                
                if (!isException) {
                    expanded.push({
                        _id: `${rule._id}-${current.toISOString()}`,
                        date: new Date(current),
                        employeeId: rule.employeeId,
                        shiftTypeId: rule.shiftTypeId,
                        notes: rule.notes,
                        assignmentType: rule.assignmentType,
                        assignedBy: rule.assignedBy
                    });
                }
            }
            
            // Move to next month
            current.setMonth(current.getMonth() + 1);
            current.setDate(1); // Reset to first day of next month
        }
        return expanded;
    }
    
    return expanded;
}

router.get("/test", (req, res) => {
    res.json({ message: "Schedules route is working" });
});

// It's assumed that scheduleUtils.js would contain:
// function expandRecurringSchedules(rule, viewStartDate, viewEndDate) { ... }
// function checkScheduleConflict(employeeId, date, scheduleIdToExclude, shiftStartTime, shiftEndTime, existingScheduleModel) { ... }
// These utility functions would house the complex logic for expansion and conflict detection.

module.exports = router;

