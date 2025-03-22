// Function to highlight the current page in the navbar
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath || 
            (linkPath !== '/' && currentPath.includes(linkPath))) {
            link.classList.add('active');
            link.style.color = '#3498db';
        }
    });
});

// Function to handle logout
function logout() {
    fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
    });
} 