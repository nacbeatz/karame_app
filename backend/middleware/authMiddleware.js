const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error("JWT verification error:", err.message);
            return res.sendStatus(403); // invalid token
        }
        try {
            // Attach user object from payload to request
            // Optionally, fetch fresh user data from DB to ensure user still exists/is active
            const user = await User.findById(decoded.user.id).select("-password");
            if (!user || !user.isActive) {
                return res.status(403).json({ msg: "User not found or account inactive." });
            }
            req.user = user; // Store full user object (excluding password)
            next();
        } catch (dbError) {
            console.error("Error fetching user during auth:", dbError.message);
            return res.status(500).send("Server error during authentication.");
        }
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ msg: "Access Denied: You do not have the required role." });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };

