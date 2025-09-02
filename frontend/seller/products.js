// products.js - Handles seller products page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and seller role
    if (!requireAuth()) return;
    if (!requireRole('seller')) return;
    
    // Load seller's products
    loadSellerProducts();
    
    // Set up form submission
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
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

// Load seller's products
async function loadSellerProducts() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`http://localhost:5000/api/products/seller/${user.user_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = '<p class="text-red-500 text-center">Error loading products. Please try again later.</p>';
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
        loadSellerProducts(); // Reload data
    } catch (error) {
        console.error('Error adding product:', error);
        alert(error.message || 'Error adding product');
    }
}

// Edit product function
function editProduct(productId) {
    alert(`Editing product #${productId}. This would open an edit form.`);
}

// Delete product function
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        // Implement delete functionality
        alert('Delete functionality would be implemented here');
    }
}