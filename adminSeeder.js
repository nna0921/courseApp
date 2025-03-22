const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();
const connectDB = require("./config/db");

async function createAdmin() {
    await connectDB();

    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
        console.log("Admin already exists.");
        return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new User({
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        role: "admin"
    });

    await admin.save();
    console.log("Admin user created successfully.");
    mongoose.connection.close();
}

createAdmin();
