const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Adjust path if needed
const { authenticateToken } = require("../middleware/authMiddleware"); // Import the middleware

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // User matched, create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 }, // Expires in 1 hour (adjust as needed)
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/register (Optional: For initial user creation if needed)
// @desc    Register a new user (consider restricting access)
// @access  Public/Admin
router.post("/register", async (req, res) => {
  const { username, password, role, firstName, lastName, employeeId } = req.body;

  // Basic validation (add more robust validation as needed)
  if (!username || !password || !role) {
    return res.status(400).json({ msg: "Please provide username, password, and role" });
  }

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      username,
      password, // Hashing is handled by the pre-save hook in the model
      role,
      firstName,
      lastName,
      employeeId
    });

    await user.save();

    // Optionally return a token upon registration as well
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        // Decide if you want to auto-login user on register
        // res.json({ token });
        res.json({ msg: "User registered successfully" }); // Or just send success message
      }
    );
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
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

module.exports = router;
