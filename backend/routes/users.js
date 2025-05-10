const express = require("express");
const User = require("../models/User");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware"); // Assuming middleware will be created

const router = express.Router();

// GET /api/users - Get a list of all users
router.get("/", [authenticateToken, authorizeRole(["Admin", "HR"])], async (req, res) => {
    try {
        // Add pagination and filtering later
        const users = await User.find().select("-password"); // Exclude password
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// GET /api/users/:userId - Get specific user details
router.get("/:userId", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Authorization: Admin/HR can see any. Manager their team. Employee their own.
        const loggedInUser = req.user;
        if (loggedInUser.role === "Admin" || loggedInUser.role === "HR" || loggedInUser.id === req.params.userId) {
            return res.json(user);
        }
        // Add logic for Manager/TeamLeader to see their team members if `user.manager` or `user.team` is implemented
        // For now, restrict if not Admin/HR or self
        if (loggedInUser.id !== req.params.userId) {
            // Basic check: if the loggedInUser is a manager, and the requested user's manager field matches loggedInUser.id
            if ((loggedInUser.role === "Manager" || loggedInUser.role === "TeamLeader") && user.manager && user.manager.toString() === loggedInUser.id) {
                return res.json(user);
            }
            return res.status(403).json({ msg: "Access denied" });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "User not found" });
        }
        res.status(500).send("Server Error");
    }
});

// Add this route to get a user by ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).send("Server Error");
    }
});

// Add this route to get the current user
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Error fetching current user:", err.message);
        res.status(500).send("Server Error");
    }
});

// PUT /api/users/:userId - Update user details
router.put("/:userId", authenticateToken, async (req, res) => {
    const { firstName, lastName, email, phone, department, jobTitle, dateOfHire, emergencyContactName, emergencyContactPhone, isActive, profileImage, role, username, employeeId } = req.body;

    try {
        let user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const loggedInUser = req.user;

        // Authorization logic
        if (loggedInUser.role === "Admin" || loggedInUser.role === "HR") {
            // Admins/HR can update most fields, including role for others
            if (firstName !== undefined) user.firstName = firstName;
            if (lastName !== undefined) user.lastName = lastName;
            if (email !== undefined) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (department !== undefined) user.department = department;
            if (jobTitle !== undefined) user.jobTitle = jobTitle;
            if (dateOfHire !== undefined) user.dateOfHire = dateOfHire;
            if (emergencyContactName !== undefined) user.emergencyContactName = emergencyContactName;
            if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
            if (isActive !== undefined) user.isActive = isActive;
            if (profileImage !== undefined) user.profileImage = profileImage;
            if (username !== undefined) user.username = username; // Careful with username changes
            if (employeeId !== undefined) user.employeeId = employeeId;
            if (role !== undefined && loggedInUser.id !== req.params.userId) { // Admin/HR can change role of others
                user.role = role;
            }
        } else if (loggedInUser.id === req.params.userId) {
            // Employees can update their own limited profile information
            if (firstName !== undefined) user.firstName = firstName;
            if (lastName !== undefined) user.lastName = lastName;
            // Email change might need verification, for now allow
            if (email !== undefined) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (emergencyContactName !== undefined) user.emergencyContactName = emergencyContactName;
            if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
            if (profileImage !== undefined) user.profileImage = profileImage;
            // Cannot change own role, isActive, department, jobTitle, username, employeeId directly
        } else {
            // Add logic for Manager/TeamLeader to update limited fields of their team members
            return res.status(403).json({ msg: "Access denied to update this user or these fields" });
        }

        // Password change should be a separate endpoint

        await user.save();
        res.json(user.select("-password"));

    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Handle duplicate key errors (e.g. username, email)
            return res.status(400).json({ msg: "Username or email already exists." });
        }
        res.status(500).send("Server Error");
    }
});

// DELETE /api/users/:userId - Deactivate/delete a user (soft delete by setting isActive=false)
router.delete("/:userId", [authenticateToken, authorizeRole(["Admin", "HR"])], async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Instead of actual deletion, deactivate the user
        user.isActive = false;
        // Potentially clear sensitive info or add a `deletedAt` timestamp if hard delete is ever needed
        await user.save();

        res.json({ msg: "User deactivated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// POST /api/users/:userId/change-password - Change user's password
router.post("/:userId/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const loggedInUser = req.user;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: "Please provide current and new password" });
    }

    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Authorization: Admin can change anyone's password (potentially without currentPassword)
        // Employee can change their own password
        if (loggedInUser.role === "Admin") {
            // Admin might not need to provide currentPassword, or it's a separate flow
            // For simplicity here, we'll assume Admin changing other's password directly sets it
            if (loggedInUser.id !== req.params.userId) {
                user.password = newPassword; // Hashing is done by pre-save hook
                await user.save();
                return res.json({ msg: "Password updated successfully by Admin" });
            }
        }

        // If user is changing their own password, or Admin changing their own
        if (loggedInUser.id === req.params.userId) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ msg: "Incorrect current password" });
            }
            user.password = newPassword; // Hashing is done by pre-save hook
            await user.save();
            return res.json({ msg: "Password updated successfully" });
        } else {
            return res.status(403).json({ msg: "Access denied to change this user\'s password" });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;

