require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
const Attendance = require("./models/Attendance");
const authRoutes = require("./routes/auth");
const leaveTypeRoutes = require("./routes/leaveTypes"); // Import leave type routes
const connectDB = require("./config/db"); // Import the database connection function
const attendanceRoutes = require("./routes/attendance");
const leaveRequestRoutes = require("./routes/leaveRequests");

const app = express(); // Initialize the app
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
connectDB(); // Use the new database connection logic

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave-types", leaveTypeRoutes); // Use leave type routes
app.use("/api/attendance", attendanceRoutes); // Use attendance routes
app.use("/api/leave-requests", leaveRequestRoutes);

// Basic Route
app.get("/", (req, res) => {
    res.send("Hospital Workforce Management Backend Running");
});

// API endpoint to get recent attendance logs (Example)
app.get("/api/attendance", async (req, res) => {
    try {
        const logs = await Attendance.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        res.status(500).json({ message: "Error fetching attendance logs" });
    }
});

// Socket.IO Connection Logic
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
    socket.on("client_message", (data) => {
        console.log("Message from client:", data);
        io.emit("server_message", { message: "Message received by server", data });
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});