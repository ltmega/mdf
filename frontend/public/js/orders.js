document.addEventListener("DOMContentLoaded", async () => {
  const ordersList = document.getElementById("ordersList");
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    window.location.href = "login.html";
    return;
  }

  // Check if ordersList element exists
  if (!ordersList) {
    console.error('Orders list element not found');
    return;
  }

  try {
    const API_BASE = "http://localhost:5000";
    
    // Get orders based on user role
    let endpoint;
    if (user.user_role === "admin") {
      endpoint = `${API_BASE}/api/orders/admin`;
    } else if (user.user_role === "seller") {
      endpoint = `${API_BASE}/api/orders/seller`;
    } else {
      endpoint = `${API_BASE}/api/orders/user`;
    }

    const response = await fetch(endpoint, {
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
    if (ordersList) {
      ordersList.innerHTML = `
        <div class="text-center text-red-500">
          <p>Error loading orders. Please try again later.</p>
        </div>
      `;
    }
  }
});

function displayOrders(orders) {
  const ordersList = document.getElementById("ordersList");
  
  // Check if ordersList element exists
  if (!ordersList) {
    console.error('Orders list element not found');
    return;
  }
  
  if (orders.length === 0) {
    ordersList.innerHTML = `
      <div class="text-center text-gray-500">
        <p>No orders found.</p>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders.map(order => `
    <div class="bg-white p-6 rounded-lg shadow-md mb-4">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Order #${order.order_id}</h3>
          <p class="text-sm text-gray-600">Date: ${new Date(order.order_date).toLocaleDateString()}</p>
          <p class="text-sm text-gray-600">Status: <span class="font-medium ${getStatusColor(order.status)}">${order.status}</span></p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-orange-600">UGX ${order.total_amount}</p>
        </div>
      </div>
      
      <div class="border-t pt-4">
        <p class="text-sm text-gray-700 mb-2"><strong>Delivery Address:</strong></p>
        <p class="text-sm text-gray-600 mb-4">${order.delivery_address}</p>
        
        <div class="bg-gray-50 p-3 rounded">
          <p class="text-sm text-gray-700 mb-2"><strong>Order Items:</strong></p>
          <div class="space-y-2">
            ${getOrderItemsHTML(order)}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function getOrderItemsHTML(order) {
  // For now, we'll show a placeholder since order items are stored separately
  // In a full implementation, you'd fetch order items or include them in the order response
  return `
    <div class="text-sm text-gray-600">
      <p>Order contains ${order.items_count || 1} item(s)</p>
      <p>Total: UGX ${order.total_amount}</p>
    </div>
  `;
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'text-yellow-600';
    case 'confirmed': return 'text-blue-600';
    case 'delivered': return 'text-green-600';
    case 'cancelled': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

