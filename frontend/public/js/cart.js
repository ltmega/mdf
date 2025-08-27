// ================================
// Cart functionality for users
// ================================

// Initialize cart from localStorage or create empty cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ---------------------
// Add item to cart
// ---------------------
function addToCart(product) {
  const existingItem = cart.find(item => item.product_id === product.product_id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      price_per_unit: parseFloat(product.price_per_unit) || 0,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
  showMessage("Item added to cart successfully!", "success");
}

// ---------------------
// Remove item
// ---------------------
function removeFromCart(productId) {
  cart = cart.filter(item => item.product_id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
  showMessage("Item removed from cart!", "success");
}

// ---------------------
// Update quantity
// ---------------------
function updateQuantity(productId, newQuantity) {
  const item = cart.find(item => item.product_id === productId);

  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartDisplay();
    }
  }
}

// ---------------------
// Cart totals
// ---------------------
function getCartTotal() {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  return currentCart.reduce((total, item) => {
    const price = parseFloat(item.price_per_unit) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + price * quantity;
  }, 0);
}

function getCartItemCount() {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  return currentCart.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
}

// ---------------------
// Clear cart
// ---------------------
function clearCart() {
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
}

// ---------------------
// Update cart display in UI
// ---------------------
function updateCartDisplay() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    console.log("🛒 Cart contents for display:", cart);

    // Hide/show cart count based on login
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
      if (!user) {
        cartCountElement.textContent = "0";
      } else {
        cartCountElement.textContent = getCartItemCount();
      }
    }

    // If cart page is open, update items
    const cartItemsElement = document.getElementById("cart-items");
    if (cartItemsElement) {
      if (!user) {
        cartItemsElement.innerHTML = `<p class="text-gray-500 text-center">Please log in to use the cart.</p>`;
        return;
      }

      if (cart.length === 0) {
        cartItemsElement.innerHTML = `<p class="text-gray-500 text-center">Your cart is empty</p>`;
      } else {
        cartItemsElement.innerHTML = cart
          .map(item => {
            const price = parseFloat(item.price_per_unit) || 0;
            const quantity = parseInt(item.quantity) || 0;
            const subtotal = price * quantity;

            return `
              <div class="flex items-center justify-between py-4 border-b">
                <div class="flex-1">
                  <h4 class="font-medium text-lg">${item.product_name || "Unknown Product"}</h4>
                  <p class="text-gray-600">UGX ${price.toFixed(2)} x ${quantity}</p>
                  <p class="text-gray-800 font-semibold">Subtotal: UGX ${subtotal.toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="updateQuantity(${item.product_id}, ${quantity - 1})"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded">-</button>
                  <span class="mx-2 font-semibold">${quantity}</span>
                  <button onclick="updateQuantity(${item.product_id}, ${quantity + 1})"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded">+</button>
                  <button onclick="removeFromCart(${item.product_id})"
                    class="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Remove</button>
                </div>
              </div>
            `;
          })
          .join("");

        const cartTotal = getCartTotal();
        cartItemsElement.innerHTML += `
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span id="cart-total">UGX ${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("❌ Error updating cart display:", err);
  }
}

// ---------------------
// Show messages
// ---------------------
function showMessage(message, type = "info") {
  const messageElement = document.createElement("div");
  messageElement.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  messageElement.textContent = message;
  document.body.appendChild(messageElement);

  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 3000);
}

// ---------------------
// Checkout
// ---------------------
async function checkout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    console.warn("❌ Checkout blocked: user not logged in");
    window.location.href = "login.html";
    return;
  }

  if (cart.length === 0) {
    console.warn("⚠️ Cart is empty");
    showMessage("Your cart is empty!", "error");
    return;
  }

  const delivery_address = prompt("Please enter your delivery address:");
  if (!delivery_address) {
    console.warn("⚠️ Delivery address required");
    showMessage("Delivery address is required!", "error");
    return;
  }

  const orderData = {
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price_per_unit
    })),
    total_amount: getCartTotal(),
    delivery_address: delivery_address
  };

  console.log("📦 Sending order data:", orderData);

  try {
    const response = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    console.log("📩 Raw response:", response);

    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      result = { message: "Invalid response" };
    }

    console.log("📥 API response:", result);

    if (response.ok) {
      clearCart();
      showMessage("Order placed successfully!", "success");
      window.location.href = "orders.html";
    } else {
      showMessage("Error: " + (result.message || "Failed to place order"), "error");
    }
  } catch (error) {
    console.error("❌ Error placing order:", error);
    showMessage("An error occurred while placing your order.", "error");
  }
}

// ---------------------
// Initialize on page load
// ---------------------
document.addEventListener("DOMContentLoaded", () => {
  updateCartDisplay();
});

// Expose functions globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;
