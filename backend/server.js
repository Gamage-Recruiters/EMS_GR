import "dotenv/config"; // loads .env
import express from "express";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import initializeSocket from "./socketServer.js";
import { isOriginAllowed } from "./utils/corsOrigins.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import AttendanceRoutes from "./routes/AttendanceRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import chatRoutes from "./routes/ChatRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dailyTaskRoutes from "./routes/dailyTaskRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import testRoutes from "./routes/testRoutes.js";

// Middlewares
import errorHandler from "./middlewares/errorMiddleware.js";

// Helpers to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// CORS — set CLIENT_URLS on Render (comma-separated Vercel URLs)
const corsOptions = {
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // for preflight support

// Body parsers
app.use(express.json({ limit: process.env.BODY_LIMIT || "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.BODY_LIMIT || "10mb",
  }),
);

// Health check / base route
app.get("/", (req, res) => {
  res.json({ message: "EMS Backend Running with Socket.IO" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Ensure uploads dir exists (Render free tier has ephemeral disk)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", AttendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/daily-tasks", dailyTaskRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/test", testRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});
