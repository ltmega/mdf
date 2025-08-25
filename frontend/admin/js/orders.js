// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    // Require authentication and admin role
    if (!requireAuth()) return;
    if (!requireRole('admin')) return;
    
    // Load orders data
    loadOrders();
    
    // Set up search functionality
    document.getElementById('search-orders').addEventListener('input', function(e) {
        filterOrders(e.target.value);
    });
});

// Load orders data
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/orders/admin', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    Error loading orders. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Display orders in the table
function displayOrders(orders) {
    const ordersTableBody = document.getElementById('orders-table-body');
    
    if (orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No orders found.
                </td>
            </tr>
        `;
        return;
    }
    
    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.order_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer_name || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.order_date).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">UGX ${order.total_amount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${order.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="viewOrderDetails(${order.order_id})">View</button>
                <button class="text-red-600 hover:text-red-900" onclick="updateOrderStatus(${order.order_id})">Update</button>
            </td>
        </tr>
    `).join('');
}

// Filter orders based on search term
function filterOrders(searchTerm) {
    const rows = document.querySelectorAll('#orders-table-body tr');
    
    rows.forEach(row => {
        if (row.querySelector('td[colspan]')) return; // Skip placeholder rows
        
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// View order details
function viewOrderDetails(orderId) {
    alert(`Viewing details for order #${orderId}. In a complete implementation, this would show the order items.`);
}

// Update order status
function updateOrderStatus(orderId) {
    const newStatus = prompt('Enter new status (pending, processing, shipped, delivered, cancelled):');
    
    if (!newStatus) return;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
        alert('Invalid status. Please enter one of: pending, processing, shipped, delivered, cancelled');
        return;
    }
    
    updateOrderStatusAPI(orderId, newStatus);
}

// Update order status API call
async function updateOrderStatusAPI(orderId, status) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update order status');
        }
        
        alert('Order status updated successfully!');
        loadOrders(); // Reload orders to show updated status
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status. Please try again later.');
    }
}