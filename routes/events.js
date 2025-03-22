const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { ensureStudent } = require("../middleware/authMiddleware");

// Get events for the logged-in student
router.get("/", ensureStudent, async (req, res) => {
    try {
        const userId = req.session.user.rollNumber;
        if (!userId) return res.status(400).json({ message: "User not authenticated" });
       
        // Fetch courses the student is registered for
        const student = await User.findOne({ rollNumber: userId }).populate('courses');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Generate events based on course schedules
        const events = student.courses.map(course => {
            return course.scheduleDays.map(day => {
                const [start, end] = course.scheduleTime.split('-');
                return {
                    title: course.courseName,
                    start: `${day}T${start}`,
                    end: `${day}T${end}`
                };
            });
        }).flat();

        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Error fetching events", error: error.message });
    }
});

module.exports = router;
