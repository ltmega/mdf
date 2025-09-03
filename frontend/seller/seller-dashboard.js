// seller-dashboard.js - Handles seller dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and seller role
    if (!requireAuth()) return;
    if (!requireRole('seller')) return;
    
    // Load seller data
    loadSellerData();
    
    // Set up form submissions
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
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

// Load seller's products and recipes
async function loadSellerData() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Load dashboard stats
        loadDashboardStats(token, user.user_id);
        
        // Load seller's products
        const productsResponse = await fetch(`http://localhost:5000/api/products/seller/${user.user_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            displayProducts(products);
        }
        
        // Load seller's recipes
        const recipesResponse = await fetch('http://localhost:5000/api/recipes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (recipesResponse.ok) {
            const recipes = await recipesResponse.json();
            // Filter recipes by current seller
            const sellerRecipes = recipes.filter(recipe => recipe.user_id === user.user_id);
            displayRecipes(sellerRecipes);
        }
        
        // Load seller's orders
        const ordersResponse = await fetch('http://localhost:5000/api/orders/seller', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            displayOrders(orders);
        }
        
    } catch (error) {
        console.error('Error loading seller data:', error);
    }
}

// Load dashboard stats
async function loadDashboardStats(token, userId) {
    try {
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
        
        // Load pending orders
        const ordersResponse = await fetch('http://localhost:5000/api/orders/seller', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            const pendingOrders = orders.filter(order => order.status === 'pending').length;
            document.getElementById('pending-orders').textContent = pendingOrders;
            
            // Calculate total sales
            const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            document.getElementById('total-sales').textContent = `UGX ${totalSales.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Display products
function displayProducts(products) {
    const productsContainer = document.getElementById('products-list');
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full">No products yet. Add your first product!</p>';
        return;
    }
    
    productsContainer.innerHTML = products.map(product => {
        const imageUrl = product.product_image_url || "/uploads/icon.png";
        const fullImageUrl = imageUrl.startsWith("/uploads/") ? `http://localhost:5000${imageUrl}` : `http://localhost:5000/uploads/${imageUrl}`;
        
        return `
            <div class="bg-white p-4 rounded-lg shadow">
                <img src="${fullImageUrl}" alt="${product.product_name}" class="w-full h-32 object-cover rounded-md mb-3">
                <h3 class="font-semibold text-gray-800">${product.product_name}</h3>
                <p class="text-sm text-gray-600">${product.description || 'No description'}</p>
                <p class="text-orange-600 font-bold">UGX ${product.price_per_unit}/${product.unit}</p>
                <p class="text-sm text-gray-500">Stock: ${product.available_quantity}</p>
                <div class="mt-3 flex gap-2">
                    <button onclick="editProduct(${product.product_id})" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    <button onclick="deleteProduct(${product.product_id})" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Display recipes
function displayRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes-tab');
    
    if (!recipesContainer) {
        console.error('Recipes container not found');
        return;
    }
    
    if (recipes.length === 0) {
        // Find the grid container within recipes-tab or create a placeholder
        const existingGrid = recipesContainer.querySelector('.grid');
        if (existingGrid) {
            existingGrid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No recipes yet. Add your first recipe!</p>';
        } else {
            // Add a grid container if it doesn't exist
            recipesContainer.innerHTML += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"><p class="text-gray-500 text-center col-span-full">No recipes yet. Add your first recipe!</p></div>';
        }
        return;
    }
    
    // Create or update the grid container
    let gridContainer = recipesContainer.querySelector('.grid');
    if (!gridContainer) {
        // Create grid container after the form
        const form = recipesContainer.querySelector('form');
        if (form) {
            gridContainer = document.createElement('div');
            gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6';
            recipesContainer.appendChild(gridContainer);
        } else {
            console.error('Could not find form in recipes-tab');
            return;
        }
    }
    
    gridContainer.innerHTML = recipes.map(recipe => {
        const imageUrl = recipe.recipe_image_url || "/uploads/icon.png";
        const fullImageUrl = imageUrl.startsWith("/uploads/") ? `http://localhost:5000${imageUrl}` : `http://localhost:5000/uploads/${imageUrl}`;
        
        return `
            <div class="bg-white p-4 rounded-lg shadow">
                <img src="${fullImageUrl}" alt="${recipe.recipe_name}" class="w-full h-32 object-cover rounded-md mb-3">
                <h3 class="font-semibold text-gray-800">${recipe.recipe_name}</h3>
                <p class="text-sm text-gray-600">${recipe.ingredients || 'No ingredients'}</p>
                <div class="mt-3 flex gap-2">
                    <button onclick="editRecipe(${recipe.recipe_id})" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    <button onclick="deleteRecipe(${recipe.recipe_id})" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Display orders
function displayOrders(orders) {
    const ordersContainer = document.getElementById('orders-table-body');
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No orders yet.</td></tr>';
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.order_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.buyer_name || 'Unknown'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.order_date).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">UGX ${order.total_amount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}">${order.status}</span>
            </td>
        </tr>
    `).join('');
}

// Handle adding a new product
async function handleAddProduct(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        formData.append('product_name', document.getElementById('product-name').value);
        formData.append('price_per_unit', document.getElementById('product-price').value);
        formData.append('unit', document.getElementById('product-unit').value);
        formData.append('available_quantity', document.getElementById('product-quantity').value);
        formData.append('description', document.getElementById('product-description').value);
        
        const productImage = document.getElementById('product-image').files[0];
        if (productImage) {
            formData.append('image', productImage);
        }
        
        const response = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add product');
        }
        
        alert('Product added successfully!');
        document.getElementById('add-product-form').reset();
        loadSellerData(); // Reload data
    } catch (error) {
        console.error('Error adding product:', error);
        alert(error.message || 'Error adding product');
    }
}

// Handle adding a new recipe
async function handleAddRecipe(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        formData.append('recipe_name', document.getElementById('recipe-name').value);
        formData.append('ingredients', document.getElementById('recipe-ingredients').value);
        formData.append('instructions', document.getElementById('recipe-instructions').value);
        
        const recipeImage = document.getElementById('recipe-image').files[0];
        if (recipeImage) {
            formData.append('image', recipeImage);
        }
        
        const response = await fetch('http://localhost:5000/api/recipes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add recipe');
        }
        
        alert('Recipe added successfully!');
        document.getElementById('add-recipe-form').reset();
        loadSellerData(); // Reload data
    } catch (error) {
        console.error('Error adding recipe:', error);
        alert(error.message || 'Error adding recipe');
    }
}

// Show tab function for switching between products and recipes forms
function showTab(tabName) {
    // Hide all tabs
    document.getElementById('products-tab').classList.add('hidden');
    document.getElementById('recipes-tab').classList.add('hidden');
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // Update tab buttons
    const buttons = document.querySelectorAll('.flex.border-b button');
    buttons[0].className = tabName === 'products' ? 
        'py-2 px-4 text-orange-500 font-semibold border-b-2 border-orange-500' : 
        'py-2 px-4 text-gray-500 hover:text-orange-500';
    buttons[1].className = tabName === 'recipes' ? 
        'py-2 px-4 text-orange-500 font-semibold border-b-2 border-orange-500' : 
        'py-2 px-4 text-gray-500 hover:text-orange-500';
}

// Helper functions
function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function editProduct(productId) {
    alert(`Editing product #${productId}. This would open an edit form.`);
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        // Implement delete functionality
        alert('Delete functionality would be implemented here');
    }
}

function editRecipe(recipeId) {
    alert(`Editing recipe #${recipeId}. This would open an edit form.`);
}

function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        // Implement delete functionality
        alert('Delete functionality would be implemented here');
    }
}