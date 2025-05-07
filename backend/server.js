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
// const ZKJubaer = require("zk-jubaer");

const app = express();
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

// Placeholder for DFACE702 Integration Logic
async function initDeviceConnection() {
    console.log("Initializing device connection (placeholder)...");
    // Simulate receiving an attendance event every 30 seconds for testing
    setInterval(async () => {
        const simulatedData = {
            userId: `EMP${Math.floor(Math.random() * 100)}`,
            timestamp: new Date(),
            type: Math.random() > 0.5 ? "clock-in" : "clock-out"
        };
        // console.log("Simulating attendance event:", simulatedData); // Reduce noise
        try {
            const newAttendance = new Attendance(simulatedData);
            await newAttendance.save();
            // console.log("Saved simulated attendance log to DB"); // Reduce noise
            io.emit("attendance_update", newAttendance);
        } catch (dbError) {
            // Avoid logging timeout errors repeatedly if DB connection is down
            if (!dbError.message.includes("buffering timed out")) {
                 console.error("Error saving simulated attendance log:", dbError);
            }
        }
    }, 30000);
}

// Start Server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    initDeviceConnection();
});

