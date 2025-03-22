const mongoose = require("mongoose");
const User = require("./models/user");
const Course = require("./models/course");
const bcrypt = require("bcrypt");
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

// Dummy courses data
const courses = [
    {
        courseName: "Mathematics 101",
        courseCode: "MATH101",
        description: "Introduction to Calculus and Algebra",
        scheduleDays: ["Monday", "Wednesday"],
        scheduleTime: "10:00-12:00",
        prerequisites: []
    },
    {
        courseName: "Physics 101",
        courseCode: "PHYS101",
        description: "Introduction to Mechanics and Thermodynamics",
        scheduleDays: ["Tuesday", "Thursday"],
        scheduleTime: "14:00-16:00",
        prerequisites: []
    },
    {
        courseName: "Computer Science 101",
        courseCode: "CS101",
        description: "Introduction to Programming",
        scheduleDays: ["Monday", "Friday"],
        scheduleTime: "09:00-11:00",
        prerequisites: []
    },
    {
        courseName: "Database Systems",
        courseCode: "CS301",
        description: "Advanced Database Management Systems",
        scheduleDays: ["Wednesday", "Friday"],
        scheduleTime: "13:00-15:00",
        prerequisites: ["CS101"]
    },
    {
        courseName: "Web Development",
        courseCode: "CS305",
        description: "Full Stack Web Development",
        scheduleDays: ["Tuesday", "Thursday"],
        scheduleTime: "15:00-17:00",
        prerequisites: ["CS101"]
    }
];

// Dummy admin users data
const adminUsers = [
    {
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        name: "Admin User",
        role: "admin",
        courses: [] // Admins don't have courses
    },
    {
        username: "sysadmin",
        email: "sysadmin@example.com",
        password: "admin123",
        name: "System Administrator",
        role: "admin",
        courses: [] // Admins don't have courses
    }
];

// Dummy student users with course registrations (to be updated with actual course IDs)
const studentUsers = [
    {
        rollNumber: "S12345",
        email: "john.doe@example.com",
        password: "student123",
        name: "John Doe",
        role: "student",
        // Courses will be populated with ObjectIds later
        coursesToRegister: ["MATH101", "PHYS101"]
    },
    {
        rollNumber: "S12346",
        email: "jane.smith@example.com",
        password: "student123",
        name: "Jane Smith",
        role: "student",
        coursesToRegister: ["CS101", "MATH101"]
    },
    {
        rollNumber: "S12347",
        email: "bob.johnson@example.com",
        password: "student123",
        name: "Bob Johnson",
        role: "student",
        coursesToRegister: ["CS301", "CS305", "PHYS101"]
    },
    {
        rollNumber: "S12348",
        email: "sarah.lee@example.com",
        password: "student123",
        name: "Sarah Lee",
        role: "student",
        coursesToRegister: []
    },
    {
        rollNumber: "S12349",
        email: "michael.brown@example.com",
        password: "student123",
        name: "Michael Brown",
        role: "student",
        coursesToRegister: ["CS101", "CS305"]
    }
];

// Hash passwords
async function hashPasswords() {
    // Hash admin passwords
    for (let admin of adminUsers) {
        admin.password = await bcrypt.hash(admin.password, 10);
    }
    
    // Hash student passwords
    for (let student of studentUsers) {
        student.password = await bcrypt.hash(student.password, 10);
    }
}

// Seed database
async function seedDatabase() {
    try {
        // Hash all passwords
        await hashPasswords();
        
        // Clear existing data
        await Course.deleteMany({});
        await User.deleteMany({});
        
        // Insert courses
        const insertedCourses = await Course.insertMany(courses);
        console.log(`${insertedCourses.length} courses inserted successfully`);
        
        // Create a mapping of course codes to course ObjectIds
        const courseCodeToId = {};
        insertedCourses.forEach(course => {
            courseCodeToId[course.courseCode] = course._id;
        });
        
        // Insert admin users
        const insertedAdmins = await User.insertMany(adminUsers);
        console.log(`${insertedAdmins.length} admin users inserted successfully`);
        
        // Map course codes to ObjectIds for each student
        for (let student of studentUsers) {
            student.courses = student.coursesToRegister.map(courseCode => courseCodeToId[courseCode]);
            delete student.coursesToRegister; // Remove temporary property
        }
        
        // Insert student users
        const insertedStudents = await User.insertMany(studentUsers);
        console.log(`${insertedStudents.length} student users inserted successfully`);
        
        console.log("Database seeded successfully with courses, admin users, and students");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seed function
seedDatabase();
