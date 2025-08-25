document.addEventListener('DOMContentLoaded', function() {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Check if user is logged in
  if (!user || !token) {
    window.location.href = '../../public/html/login.html';
    return;
  }

  // ✅ Correct role check
  if (user.user_role !== 'admin') {
    switch(user.user_role) {
      case 'seller':
        window.location.href = '../../public/html/seller-dashboard.html';
        break;
      case 'buyer':
      default:
        window.location.href = '../../public/html/index.html';
    }
    return;
  }

  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../public/html/login.html';
  });

  // Load dashboard data
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const token = localStorage.getItem('token');
    await loadStats(token);
    await loadRecentOrders(token);
    await loadProducts(token);
    await loadUsers(token);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadStats(token) {
  try {
    // Load total orders
    const ordersResponse = await fetch('http://localhost:5000/api/orders/admin', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      document.getElementById('total-orders').textContent = orders.length;
    }

    // Load total products
    const productsResponse = await fetch('http://localhost:5000/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (productsResponse.ok) {
      const products = await productsResponse.json();
      document.getElementById('total-products').textContent = products.length;
    }

    // Load total users
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      document.getElementById('total-users').textContent = users.length;
    }

    // Load total recipes
    const recipesResponse = await fetch('http://localhost:5000/api/recipes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (recipesResponse.ok) {
      const recipes = await recipesResponse.json();
      document.getElementById('total-recipes').textContent = recipes.length;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecentOrders(token) {
  try {
    const response = await fetch('http://localhost:5000/api/orders/admin', {
      headers: { 'Authorization': `Bearer ${token}` }
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
            No recent orders. When customers place orders, they will appear here.
          </td>
        </tr>
      `;
      return;
    }

    // Show only the 5 most recent orders
    const recentOrders = orders.slice(0, 5);
    
    ordersTableBody.innerHTML = recentOrders.map(order => `
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
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent orders:', error);
    document.getElementById('orders-table-body').innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-4 text-center text-red-500">
          Error loading orders. Please try again later.
        </td>
      </tr>
    `;
  }
}

async function loadProducts(token) {
  try {
    const response = await fetch('http://localhost:5000/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch products');

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

    // Show only the 6 most recent products
    const recentProducts = products.slice(0, 6);
    
    productsContainer.innerHTML = recentProducts.map(product => `
      <div class="border rounded-lg p-4 shadow-sm">
        <img src="${product.product_image_url ? 'http://localhost:5000/uploads/' + product.product_image_url : '/uploads/icon.png'}" alt="${product.product_name}" class="w-full h-48 object-cover rounded-md mb-4">
        <h3 class="text-lg font-semibold mb-2">${product.product_name}</h3>
        <p class="text-gray-600 mb-2">${product.description || 'No description available'}</p>
        <div class="flex justify-between items-center">
          <span class="text-orange-500 font-bold">UGX ${product.price_per_unit}/${product.unit}</span>
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

async function loadUsers(token) {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const users = await response.json();
    const usersTableBody = document.getElementById('users-table-body');

    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            No users found. When people register, they will appear here.
          </td>
        </tr>
      `;
      return;
    }

    // Show only the 5 most recent users
    const recentUsers = users.slice(0, 5);
    
    usersTableBody.innerHTML = recentUsers.map(user => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.user_id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.username}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            ${user.user_role}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${user.is_member ? 'Member' : 'Non-Member'}
        </td>
      </tr>
    `).join('');
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

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok) {
      alert('Product deleted successfully!');
      loadDashboardData();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('An error occurred while deleting the product.');
  }
}