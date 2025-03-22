document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("addCourseBtn").addEventListener("click", addCourse);
    document.getElementById("updateCourseBtn").addEventListener("click", updateCourse);
    document.getElementById("deleteCourseBtn").addEventListener("click", deleteCourse);

    document.getElementById("toggleFormBtn").addEventListener("click", function() {
        const courseForm = document.getElementById("courseForm");
        if (courseForm.style.display === "none") {
            courseForm.style.display = "block";
        } else {
            courseForm.style.display = "none";
        }
    });
});

async function addCourse() {
    const courseName = document.getElementById("courseName").value;
    const courseCode = document.getElementById("courseCode").value;
    const courseDescription = document.getElementById("courseDescription").value;
    try {
        const response = await fetch("/admin/add-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseName, courseCode, description: courseDescription })
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
            displayCourses(); // Refresh course list
        }
    } catch (error) {
        console.error("Error adding course:", error);
    }
}

console.log("Fetching courses...");

async function displayCourses() {
    const courseList = document.getElementById("courseList");
    courseList.innerHTML = ""; // Clear existing courses
    try {
        const response = await fetch("/admin/courses");
        console.log("Response status:", response.status);
        const courses = await response.json();
        console.log("Courses fetched:", courses);
        courses.forEach(course => {
            const courseCard = document.createElement("div");
            courseCard.className = "course-card";
            courseCard.innerHTML = `
                <h4>${course.courseName}</h4>
                <p><strong>Code:</strong> ${course.courseCode}</p>
                <p><strong>Description:</strong> ${course.description}</p>
            `;
            courseList.appendChild(courseCard);
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
    }
}

async function deleteCourse() {
    const courseId = document.getElementById("courseId").value; // Assuming you have an input for course ID
    try {
        const response = await fetch(`/admin/delete-course/${courseId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            alert("Course deleted successfully");
            displayCourses(); // Refresh course list
        } else {
            alert("Error deleting course");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error deleting course");
    }
}

function updateCourse() {
    // Add logic to update a course
    console.log("Update course functionality not yet implemented.");
}

document.addEventListener("DOMContentLoaded", function() {
    displayCourses(); // Initial display
});
