  // Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Check if user is logged in
    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update UI with user info
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-link').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('login-register-link').classList.add('hidden');
    
    // Set up logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    
    // Load orders
    loadOrders();
});

// Load orders for this user
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/orders/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        const ordersTableBody = document.getElementById('orders-table-body');
        
        if (orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        You haven't placed any orders yet.
                    </td>
                </tr>
            `;
            return;
        }
        
        // Display orders
        ordersTableBody.innerHTML = orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.order_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.order_date).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₵${order.total_amount}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button class="text-blue-500 hover:text-blue-700" onclick="viewOrderDetails(${order.order_id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
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

// View order details
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order items');
        }
        
        const items = await response.json();
        
        // Create modal content
        let modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold mb-4">Order #${orderId} Details</h3>
                    <div class="space-y-3">
        `;
        
        items.forEach(item => {
            modalContent += `
                <div class="flex justify-between items-center border-b pb-2">
                    <div>
                        <h4 class="font-medium">${item.product_name}</h4>
                        <p class="text-gray-600 text-sm">Quantity: ${item.quantity}</p>
                    </div>
                    <p class="font-semibold">₵${(item.price_at_time_of_order * item.quantity).toFixed(2)}</p>
                </div>
            `;
        });
        
        modalContent += `
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button class="bg-gray-500 text-white px-4 py-2 rounded-md" onclick="closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalContent);
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Error loading order details. Please try again later.');
    }
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}