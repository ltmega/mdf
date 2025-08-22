// Check if user is logged in and is a seller
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Check if user is logged in
    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is a seller
    if (user.role !== 'seller') {
        // Redirect to appropriate dashboard based on role
        switch(user.role) {
            case 'admin':
                window.location.href = '../../admin/html/orders.html';
                break;
            case 'customer':
            default:
                window.location.href = 'products.html';
        }
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
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up form submissions
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
});

// Show/hide tabs
function showTab(tabName) {
    // Hide all tabs
    document.getElementById('products-tab').classList.add('hidden');
    document.getElementById('recipes-tab').classList.add('hidden');
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Update tab buttons
    const buttons = document.querySelectorAll('[onclick^="showTab"]');
    buttons.forEach(button => {
        button.classList.remove('text-orange-500', 'font-semibold', 'border-b-2', 'border-orange-500');
        button.classList.add('text-gray-500', 'hover:text-orange-500');
    });
    
    // Highlight selected button
    const selectedButton = Array.from(buttons).find(button => button.textContent.toLowerCase().includes(tabName));
    if (selectedButton) {
        selectedButton.classList.remove('text-gray-500', 'hover:text-orange-500');
        selectedButton.classList.add('text-orange-500', 'font-semibold', 'border-b-2', 'border-orange-500');
    }
}

// Load dashboard data (stats, products, orders)
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Load products
        await loadProducts(token);
        
        // Load orders
        await loadOrders(token);
        
        // Update stats (in a real app, this would come from the server)
        updateStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load products for this seller
async function loadProducts(token) {
    try {
        const response = await fetch(`/api/products/seller/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        const productsContainer = document.getElementById('products-list');
        
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-span-full text-center text-gray-500">
                    <p>You haven't added any products yet.</p>
                    <p class="mt-2">Use the form above to add your first product.</p>
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
                <div class="mt-4 flex justify-end space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="editProduct(${product.product_id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteProduct(${product.product_id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading products. Please try again later.</p>
            </div>
        `;
    }
}

// Load orders for this seller
async function loadOrders(token) {
    try {
        const response = await fetch('/api/orders/seller', {
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
                        No orders yet. When customers purchase your products, they will appear here.
                    </td>
                </tr>
            `;
            return;
        }
        
        // Display orders
        ordersTableBody.innerHTML = orders.map(order => `
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

// Update dashboard stats
async function updateStats() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Fetch products count
        const productsResponse = await fetch(`/api/products/seller/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('total-products').textContent = products.length;
        }
        
        // Fetch orders count
        const ordersResponse = await fetch('/api/orders/seller', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            const pendingOrders = orders.filter(order => order.status === 'pending').length;
            document.getElementById('pending-orders').textContent = pendingOrders;
            
            // Calculate total sales
            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
            document.getElementById('total-sales').textContent = `₵${totalSales.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Handle adding a new product
async function handleAddProduct(e) {
    e.preventDefault();
    
    // Get form data
    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productUnit = document.getElementById('product-unit').value;
    const productQuantity = document.getElementById('product-quantity').value;
    const productDescription = document.getElementById('product-description').value;
    const productImage = document.getElementById('product-image').files[0];
    
    // Validate form data
    if (!productName || !productPrice || !productUnit || !productQuantity || !productImage) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', productDescription);
    formData.append('price_per_unit', productPrice);
    formData.append('unit', productUnit);
    formData.append('available_quantity', productQuantity);
    formData.append('image', productImage);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Product added successfully!');
            // Reset form
            document.getElementById('add-product-form').reset();
            // Reload products
            loadDashboardData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('An error occurred while adding the product.');
    }
}

// Edit product function
async function editProduct(productId) {
    // In a complete implementation, this would open an edit modal or form
    alert(`Edit product with ID: ${productId}. This functionality would be implemented in a complete system.`);
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
            // Reload products
            loadDashboardData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product.');
    }
}

// Handle adding a new recipe
async function handleAddRecipe(e) {
    e.preventDefault();
    
    // Get form data
    const recipeName = document.getElementById('recipe-name').value;
    const recipeIngredients = document.getElementById('recipe-ingredients').value;
    const recipeInstructions = document.getElementById('recipe-instructions').value;
    const recipeImage = document.getElementById('recipe-image').files[0];
    
    // Validate form data
    if (!recipeName || !recipeIngredients || !recipeInstructions || !recipeImage) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('recipe_name', recipeName);
    formData.append('ingredients', recipeIngredients);
    formData.append('instructions', recipeInstructions);
    formData.append('image', recipeImage);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Recipe added successfully!');
            // Reset form
            document.getElementById('add-recipe-form').reset();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error adding recipe:', error);
        alert('An error occurred while adding the recipe.');
    }
}