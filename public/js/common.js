export function showMessage(message) {
    alert(message);
}

export function redirectToDashboard(role) {
    window.location.href = "/dashboard.html?role=" + role;
}

export function logout() {
    fetch("/auth/logout")
        .then(() => {
            window.location.href = "/index.html";
        });
}
