// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    // Require authentication and admin role
    if (!requireAuth()) return;
    if (!requireRole('admin')) return;
    
    // Load products data
    loadProducts();
    
    // Set up form submission
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    
    // Set up search functionality
    document.getElementById('search-products').addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });
});

// Load products data
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading products. Please try again later.</p>
            </div>
        `;
    }
}

// Display products in the grid
function displayProducts(products) {
    const productsContainer = document.getElementById('products-list');
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-span-full text-center text-gray-500">
                <p>No products found.</p>
            </div>
        `;
        return;
    }
    
    productsContainer.innerHTML = products.map(product => `
        <div class="border rounded-lg p-4 shadow-sm">
            <img src="${product.product_image_url ? 'http://localhost:5000/uploads/' + product.product_image_url : '/uploads/icon.png'}" alt="${product.product_name}" class="w-full h-48 object-cover rounded-md mb-4">
            <h3 class="text-lg font-semibold mb-2">${product.product_name}</h3>
            <p class="text-gray-600 mb-2">${product.description || 'No description available'}</p>
            <div class="flex justify-between items-center">
                <span class="text-orange-500 font-bold">UGX ${product.price_per_unit}/${product.unit}</span>
                <span class="text-gray-500">Qty: ${product.available_quantity}</span>
            </div>
            <div class="mt-4 flex justify-between">
                <button class="text-indigo-600 hover:text-indigo-900" onclick="editProduct(${product.product_id})">Edit</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteProduct(${product.product_id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Filter products based on search term
function filterProducts(searchTerm) {
    const cards = document.querySelectorAll('#products-list > div');
    
    cards.forEach(card => {
        if (card.querySelector('p[colspan]') || card.querySelector('div[colspan]')) return; // Skip placeholder cards
        
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
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
    
    // Validate required fields
    if (!productName || !productPrice || !productUnit || !productQuantity) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        formData.append('name', productName);
        formData.append('price', productPrice);
        formData.append('unit', productUnit);
        formData.append('quantity', productQuantity);
        formData.append('description', productDescription);
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
        
        // Reset form
        document.getElementById('add-product-form').reset();
        
        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        alert(error.message || 'Error adding product. Please try again later.');
    }
}

// Edit product
function editProduct(productId) {
    alert(`Editing product #${productId}. In a complete implementation, this would open an edit form.`);
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete product');
        }
        
        alert('Product deleted successfully!');
        loadProducts(); // Reload products
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message || 'Error deleting product. Please try again later.');
    }
}