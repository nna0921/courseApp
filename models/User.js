const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    rollNumber: { type: String, unique: true, sparse: true }, // For students
    username: { type: String, unique: true, sparse: true }, // For admins
    password: { type: String, required: function() { return this.role === "admin"; } }, // Only required for admins
    name: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

// Hash password before saving (for admins)
userSchema.pre("save", async function (next) {
    if (this.password && this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model("User", userSchema); 