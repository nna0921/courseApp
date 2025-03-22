const express = require("express");
const connectDB = require("./config/db"); 
const dotenv = require("dotenv");
const session = require("express-session");
const path = require("path");
const User = require("./models/user");
const Course = require("./models/course");
const bcrypt = require("bcrypt");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (for login persistence)
app.use(session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false
}));

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// Import Routes
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");
const eventsRouter = require("./routes/events");

// Use Routes
app.use("/auth", authRoutes);
app.use("/student", studentRoutes);
app.use("/admin", adminRoutes);
app.use("/api/events", eventsRouter);

// Default Route - Login Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Connect to MongoDB and create dummy data
connectDB().then(() => {
    console.log("MongoDB Connected");
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Server Initialization
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
