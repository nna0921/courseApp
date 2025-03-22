async function studentLogin() {
    const rollNumber = document.getElementById("studentRollNumber").value;
    
    if (!rollNumber) {
        alert("Please enter your roll number");
        return;
    }
    
    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                rollNumber: rollNumber, // Using explicit rollNumber field
                password: "student123", // Default password for students
                role: "student"
            })
        });

        const result = await response.json();
        if (response.ok) {
            window.location.href = "/student/dashboard";
        } else {
            alert(result.error || "Login failed. Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
    }
}

async function adminLogin() {
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            username,
            password,
            role: "admin"
        })
    });

    const result = await response.json();
    if (response.ok) {
        window.location.href = "/admin.html";
    } else {
        alert(result.error);
    }
}
