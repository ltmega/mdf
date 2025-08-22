// Function to check if user is logged in and update navigation accordingly
function updateNavigation() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user && token) {
        // User is logged in
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../public/html/login.html';
            });
        }
    }
}

// Function to check if user is logged in and redirect if not
function requireAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        window.location.href = '../public/html/login.html';
        return false;
    }
    return true;
}

// Function to check user role and redirect if not authorized
function requireRole(requiredRole) {
    if (!requireAuth()) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        switch(user.role) {
            case 'admin':
                // Already on admin page
                break;
            case 'seller':
                window.location.href = '../../public/html/seller-dashboard.html';
                break;
            case 'customer':
            default:
                window.location.href = '../../public/html/products.html';
        }
        return false;
    }
    return true;
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', updateNavigation);