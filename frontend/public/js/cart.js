// Cart functionality for users

// Initialize cart from localStorage or create empty cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Add item to cart
function addToCart(product) {
  // Check if item already exists in cart
  const existingItem = cart.find(item => item.product_id === product.product_id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  // Save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart display
  updateCartDisplay();
  
  // Show success message
  showMessage('Item added to cart successfully!', 'success');
}

// Remove item from cart
function removeFromCart(productId) {
  cart = cart.filter(item => item.product_id !== productId);
  
  // Save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart display
  updateCartDisplay();
  
  // Show success message
  showMessage('Item removed from cart!', 'success');
}

// Update item quantity in cart
function updateQuantity(productId, newQuantity) {
  const item = cart.find(item => item.product_id === productId);
  
  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = newQuantity;
      
      // Save cart to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Update cart display
      updateCartDisplay();
    }
  }
}

// Get cart total
function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
}

// Get cart item count
function getCartItemCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// Clear cart
function clearCart() {
  cart = [];
  
  // Save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart display
  updateCartDisplay();
}

// Update cart display in UI
function updateCartDisplay() {
  // Update cart count in header
  const cartCount = getCartItemCount();
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }
  
  // Update cart dropdown or page if visible
  const cartItemsElement = document.getElementById('cart-items');
  if (cartItemsElement) {
    if (cart.length === 0) {
      cartItemsElement.innerHTML = '<p class="text-gray-500 text-center">Your cart is empty</p>';
    } else {
      cartItemsElement.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between py-2 border-b">
          <div>
            <h4 class="font-medium">${item.product_name}</h4>
            <p class="text-gray-600">₵${item.price_per_unit} x ${item.quantity}</p>
          </div>
          <div class="flex items-center">
            <button class="text-gray-500 hover:text-gray-700" onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})">
              <i class="fas fa-minus"></i>
            </button>
            <span class="mx-2">${item.quantity}</span>
            <button class="text-gray-500 hover:text-gray-700" onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})">
              <i class="fas fa-plus"></i>
            </button>
            <button class="ml-4 text-red-500 hover:text-red-700" onclick="removeFromCart(${item.product_id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
      
      // Update cart total
      const cartTotalElement = document.getElementById('cart-total');
      if (cartTotalElement) {
        cartTotalElement.textContent = `₵${getCartTotal().toFixed(2)}`;
      }
    }
  }
}

// Show message to user
function showMessage(message, type = 'info') {
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  }`;
  messageElement.textContent = message;
  
  // Add to document
  document.body.appendChild(messageElement);
  
  // Remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 3000);
}

// Checkout function
async function checkout() {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    // Redirect to login page
    window.location.href = 'login.html';
    return;
  }
  
  // Check if cart is empty
  if (cart.length === 0) {
    showMessage('Your cart is empty!', 'error');
    return;
  }
  
  // Get delivery address
  const deliveryAddress = prompt('Please enter your delivery address:');
  
  if (!deliveryAddress) {
    showMessage('Delivery address is required!', 'error');
    return;
  }
  
  // Prepare order data
  const orderData = {
    items: cart.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price_per_unit
    })),
    totalAmount: getCartTotal(),
    deliveryAddress: deliveryAddress
  };
  
  try {
    // Send order to backend
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Clear cart
      clearCart();
      
      // Show success message
      showMessage('Order placed successfully!', 'success');
      
      // Redirect to orders page or show order confirmation
      window.location.href = 'orders.html';
    } else {
      showMessage('Error: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    showMessage('An error occurred while placing your order.', 'error');
  }
}

// Initialize cart display on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartDisplay();
});

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;