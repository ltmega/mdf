// profile.js - Handles seller profile functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and seller role
    if (!requireAuth()) return;
    if (!requireRole('seller')) return;
    
    // Load seller profile data
    loadSellerProfile();
    
    // Set up event listeners
    document.getElementById('edit-profile-btn').addEventListener('click', enableEditing);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEditing);
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
    document.getElementById('change-pic-btn').addEventListener('click', () => {
        document.getElementById('profile-pic-input').click();
    });
    document.getElementById('profile-pic-input').addEventListener('change', handleProfilePicChange);
});

// Check if user is logged in
function requireAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        window.location.href = '../public/html/login.html';
        return false;
    }
    return true;
}

// Check if user is a seller
function requireRole(requiredRole) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user.user_role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        switch(user.user_role) {
            case 'admin':
                window.location.href = '../admin/html/admin-dashboard.html';
                break;
            case 'customer':
            default:
                window.location.href = '../public/html/products.html';
        }
        return false;
    }
    return true;
}

// Load seller profile data
async function loadSellerProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        // Populate basic profile info
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.user_role;
        document.getElementById('member-status').value = user.membership_status || 'Active';
        
        // Set profile picture
        let imagePath = user.profile_picture_url || "/uploads/icon.png";
        if (!imagePath.startsWith("/uploads/")) {
            imagePath = `/uploads/${imagePath}`;
        }
        document.getElementById('profile-pic').src = imagePath;
        document.getElementById('header-profile-pic').src = imagePath;
        
        // Load seller-specific data
        await loadSellerData(token, user.user_id);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load seller-specific data
async function loadSellerData(token, userId) {
    try {
        // Load store details (this would come from a seller profile API)
        // For now, we'll use placeholder data
        document.getElementById('store-name').textContent = 'My Chicken Store';
        document.getElementById('store-description').textContent = 'Premium quality chicken products';
        
        // Load total products
        const productsResponse = await fetch(`http://localhost:5000/api/products/seller/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('total-products').textContent = products.length;
        }
        
        // Load total sales and orders
        let orders = []; // Define orders variable in the correct scope
        const ordersResponse = await fetch('http://localhost:5000/api/orders/seller', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            orders = await ordersResponse.json();
            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            document.getElementById('total-sales').textContent = `UGX ${totalSales.toFixed(2)}`;
        }
        
        // Load order history
        displayOrderHistory(orders);
    } catch (error) {
        console.error('Error loading seller data:', error);
    }
}

// Display order history
function displayOrderHistory(orders) {
    const orderHistoryContainer = document.getElementById('order-history');
    
    if (orders.length === 0) {
        orderHistoryContainer.innerHTML = '<p class="text-gray-600 text-center">No orders found.</p>';
        return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    
    // Display last 5 orders
    const recentOrders = orders.slice(0, 5);
    
    orderHistoryContainer.innerHTML = recentOrders.map(order => `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold">Order #${order.order_id}</h3>
                    <p class="text-sm text-gray-600">Date: ${new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold">UGX ${order.total_amount}</p>
                    <span class="inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}">${order.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Enable profile editing
function enableEditing() {
    document.getElementById('username').disabled = false;
    document.getElementById('email').disabled = false;
    // Note: We don't allow editing role or membership status
    
    document.getElementById('edit-profile-btn').classList.add('hidden');
    document.getElementById('edit-actions').classList.remove('hidden');
}

// Cancel profile editing
function cancelEditing() {
    // Reset form values to original
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    
    // Disable fields
    document.getElementById('username').disabled = true;
    document.getElementById('email').disabled = true;
    
    document.getElementById('edit-profile-btn').classList.remove('hidden');
    document.getElementById('edit-actions').classList.add('hidden');
}

// Save profile changes
async function saveProfile(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const updatedData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value
        };
        
        const response = await fetch(`http://localhost:5000/api/users/${user.user_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const updatedUser = await response.json();
        
        // Update local storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Disable fields
        document.getElementById('username').disabled = true;
        document.getElementById('email').disabled = true;
        
        document.getElementById('edit-profile-btn').classList.remove('hidden');
        document.getElementById('edit-actions').classList.add('hidden');
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message || 'Error updating profile');
    }
}

// Handle profile picture change
async function handleProfilePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const formData = new FormData();
        formData.append('profile_pic', file);
        
        // Fix: Use the correct endpoint for profile picture upload
        const response = await fetch(`http://localhost:5000/api/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            // Try to parse error response
            let errorMessage = 'Failed to update profile picture';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If parsing fails, use the response text
                errorMessage = await response.text();
            }
            throw new Error(errorMessage);
        }
        
        // After successful upload, get updated user data
        const updatedUserResponse = await fetch(`http://localhost:5000/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!updatedUserResponse.ok) {
            throw new Error('Failed to fetch updated profile data');
        }
        
        const updatedUser = await updatedUserResponse.json();
        
        // Update local storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update profile pictures
        let imagePath = updatedUser.profile_picture_url || "/uploads/icon.png";
        if (!imagePath.startsWith("/uploads/")) {
            imagePath = `/uploads/${imagePath}`;
        }
        document.getElementById('profile-pic').src = imagePath;
        document.getElementById('header-profile-pic').src = imagePath;
        
        alert('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error updating profile picture:', error);
        alert(error.message || 'Error updating profile picture');
    }
}

// Helper function for order status colors
function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}