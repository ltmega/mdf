// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Check if user is logged in
    if (!user || !token) {
        window.location.href = '../../public/html/login.html';
        return;
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
        // Redirect to appropriate dashboard based on role
        switch(user.role) {
            case 'seller':
                window.location.href = '../../public/html/seller-dashboard.html';
                break;
            case 'customer':
            default:
                window.location.href = '../../public/html/products.html';
        }
        return;
    }
    
    // Set up logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../../public/html/login.html';
    });
    
    // Load dashboard data
    loadDashboardData();
});

// Load dashboard data (stats, orders, products, users)
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Load stats
        loadStats();
        
        // Load recent orders
        await loadRecentOrders(token);
        
        // Load products
        await loadProducts(token);
        
        // Load users
        await loadUsers(token);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load dashboard stats
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch total orders
        // For now, we'll show placeholder values
        document.getElementById('total-orders').textContent = '0';
        
        // Fetch total products
        const productsResponse = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('total-products').textContent = products.length;
        }
        
        // Fetch total users
        // For now, we'll show placeholder values
        document.getElementById('total-users').textContent = '0';
        
        // Fetch total recipes
        // For now, we'll show placeholder values
        document.getElementById('total-recipes').textContent = '0';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders(token) {
    try {
        // For now, we'll show a placeholder since we don't have orders endpoint yet
        // In a complete implementation, this would fetch recent orders from the server
        const ordersTableBody = document.getElementById('orders-table-body');
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No recent orders. When customers place orders, they will appear here.
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    Error loading orders. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Load products
async function loadProducts(token) {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        const productsContainer = document.getElementById('manage-products');
        
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-span-full text-center text-gray-500">
                    <p>No products found. When sellers add products, they will appear here.</p>
                </div>
            `;
            return;
        }
        
        // Display products
        productsContainer.innerHTML = products.map(product => `
            <div class="border rounded-lg p-4 shadow-sm">
                <img src="/uploads/${product.product_image_url}" alt="${product.product_name}" class="w-full h-48 object-cover rounded-md mb-4">
                <h3 class="text-lg font-semibold mb-2">${product.product_name}</h3>
                <p class="text-gray-600 mb-2">${product.description || 'No description available'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-orange-500 font-bold">₵${product.price_per_unit}/${product.unit}</span>
                    <span class="text-gray-500">Qty: ${product.available_quantity}</span>
                </div>
                <div class="mt-4 flex justify-end">
                    <button class="text-red-500 hover:text-red-700" onclick="deleteProduct(${product.product_id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('manage-products').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading products. Please try again later.</p>
            </div>
        `;
    }
}

// Load users
async function loadUsers(token) {
    try {
        // For now, we'll show a placeholder since we don't have users endpoint yet
        // In a complete implementation, this would fetch users from the server
        const usersTableBody = document.getElementById('users-table-body');
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No users found. When people register, they will appear here.
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    Error loading users. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Delete product function
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Product deleted successfully!');
            // Reload dashboard data
            loadDashboardData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product.');
    }
}