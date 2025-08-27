document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token) {
    window.location.href = '../../public/html/login.html';
    return;
  }

  if (user.user_role !== 'seller') {
    switch (user.user_role) {
      case 'admin':
        window.location.href = '../../admin/html/admin-dashboard.html';
        break;
      case 'buyer':
      default:
        window.location.href = '../../public/html/index.html';
    }
    return;
  }

  // Show seller-specific UI
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-link').classList.remove('hidden');
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('login-register-link').classList.add('hidden');

  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../public/html/login.html';
  });

  // Load dashboard data
  loadDashboardData();

  // Form handlers
  document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
  document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
});

// Tab switching
function showTab(tabName) {
    document.getElementById('products-tab').classList.add('hidden');
    document.getElementById('recipes-tab').classList.add('hidden');
    document.getElementById(tabName + '-tab').classList.remove('hidden');

    const buttons = document.querySelectorAll('[onclick^="showTab"]');
    buttons.forEach(button => {
        button.classList.remove('text-orange-500', 'font-semibold', 'border-b-2', 'border-orange-500');
        button.classList.add('text-gray-500', 'hover:text-orange-500');
    });

    const selectedButton = Array.from(buttons).find(button => button.textContent.toLowerCase().includes(tabName));
    if (selectedButton) {
        selectedButton.classList.remove('text-gray-500', 'hover:text-orange-500');
        selectedButton.classList.add('text-orange-500', 'font-semibold', 'border-b-2', 'border-orange-500');
    }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const token = localStorage.getItem('token');
    await loadProducts(token);
    await loadOrders(token);
    await updateStats();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Load seller products
async function loadProducts(token) {
  const user = JSON.parse(localStorage.getItem('user'));
  try {
    const response = await fetch(`http://localhost:5000/api/products/seller/${user.user_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch products');

    const products = await response.json();
    const container = document.getElementById('products-list');

    if (products.length === 0) {
      container.innerHTML = '<p>No products found.</p>';
      return;
    }

    container.innerHTML = products
      .map(
        (product) => `
      <div>
        <h3>${product.product_name}</h3>
        <p>${product.description}</p>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Load seller orders
async function loadOrders(token) {
    try {
        const response = await fetch('http://localhost:5000/api/orders/seller', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        const tbody = document.getElementById('orders-table-body');

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No orders yet. When customers purchase your products, they will appear here.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.order_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.order_date).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₵${order.total_amount}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ${order.status}
                    </span>
                </td>
            </tr>`).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    Error loading orders. Please try again later.
                </td>
            </tr>`;
    }
}

// Update dashboard stats
async function updateStats() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        const productsResponse = await fetch(`http://localhost:5000/api/products/seller/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('total-products').textContent = products.length;
        }

        const ordersResponse = await fetch('http://localhost:5000/api/orders/seller', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            const pendingOrders = orders.filter(order => order.status === 'pending').length;
            document.getElementById('pending-orders').textContent = pendingOrders;

            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
            document.getElementById('total-sales').textContent = `₵${totalSales.toFixed(2)}`;
            document.getElementById('total-orders').textContent = orders.length;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
        document.getElementById('total-products').textContent = '—';
        document.getElementById('total-orders').textContent = '—';
        document.getElementById('pending-orders').textContent = '—';
        document.getElementById('total-sales').textContent = 'UGX 0.00';
    }
}

// Handle adding a new product
async function handleAddProduct(e) {
    e.preventDefault();

    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productUnit = document.getElementById('product-unit').value;
    const productQuantity = document.getElementById('product-quantity').value;
    const productDescription = document.getElementById('product-description').value;
    const productImage = document.getElementById('product-image').files[0];

    if (!productName || !productPrice || !productUnit || !productQuantity || !productImage) {
        alert('Please fill in all required fields.');
        return;
    }

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', productDescription);
    formData.append('price_per_unit', productPrice);
    formData.append('unit', productUnit);
    formData.append('available_quantity', productQuantity);
    formData.append('image', productImage);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Product added successfully!');
            document.getElementById('add-product-form').reset();
            loadDashboardData();
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('An error occurred while adding the product.');
    }
}