// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    // Require authentication and admin role
    if (!requireAuth()) return;
    if (!requireRole('admin')) return;
    
    // Load users data
    loadUsers();
    
    // Set up search functionality
    document.getElementById('search-users').addEventListener('input', function(e) {
        // In a real implementation, this would filter the users
        console.log('Search term:', e.target.value);
    });
});

// Load users data
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        
        // In a real implementation, this would fetch users from the server
        // For now, we'll show a placeholder
        const usersTableBody = document.getElementById('users-table-body');
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No users found. When people register, they will appear here.
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    Error loading users. Please try again later.
                </td>
            </tr>
        `;
    }
}