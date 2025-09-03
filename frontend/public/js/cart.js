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
// Add recipe ingredients to cart
// ---------------------
async function addRecipeIngredientsToCart(recipeId, recipeName, recipeImageUrl) {
  try {
    const API_BASE = "http://localhost:5000";
    
    // Fetch ingredients for the recipe
    const res = await fetch(`${API_BASE}/api/recipes/${recipeId}/ingredients`);
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    
    const data = await res.json();
    
    // Parse ingredients - assuming they're stored as a comma-separated string
    const ingredientsArray = data.ingredients.split(',').map((ingredient, index) => {
      const trimmedIngredient = ingredient.trim();
      return {
        product_id: `recipe-${recipeId}-ingredient-${index}`,
        product_name: trimmedIngredient,
        price_per_unit: 0, // Default price, can be updated by user
        unit: 'piece', // Default unit
        description: `Ingredient for ${recipeName}`,
        product_image_url: recipeImageUrl, // Use recipe image for the ingredient
        quantity: 1,
        is_recipe_item: true,
        recipe_id: recipeId,
        recipe_name: recipeName
      };
    });
    
    // Show a modal or prompt to select actual products for ingredients
    await selectProductsForIngredients(ingredientsArray, recipeId, recipeName);
  } catch (err) {
    console.error('Error adding recipe ingredients to cart:', err);
    showMessage("Could not add ingredients to cart.", "error");
  }
}

// Function to select actual products for recipe ingredients
async function selectProductsForIngredients(ingredientsArray, recipeId, recipeName) {
  try {
    const API_BASE = "http://localhost:5000";
    
    // Fetch all products
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    
    const productsData = await res.json();
    const products = productsData.products || productsData;
    
    // Create a modal to select products for ingredients
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Select Products for ${recipeName} Ingredients</h2>
        <p class="mb-4">Please select actual products for each ingredient:</p>
        <form id="ingredient-product-form">
          ${ingredientsArray.map((ingredient, index) => `
            <div class="mb-4 p-4 border rounded">
              <label class="block font-medium mb-2">${ingredient.product_name}</label>
              <select name="ingredient-${index}" class="w-full p-2 border rounded" required>
                <option value="">Select a product</option>
                ${products.map(product => `
                  <option value="${product.product_id}" data-price="${product.price_per_unit}">
                    ${product.product_name} - UGX ${product.price_per_unit}/${product.unit}
                  </option>
                `).join('')}
              </select>
              <div class="flex items-center mt-2">
                <label class="mr-2">Quantity:</label>
                <input type="number" name="quantity-${index}" value="1" min="1" class="w-20 p-2 border rounded">
              </div>
            </div>
          `).join('')}
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" id="cancel-ingredient-selection" class="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-orange-500 text-white rounded">Add to Cart</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#ingredient-product-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Process selected products
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const formData = new FormData(form);
      
      ingredientsArray.forEach((ingredient, index) => {
        const productId = formData.get(`ingredient-${index}`);
        const quantity = parseInt(formData.get(`quantity-${index}`)) || 1;
        
        if (productId) {
          // Find the selected product
          const selectedProduct = products.find(p => p.product_id == productId);
          if (selectedProduct) {
            cart.push({
              ...selectedProduct,
              quantity: quantity,
              is_recipe_item: true,
              recipe_id: recipeId,
              recipe_name: recipeName,
              original_ingredient: ingredient.product_name
            });
          }
        }
      });
      
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartDisplay();
      showMessage("Recipe ingredients added to cart successfully!", "success");
      
      // Remove modal
      document.body.removeChild(modal);
    });
    
    // Handle cancel
    const cancelBtn = modal.querySelector('#cancel-ingredient-selection');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
  } catch (err) {
    console.error('Error selecting products for ingredients:', err);
    showMessage("Could not load products for selection.", "error");
  }
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
            
            // Determine image URL
            let imageUrl = item.product_image_url || "/uploads/icon.png";
            if (!imageUrl.startsWith("http")) {
              imageUrl = `http://localhost:5000${imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl}`;
            }

            return `
              <div class="flex items-center justify-between py-4 border-b">
                <div class="flex items-center gap-4">
                  <img src="${imageUrl}"
                       alt="${item.product_name}"
                       class="w-16 h-16 object-cover rounded-md"
                       onerror="this.src='http://localhost:5000/uploads/icon.png'">
                  <div>
                    <h4 class="font-medium text-lg">${item.product_name || "Unknown Product"}</h4>
                    ${item.is_recipe_item ? `<p class="text-sm text-gray-600">From recipe: ${item.recipe_name}</p>` : ''}
                    ${item.is_recipe_item ?
                      `<div class="flex items-center gap-2 mt-2">
                        <input type="number"
                               id="price-${item.product_id}"
                               value="${price}"
                               min="0"
                               step="0.01"
                               class="w-20 px-2 py-1 border border-gray-300 rounded"
                               onchange="updatePrice('${item.product_id}', this.value)">
                        <span class="text-gray-600">UGX</span>
                      </div>` :
                      `<p class="text-gray-600">UGX ${price.toFixed(2)} x ${quantity}</p>`
                    }
                    <p class="text-gray-800 font-semibold">Subtotal: UGX ${subtotal.toFixed(2)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="updateQuantity('${item.product_id}', ${quantity - 1})"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded">-</button>
                  <span class="mx-2 font-semibold">${quantity}</span>
                  <button onclick="updateQuantity('${item.product_id}', ${quantity + 1})"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded">+</button>
                  <button onclick="removeFromCart('${item.product_id}')"
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
    window.location.href = "../public/html/login.html";
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
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    window.location.href = "../public/html/login.html";
    return;
  }

  displayCart();
  setupCheckoutForm();
});

function displayCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartContainer = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const emptyCartMessage = document.getElementById("empty-cart-message");

  // Stop here if cart container is not on the page
  if (!cartContainer) {
    console.warn("⚠️ No #cart-items container found on this page.");
    return;
  }

  // Reset cart display
  cartContainer.innerHTML = "";

  // If empty
  if (cart.length === 0) {
    if (emptyCartMessage) emptyCartMessage.classList.remove("hidden");
    if (totalElement) totalElement.textContent = "UGX 0.00";
    return;
  }

  if (emptyCartMessage) emptyCartMessage.classList.add("hidden");

  let total = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price_per_unit * item.quantity;
    total += itemTotal;

    // Determine image URL
    let imageUrl = item.product_image_url || "/uploads/icon.png";
    if (!imageUrl.startsWith("http")) {
      imageUrl = `http://localhost:5000${imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl}`;
    }

    cartContainer.innerHTML += `
      <div class="bg-white p-4 rounded-lg shadow-md mb-4">
        <div class="flex items-center gap-4">
          <img src="${imageUrl}" 
               alt="${item.product_name}" 
               class="w-20 h-20 object-cover rounded-md"
               onerror="this.src='http://localhost:5000/uploads/icon.png'" />
          
          <div class="flex-1">
            <h3 class="font-semibold text-gray-800">
              ${item.product_name || 'Unknown Item'}
            </h3>
            ${item.is_recipe_item ? `<p class="text-sm text-gray-600">From recipe: ${item.recipe_name}</p>` : ''}
            <p class="text-sm text-gray-600">${item.description || 'No description'}</p>
            <p class="text-orange-600 font-bold">
              UGX ${(parseFloat(item.price_per_unit) || 0).toFixed(2)}${item.unit ? '/' + item.unit : ''}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <button onclick="updateQuantity('${item.product_id}', -1)" class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">-</button>
            <span class="w-12 text-center font-medium">${item.quantity}</span>
            <button onclick="updateQuantity('${item.product_id}', 1)" class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">+</button>
          </div>
          
          <div class="text-right">
            <p class="font-bold text-gray-800">UGX ${itemTotal.toFixed(2)}</p>
            <button onclick="removeFromCart('${item.product_id}')" class="text-red-600 hover:text-red-800 text-sm">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  if (totalElement) totalElement.textContent = `UGX ${total.toFixed(2)}`;
}


function updateQuantity(productId, change) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  const item = cart.find(item => item.product_id === productId);
  if (item) {
    // If change is -1 or 1, we're using the old system
    // If change is a negative number, we're setting a specific quantity
    if (change === -1 || change === 1) {
      item.quantity = Math.max(1, item.quantity + change);
    } else {
      item.quantity = Math.max(1, item.quantity + change);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
  }
}

function removeFromCart(productId) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  
  const updatedCart = cart.filter(item => item.product_id !== productId);
  localStorage.setItem("cart", JSON.stringify(updatedCart));
  displayCart();
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = cart.length;
}

function setupCheckoutForm() {
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckout);
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const deliveryAddress = document.getElementById("delivery-address").value.trim();
  if (!deliveryAddress) {
    alert("Please enter a delivery address!");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const API_BASE = "http://localhost:5000";
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
    
    // Prepare order data
    const orderData = {
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price_per_unit
      })),
      total_amount: total,
      delivery_address: deliveryAddress
    };

    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to place order");
    }

    const result = await response.json();
    
    // Clear cart
    localStorage.removeItem("cart");
    updateCartCount();
    
    alert(`Order placed successfully! Order ID: ${result.orderId}`);
    
    // Redirect to orders page
    window.location.href = "orders.html";
    
  } catch (error) {
    console.error("Error placing order:", error);
    alert(error.message || "Failed to place order. Please try again.");
  }
}

function clearCart() {
  if (confirm("Are you sure you want to clear your cart?")) {
    localStorage.removeItem("cart");
    displayCart();
    updateCartCount();
  }
}

// Update price for an item
function updatePrice(productId, newPrice) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find(item => item.product_id === productId);
  
  if (item) {
    item.price_per_unit = parseFloat(newPrice) || 0;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
  }
}

// Expose functions globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.updatePrice = updatePrice;
window.checkout = checkout;
window.addRecipeIngredientsToCart = addRecipeIngredientsToCart;
window.selectProductsForIngredients = selectProductsForIngredients;
