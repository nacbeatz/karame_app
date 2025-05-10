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
            console.log("Decoded token:", decoded);
            // Fetch user data from the database, including the 'No' field
            const user = await User.findById(decoded.user.id).select("-password");
            if (!user) {
                console.error("User not found in database.");
                return res.status(403).json({ msg: "User not found or account inactive." });
            }
            if (!user.isActive) {
                console.error("User account is inactive.");
                return res.status(403).json({ msg: "User not found or account inactive." });
            }
            req.user = {
                id: user._id,
                role: user.role,
                No: user.No, // Include the 'No' field
                firstName: user.firstName,
                lastName: user.lastName,
            }; // Attach relevant user data to the request
            next();
        } catch (dbError) {
            console.error("Database error:", dbError.message);
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
