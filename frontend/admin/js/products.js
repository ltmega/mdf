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
        // In a real implementation, this would filter the products
        console.log('Search term:', e.target.value);
    });
});

// Load products data
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        
        // In a real implementation, this would fetch products from the server
        // For now, we'll show a placeholder
        const productsContainer = document.getElementById('products-list');
        productsContainer.innerHTML = `
            <div class="col-span-full text-center text-gray-500">
                <p>No products found. When sellers add products, they will appear here.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading products. Please try again later.</p>
            </div>
        `;
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
    
    // In a real implementation, this would send the data to the server
    alert(`Product "${productName}" would be added in a real implementation. In a complete system, this would connect to the backend API to save the product.`);
    
    // Reset form
    document.getElementById('add-product-form').reset();
}