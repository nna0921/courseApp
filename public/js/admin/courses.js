export async function addCourse(courseData) {
    const response = await fetch("/admin/add-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
    });

    const result = await response.json();
    showMessage(result.message);
}
