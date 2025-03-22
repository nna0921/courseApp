const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Course = require("../models/course");
const path = require("path");
const mongoose = require("mongoose");

// Middleware to check if user is student
const isStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === "student") {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Student only." });
    }
};

// Get student dashboard - updated to use EJS
router.get("/dashboard", isStudent, async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).render('error', { message: 'Student not found' });
        }
        
        // Get course details for registered courses
        const registeredCourses = await Course.find({ 
            _id: { $in: student.courses }
        });
        
        // Get all available departments (for filtering)
        const allCourses = await Course.find();
        const departments = [...new Set(allCourses.map(course => 
            course.courseCode.substring(0, course.courseCode.search(/\d/)).trim()
        ))];
        
        // Get all course levels (for filtering)
        const courseLevels = [...new Set(allCourses.map(course => {
            const match = course.courseCode.match(/\d+/);
            return match ? match[0].charAt(0) + "00" : null;
        }).filter(Boolean))];
        
        res.render('dashboard', {
            student,
            registeredCourses,
            departments,
            courseLevels
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { message: 'Server error' });
    }
});

// Get all available courses with real-time availability
router.get("/courses", isStudent, async (req, res) => {
    try {
        const studentId = req.session.user.id;
        console.log("Fetching available courses for student:", studentId);
        
        const student = await User.findById(studentId);
        
        if (!student) {
            console.log("Student not found:", studentId);
            return res.status(404).json({ error: "Student not found" });
        }
        
        // Get all courses with additional information
        const courses = await Course.find();
        console.log("Found total courses:", courses.length);
        
        // Get enrollment count for each course
        const enrollmentCounts = await User.aggregate([
            { $match: { role: "student" } },
            { $unwind: "$courses" },
            { $group: { _id: "$courses", count: { $sum: 1 } } }
        ]);
        
        // Create a map of course ID to enrollment count
        const enrollmentMap = enrollmentCounts.reduce((map, item) => {
            map[item._id.toString()] = item.count;
            return map;
        }, {});
        
        // Add enrollment info to each course
        const coursesWithAvailability = courses.map(course => {
            const courseObj = course.toObject();
            const id = courseObj._id.toString();
            const enrolled = enrollmentMap[id] || 0;
            const maxSeats = course.maxSeats || 30; // Use course-specific maxSeats or default to 30
            const availableSeats = maxSeats - enrolled;
            
            // Check if student is already registered for this course
            const isRegistered = student.courses.some(c => c.toString() === id);
            
            // Check if student has all prerequisites
            const hasPrerequisites = !course.prerequisites || course.prerequisites.every(prereq => {
                const prerequisiteCourse = courses.find(c => c.courseCode === prereq);
                return prerequisiteCourse && student.courses.some(c => 
                    c.toString() === prerequisiteCourse._id.toString()
                );
            });
            
            return {
                ...courseObj,
                _id: id,  // Ensure ID is a string
                enrolled,
                maxSeats,
                availableSeats,
                isRegistered,
                hasPrerequisites
            };
        });
        
        res.json(coursesWithAvailability);
    } catch (error) {
        console.error('Courses fetch error:', error);
        res.status(500).json({ error: "Error fetching courses" });
    }
});

// Get student's registered courses
router.get("/my-courses", isStudent, async (req, res) => {
    try {
        const studentId = req.session.user.id;
        console.log("Fetching courses for student:", studentId);
        
        const student = await User.findById(studentId);
        if (!student) {
            console.log("Student not found:", studentId);
            return res.status(404).json({ error: "Student not found" });
        }

        console.log("Student courses IDs:", student.courses);
        
        // Get course details for registered courses
        const courses = await Course.find({ _id: { $in: student.courses } });
        console.log("Found registered courses:", courses.length);
        
        // Convert MongoDB ObjectIds to strings in the response
        const coursesWithStringIds = courses.map(course => {
            const courseObj = course.toObject();
            courseObj._id = courseObj._id.toString();
            return courseObj;
        });
        
        res.json(coursesWithStringIds);
    } catch (error) {
        console.error('My courses fetch error:', error);
        res.status(500).json({ error: "Error fetching registered courses" });
    }
});

// Register for a course
router.post("/register", isStudent, async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.session.user.id;
        
        console.log("Registration request:", { studentId, courseId });
        
        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.log("Invalid course ID:", courseId);
            return res.status(400).json({ error: "Invalid course ID" });
        }
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            console.log("Course not found:", courseId);
            return res.status(404).json({ error: "Course not found" });
        }
        
        // Check if student exists
        const student = await User.findById(studentId);
        if (!student) {
            console.log("Student not found:", studentId);
            return res.status(404).json({ error: "Student not found" });
        }
        
        // Check if already registered
        if (student.courses.some(id => id.toString() === courseId)) {
            console.log("Already registered for course:", courseId);
            return res.status(400).json({ error: "Already registered for this course" });
        }
        
        // Check prerequisites
        if (course.prerequisites && course.prerequisites.length > 0) {
            const studentCourses = await Course.find({ _id: { $in: student.courses } });
            const studentCourseCodes = studentCourses.map(c => c.courseCode);
            
            const missingPrerequisites = course.prerequisites.filter(
                prereq => !studentCourseCodes.includes(prereq)
            );
            
            if (missingPrerequisites.length > 0) {
                console.log("Missing prerequisites:", missingPrerequisites);
                return res.status(400).json({ 
                    error: "Missing prerequisites", 
                    missingPrerequisites 
                });
            }
        }
        
        // Check seat availability using course's maxSeats value
        const maxSeats = course.maxSeats || 30;
        const enrolledCount = await User.countDocuments({
            role: "student",
            courses: courseId
        });
        
        if (enrolledCount >= maxSeats) {
            console.log("No available seats for course:", courseId);
            return res.status(400).json({ error: "No available seats" });
        }
        
        // Register for the course
        await User.findByIdAndUpdate(studentId, {
            $addToSet: { courses: new mongoose.Types.ObjectId(courseId) }
        });
        
        console.log("Registration successful for course:", courseId);
        
        // Get updated user data
        const updatedStudent = await User.findById(studentId);
        const registeredCourses = await Course.find({ _id: { $in: updatedStudent.courses } });
        
        // Convert MongoDB ObjectIds to strings in the response
        const coursesWithStringIds = registeredCourses.map(course => {
            const courseObj = course.toObject();
            courseObj._id = courseObj._id.toString();
            return courseObj;
        });
        
        res.json({ 
            success: true, 
            message: "Course registration successful",
            courses: coursesWithStringIds
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: "Error registering for course" });
    }
});

// Drop a course
router.post("/drop", isStudent, async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.session.user.id;
        
        console.log("Drop course request:", { studentId, courseId });
        
        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.log("Invalid course ID:", courseId);
            return res.status(400).json({ error: "Invalid course ID" });
        }
        
        // Check if student exists
        const student = await User.findById(studentId);
        if (!student) {
            console.log("Student not found:", studentId);
            return res.status(404).json({ error: "Student not found" });
        }
        
        // Check if registered for the course
        if (!student.courses.some(id => id.toString() === courseId)) {
            console.log("Not registered for course:", courseId);
            return res.status(400).json({ error: "Not registered for this course" });
        }
        
        // Drop the course - Fixed: use new mongoose.Types.ObjectId
        await User.findByIdAndUpdate(studentId, {
            $pull: { courses: new mongoose.Types.ObjectId(courseId) }
        });
        
        console.log("Successfully dropped course:", courseId);
        
        // Get updated user data
        const updatedStudent = await User.findById(studentId);
        const registeredCourses = await Course.find({ _id: { $in: updatedStudent.courses } });
        
        // Convert MongoDB ObjectIds to strings in the response
        const coursesWithStringIds = registeredCourses.map(course => {
            const courseObj = course.toObject();
            courseObj._id = courseObj._id.toString();
            return courseObj;
        });
        
        res.json({ 
            success: true, 
            message: "Course dropped successfully",
            courses: coursesWithStringIds
        });
    } catch (error) {
        console.error('Drop course error:', error);
        res.status(500).json({ error: "Error dropping course" });
    }
});

// Save temporary schedule (for maintaining state during session)
router.post("/save-temp-schedule", isStudent, async (req, res) => {
    try {
        const { courseIds } = req.body;
        
        if (!Array.isArray(courseIds)) {
            return res.status(400).json({ error: "Invalid course IDs format" });
        }
        
        // Ensure all IDs are valid and convert to strings for safe storage
        const validCourseIds = courseIds.filter(id => 
            id && mongoose.Types.ObjectId.isValid(id)
        ).map(id => id.toString());
        
        // Store in session instead of database to maintain temporary state
        req.session.tempSchedule = validCourseIds;
        
        res.json({ 
            success: true, 
            message: "Temporary schedule saved"
        });
    } catch (error) {
        console.error('Save temp schedule error:', error);
        res.status(500).json({ error: "Error saving temporary schedule" });
    }
});

// Get temporary schedule
router.get("/temp-schedule", isStudent, async (req, res) => {
    try {
        const tempSchedule = req.session.tempSchedule || [];
        
        // Get course details if IDs are available
        let courses = [];
        if (tempSchedule.length > 0) {
            try {
                // Convert string IDs to ObjectIds
                const objectIds = tempSchedule
                    .filter(id => mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));
                
                if (objectIds.length > 0) {
                    courses = await Course.find({ _id: { $in: objectIds } });
                    
                    // Convert MongoDB ObjectIds to strings in the response
                    courses = courses.map(course => {
                        const courseObj = course.toObject();
                        courseObj._id = courseObj._id.toString();
                        return courseObj;
                    });
                }
            } catch (error) {
                console.error('Error converting temp schedule IDs:', error);
            }
        }
        
        res.json(courses);
    } catch (error) {
        console.error('Get temp schedule error:', error);
        res.status(500).json({ error: "Error retrieving temporary schedule" });
    }
});

module.exports = router;
