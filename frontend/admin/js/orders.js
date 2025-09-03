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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.buyer_name || 'N/A'}</td>
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
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch order details
        const orderResponse = await fetch(`http://localhost:5000/api/orders/admin`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        const orders = await orderResponse.json();
        const order = orders.find(o => o.order_id == orderId);
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Fetch order items
        const itemsResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/items`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!itemsResponse.ok) {
            throw new Error('Failed to fetch order items');
        }
        
        const items = await itemsResponse.json();
        
        // Create a detailed view
        let itemsHtml = '';
        if (items && items.length > 0) {
            itemsHtml = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${items.map(item => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.product_name || 'Unknown Product'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.quantity}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">UGX ${item.price_at_time_of_order}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">UGX ${item.quantity * item.price_at_time_of_order}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            itemsHtml = '<p class="text-gray-500">No items found for this order.</p>';
        }
        
        // Show order details in a modal or alert
        const orderDetails = `
            <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">Order #${orderId} Details</h3>
                <p><strong>Customer:</strong> ${order.buyer_name || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Total Amount:</strong> UGX ${order.total_amount}</p>
                <p><strong>Delivery Address:</strong> ${order.delivery_address || 'N/A'}</p>
                <h4 class="text-md font-semibold mt-4 mb-2">Items:</h4>
                ${itemsHtml}
            </div>
        `;
        
        // Create a simple modal
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold">Order Details</h2>
                        <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    ${orderDetails}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside
        modal.querySelector('.bg-black').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.bg-black')) {
                document.body.removeChild(modal);
            }
        });
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('Error viewing order details. Please try again later.');
    }
}

// Update order status
function updateOrderStatus(orderId) {
    const newStatus = prompt('Enter new status (pending, confirmed, shipped, delivered, cancelled):');
    
    if (!newStatus) return;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
        alert('Invalid status. Please enter one of: pending, confirmed, shipped, delivered, cancelled');
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