const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Course = require("../models/course");

// Login route
router.post("/login", async (req, res) => {
    try {
        const { email, password, role, username, rollNumber } = req.body;

        let user;
        
        if (role === "admin") {
            // For admin login, use username
            user = await User.findOne({ username, role: "admin" });
        } else {
            // For student login, try to find by rollNumber or email
            const studentIdentifier = rollNumber || email;
            
            user = await User.findOne({ 
                $or: [
                    { rollNumber: studentIdentifier },
                    { email: studentIdentifier }
                ],
                role: "student"
            });
        }

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check password for admin (students use default password)
        if (role === "admin") {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            // For students, we're using a fixed password
            if (password !== "student123") {
                return res.status(401).json({ error: "Invalid credentials" });
            }
        }

        // Set user session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber,
            username: user.username
        };

        // Return user data without password
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber,
            username: user.username
        };

        res.json(userData);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Error during login" });
    }
});

// Register route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, rollNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            rollNumber,
            role: "student" // Default role for registration
        });

        await user.save();

        // Set user session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber
        };

        // Return user data without password
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber
        };

        res.status(201).json(userData);
    } catch (error) {
        res.status(500).json({ error: "Error during registration" });
    }
});

// Logout route
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error during logout" });
        }
        res.json({ message: "Logged out successfully" });
    });
});

// Get current user route
router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.session.user);
});

module.exports = router;