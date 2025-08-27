document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token) {
    window.location.href = '../../public/html/login.html';
    return;
  }

  if (user.user_role !== 'admin') {
    switch (user.user_role) {
      case 'seller':
        window.location.href = '../../seller/seller-dashboard.html';
        break;
      case 'buyer':
      default:
        window.location.href = '../../public/html/index.html';
    }
    return;
  }

  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../public/html/login.html';
  });

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
    const ordersResponse = await fetch('http://localhost:5000/api/orders/admin', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (ordersResponse.ok) {
      const orders = await ordersResponse.json();
      document.getElementById('total-orders').textContent = orders.length;
    }

    const productsResponse = await fetch('http://localhost:5000/api/products', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (productsResponse.ok) {
      const products = await productsResponse.json();
      document.getElementById('total-products').textContent = products.length;
    }

    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      document.getElementById('total-users').textContent = users.length;
    }

    const recipesResponse = await fetch('http://localhost:5000/api/recipes', {
      headers: { Authorization: `Bearer ${token}` },
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
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.product_id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.quantity}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total_price}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(order.order_date).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent orders:', error);
  }
}

async function loadProducts(token) {
  try {
    const response = await fetch('http://localhost:5000/api/products', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const products = await response.json();
    const productsTableBody = document.getElementById('products-table-body');

    if (products.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            No products found. Add new products to display them here.
          </td>
        </tr>
      `;
      return;
    }

    productsTableBody.innerHTML = products.map(product => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.product_id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.category}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <button class="text-red-600 hover:text-red-900" onclick="deleteProduct(${product.product_id})">
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function loadUsers(token) {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const users = await response.json();
    const usersTableBody = document.getElementById('users-table-body');

    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-4 text-center text-gray-500">
            No users found. When users register, they will appear here.
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.user_id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.user_role}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading users:', error);
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