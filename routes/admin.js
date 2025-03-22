const express = require("express");
const { ensureAdmin } = require("../middleware/authMiddleware");
const Course = require("../models/course");
const User = require("../models/user");
const path = require("path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admin only." });
    }
};

// Apply admin middleware to all routes
router.use(isAdmin);

// Admin Dashboard
router.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Get all courses
router.get("/courses", async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: "Error fetching courses" });
    }
});

// Get single course
router.get("/courses/:id", async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: "Error fetching course" });
    }
});

// Add new course
router.post("/add-course", async (req, res) => {
    try {
        const { courseName, courseCode, description, scheduleDays, scheduleTime, prerequisites, maxSeats } = req.body;
        
        // Validate required fields
        if (!courseName || !courseCode || !scheduleDays || !scheduleTime) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        // Check if course code already exists
        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(400).json({ error: "Course code already exists" });
        }

        // Ensure maxSeats is a number
        const seats = maxSeats ? parseInt(maxSeats) : 30;
        
        // Create new course
        const course = new Course({
            courseName,
            courseCode,
            description: description || "",
            scheduleDays: Array.isArray(scheduleDays) ? scheduleDays : [scheduleDays],
            scheduleTime,
            prerequisites: Array.isArray(prerequisites) ? prerequisites : (prerequisites ? [prerequisites] : []),
            maxSeats: seats
        });

        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error("Add course error:", error);
        res.status(500).json({ error: "Error adding course" });
    }
});

// Update course
router.put("/courses/:id", async (req, res) => {
    try {
        const { courseName, courseCode, description, scheduleDays, scheduleTime, prerequisites, maxSeats } = req.body;
        
        // Validate required fields
        if (!courseName || !courseCode || !scheduleDays || !scheduleTime) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        // Check if course code already exists (but not this course)
        const existingCourse = await Course.findOne({ courseCode, _id: { $ne: req.params.id } });
        if (existingCourse) {
            return res.status(400).json({ error: "Course code already exists" });
        }

        // Ensure maxSeats is a number
        const seats = maxSeats ? parseInt(maxSeats) : 30;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            {
                courseName,
                courseCode,
                description: description || "",
                scheduleDays: Array.isArray(scheduleDays) ? scheduleDays : [scheduleDays],
                scheduleTime,
                prerequisites: Array.isArray(prerequisites) ? prerequisites : (prerequisites ? [prerequisites] : []),
                maxSeats: seats
            },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.json(course);
    } catch (error) {
        console.error("Update course error:", error);
        res.status(500).json({ error: "Error updating course" });
    }
});

// Delete course
router.delete("/courses/:id", async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting course" });
    }
});

// Get all students
router.get("/students", async (req, res) => {
    try {
        // Fetch all students
        const students = await User.find({ role: "student" }).populate('courses');
        
        // Transform data for the frontend
        const studentsWithDetails = students.map(student => {
            const studentObj = student.toObject();
            
            // Format course details 
            const courseDetails = student.courses.map(course => {
                return {
                    _id: course._id.toString(),
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    scheduleTime: course.scheduleTime,
                    scheduleDays: course.scheduleDays
                };
            });

            // Return only necessary fields
            return {
                _id: studentObj._id.toString(),
                name: studentObj.name,
                rollNumber: studentObj.rollNumber,
                role: studentObj.role,
                courseDetails: courseDetails
            };
        });

        console.log(`Fetched ${studentsWithDetails.length} students successfully`);
        res.json(studentsWithDetails);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: "Error fetching students" });
    }
});

// Override course registration
router.post("/override-registration", async (req, res) => {
    try {
        const { studentId, courseId, reason } = req.body;

        if (!studentId || !courseId || !reason) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        console.log(`Override registration: Student ${studentId}, Course ${courseId}, Reason: ${reason}`);

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: "Invalid student or course ID" });
        }

        // Find the student
        const student = await User.findById(studentId);
        if (!student) {
            console.log(`Student not found: ${studentId}`);
            return res.status(404).json({ error: "Student not found" });
        }

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            console.log(`Course not found: ${courseId}`);
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if student is already registered for the course
        if (student.courses.some(id => id.toString() === courseId)) {
            console.log(`Student already registered for course: ${courseId}`);
            return res.status(400).json({ error: "Student is already registered for this course" });
        }

        // Add course to student's courses array
        student.courses.push(new mongoose.Types.ObjectId(courseId));
        await student.save();
        console.log(`Course ${courseId} added to student ${studentId}`);

        // Get updated student data with course details
        const updatedStudent = await User.findById(studentId).populate('courses');
        
        // Transform for response
        const studentObj = updatedStudent.toObject();
        const courseDetails = updatedStudent.courses.map(course => ({
            _id: course._id.toString(),
            courseCode: course.courseCode,
            courseName: course.courseName,
            scheduleTime: course.scheduleTime,
            scheduleDays: course.scheduleDays
        }));

        res.json({
            message: "Course registration overridden successfully",
            student: {
                _id: studentObj._id.toString(),
                name: studentObj.name,
                rollNumber: studentObj.rollNumber,
                role: studentObj.role,
                courseDetails: courseDetails
            }
        });
    } catch (error) {
        console.error("Error overriding course registration:", error);
        res.status(500).json({ error: "Error overriding course registration" });
    }
});

// Get enrollment report for a specific course
router.get("/reports/enrollment/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;

        // Validate course ID
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: "Invalid course ID" });
        }

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Find students enrolled in this course
        const enrolledStudents = await User.find({
            role: "student",
            courses: courseId
        }).select("name rollNumber");

        // Format response
        res.json({
            course: {
                _id: course._id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                maxSeats: course.maxSeats || 30
            },
            enrolledCount: enrolledStudents.length,
            students: enrolledStudents
        });
    } catch (error) {
        console.error("Error generating enrollment report:", error);
        res.status(500).json({ error: "Error generating enrollment report" });
    }
});

// Get available seats report for all courses
router.get("/reports/available-seats", async (req, res) => {
    try {
        // Get all courses
        const courses = await Course.find();
        
        // Get enrollment counts
        const enrollmentCounts = await User.aggregate([
            { $match: { role: "student" } },
            { $unwind: "$courses" },
            { $group: { _id: "$courses", count: { $sum: 1 } } }
        ]);
        
        // Create a map of course ID to enrollment count
        const enrollmentMap = {};
        enrollmentCounts.forEach(item => {
            enrollmentMap[item._id.toString()] = item.count;
        });
        
        // Format course data with availability information
        const coursesWithAvailability = courses.map(course => {
            const courseObj = course.toObject();
            const id = courseObj._id.toString();
            const enrolled = enrollmentMap[id] || 0;
            const maxSeats = course.maxSeats || 30;
            const availableSeats = maxSeats - enrolled;
            
            return {
                _id: id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                scheduleDays: course.scheduleDays,
                scheduleTime: course.scheduleTime,
                enrolled,
                maxSeats,
                availableSeats,
                availabilityPercentage: (availableSeats / maxSeats) * 100
            };
        });
        
        // Sort by availability (lowest first)
        coursesWithAvailability.sort((a, b) => a.availableSeats - b.availableSeats);
        
        res.json(coursesWithAvailability);
    } catch (error) {
        console.error("Error generating available seats report:", error);
        res.status(500).json({ error: "Error generating available seats report" });
    }
});

// Get missing prerequisites report
router.get("/reports/missing-prerequisites", async (req, res) => {
    try {
        // Get all students with their courses
        const students = await User.find({ role: "student" }).populate('courses');
        
        // Get all courses with prerequisites
        const coursesWithPrereqs = await Course.find({
            prerequisites: { $exists: true, $ne: [] }
        });
        
        // Track students with missing prerequisites
        const studentsWithIssues = [];
        
        // Check each student
        for (const student of students) {
            const issues = [];
            
            // Skip if student has no courses
            if (!student.courses || student.courses.length === 0) {
                continue;
            }
            
            // Get all enrolled course codes
            const enrolledCourseCodes = student.courses.map(c => c.courseCode);
            
            // Check each course for missing prerequisites
            for (const enrolledCourse of student.courses) {
                // Find course in our prereqs list
                const courseWithPrereqs = coursesWithPrereqs.find(c => 
                    c._id.toString() === enrolledCourse._id.toString()
                );
                
                // Skip if course has no prerequisites
                if (!courseWithPrereqs || !courseWithPrereqs.prerequisites || courseWithPrereqs.prerequisites.length === 0) {
                    continue;
                }
                
                // Check for missing prerequisites
                const missingPrereqs = courseWithPrereqs.prerequisites.filter(prereq => 
                    !enrolledCourseCodes.includes(prereq)
                );
                
                if (missingPrereqs.length > 0) {
                    issues.push({
                        course: {
                            _id: enrolledCourse._id,
                            courseName: enrolledCourse.courseName,
                            courseCode: enrolledCourse.courseCode
                        },
                        missingPrerequisites: missingPrereqs
                    });
                }
            }
            
            if (issues.length > 0) {
                studentsWithIssues.push({
                    student: {
                        _id: student._id,
                        name: student.name,
                        rollNumber: student.rollNumber
                    },
                    issues
                });
            }
        }
        
        res.json(studentsWithIssues);
    } catch (error) {
        console.error("Error generating missing prerequisites report:", error);
        res.status(500).json({ error: "Error generating missing prerequisites report" });
    }
});

module.exports = router;
