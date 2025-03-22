export async function registerCourse(courseId) {
    const response = await fetch("/student/register-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
    });

    const result = await response.json();
    showMessage(result.message);
}
