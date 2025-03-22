const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    courseCode: { type: String, unique: true, required: true },
    description: { type: String },
    scheduleDays: { type: [String], required: true }, // e.g., ['Monday', 'Wednesday']
    scheduleTime: { type: String, required: true }, // e.g., '10:00-12:00'
    prerequisites: { type: [String], default: [] }, // Array of course codes that are prerequisites
    maxSeats: { type: Number, default: 30 } // Default maximum seats
});

module.exports = mongoose.model("Course", courseSchema);
