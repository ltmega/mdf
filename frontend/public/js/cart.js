// ================================
// Cart functionality for users
// ================================

// Initialize cart from localStorage or create empty cart (user-specific)
function getUserCart() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return [];
  
  const cartKey = `cart_${user.user_id}`;
  return JSON.parse(localStorage.getItem(cartKey)) || [];
}

function saveUserCart(cart) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;
  
  const cartKey = `cart_${user.user_id}`;
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

let cart = getUserCart();

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

  saveUserCart(cart);
  updateCartDisplay();
  showMessage("Item added to cart successfully!", "success");
}

// ---------------------
// Remove item
// ---------------------
function removeFromCart(productId) {
  cart = cart.filter(item => item.product_id !== productId);
  saveUserCart(cart);
  updateCartDisplay();
  showMessage("Item removed from cart!", "success");
}

// ---------------------
// Update quantity
// ---------------------
function updateCartQuantity(productId, newQuantity) {
  let cart = getUserCart();
  const item = cart.find(item => item.product_id === productId);

  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = newQuantity;
      saveUserCart(cart);
      updateCartDisplay();
      displayCart();
    }
  }
}

// ---------------------
// Cart totals
// ---------------------
function getCartTotal() {
  const currentCart = getUserCart();
  return currentCart.reduce((total, item) => {
    const price = parseFloat(item.price_per_unit) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + price * quantity;
  }, 0);
}

function getCartItemCount() {
  const currentCart = getUserCart();
  return currentCart.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
}

// ---------------------
// Clear cart
// ---------------------
function clearCart() {
  cart = [];
  saveUserCart(cart);
  updateCartDisplay();
}

// ---------------------
// Add recipe ingredients to cart
// ---------------------
async function addRecipeIngredientsToCart(recipeId, recipeName, recipeImageUrl) {
  try {
    const API_BASE = "http://localhost:5000";
    
    // Fetch the recipe details to get ingredients
    const recipeRes = await fetch(`${API_BASE}/api/recipes/${recipeId}/ingredients`);
    let recipeIngredients = [];
    
    if (recipeRes.ok) {
      const data = await recipeRes.json();
      // Parse ingredients from the recipe (assuming comma-separated)
      recipeIngredients = data.ingredients.split(',').map(ing => ing.trim().toLowerCase());
    }
    
    // Fetch all available ingredients from the database
    const res = await fetch(`${API_BASE}/api/ingredients`);
    if (!res.ok) throw new Error('Failed to fetch ingredients');
    
    const allIngredients = await res.json();
    
    // Auto-select ingredients that match the recipe
    const matchedIngredients = allIngredients.filter(ingredient => {
      const ingredientName = ingredient.ingredient_name.toLowerCase();
      return recipeIngredients.some(recipeIng =>
        ingredientName.includes(recipeIng) || recipeIng.includes(ingredientName)
      );
    });
    
    // Show ingredient selection modal with pre-selected ingredients
    await showIngredientSelectionModal(allIngredients, recipeId, recipeName, recipeImageUrl, matchedIngredients);
  } catch (err) {
    console.error('Error adding recipe ingredients to cart:', err);
    showMessage("Could not load ingredients.", "error");
  }
}

// Function to show ingredient selection modal
async function showIngredientSelectionModal(ingredients, recipeId, recipeName, recipeImageUrl, preSelectedIngredients = []) {
  try {
    // Create a modal to select ingredients
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-utensils text-2xl text-orange-600"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Select Ingredients</h2>
          <p class="text-lg text-gray-600">for <span class="font-semibold text-orange-600">${recipeName}</span></p>
          <p class="text-sm text-gray-500 mt-2">Choose the ingredients you want to order and set your preferred quantities and prices</p>
        </div>
        
        <form id="ingredient-selection-form">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            ${ingredients.map(ingredient => {
              const isPreSelected = preSelectedIngredients.some(pre => pre.ingredient_id === ingredient.ingredient_id);
              return `
              <div class="bg-gradient-to-br from-white to-gray-50 border-2 ${isPreSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} rounded-xl p-5 hover:border-orange-300 hover:shadow-lg transition-all duration-300 ingredient-card">
                <div class="flex items-start mb-4">
                  <input type="checkbox" id="ingredient-${ingredient.ingredient_id}"
                         name="selected_ingredients" value="${ingredient.ingredient_id}"
                         ${isPreSelected ? 'checked' : ''}
                         class="mt-1 mr-3 w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2">
                  <div class="flex-1">
                    <label for="ingredient-${ingredient.ingredient_id}" class="font-semibold ${isPreSelected ? 'text-orange-700' : 'text-gray-800'} text-lg cursor-pointer hover:text-orange-600 transition-colors">
                      ${ingredient.ingredient_name}
                      ${isPreSelected ? '<span class="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">Recommended</span>' : ''}
                    </label>
                    <p class="text-sm ${isPreSelected ? 'text-orange-600' : 'text-gray-600'} mt-1 leading-relaxed">${ingredient.description || 'Fresh ingredient for your recipe'}</p>
                  </div>
                </div>
                
                <div class="space-y-3">
                  <div class="bg-white rounded-lg p-3 border border-gray-200">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Quantity (${ingredient.unit}):</label>
                    <input type="number" name="quantity-${ingredient.ingredient_id}"
                           value="1" min="0.1" step="0.1"
                           class="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors">
                  </div>
                  
                  <div class="bg-white rounded-lg p-3 border border-gray-200">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Unit Price (UGX):</label>
                    <input type="number" name="price-${ingredient.ingredient_id}"
                           step="0.01" min="0" placeholder="Enter price per ${ingredient.unit}"
                           class="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors">
                  </div>
                  
                  <div class="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <label class="block text-xs font-medium text-orange-700 mb-1">
                      <i class="fas fa-calculator mr-1"></i>Total Amount (UGX):
                    </label>
                    <input type="number" name="total-${ingredient.ingredient_id}"
                           step="0.01" min="0" placeholder="Or set total amount"
                           class="w-full p-2 border border-orange-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
                           onchange="calculateUnitPrice(${ingredient.ingredient_id})">
                    <p class="text-xs text-orange-600 mt-1">
                      <i class="fas fa-info-circle mr-1"></i>This will auto-calculate unit price
                    </p>
                  </div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
          
          <div class="bg-gray-50 rounded-xl p-6 mb-6">
            <div class="flex items-center justify-center text-gray-600 mb-2">
              <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
              <span class="font-medium">Pro Tip:</span>
            </div>
            <p class="text-sm text-gray-600 text-center">
              You can either set a unit price per ${ingredients[0]?.unit || 'unit'} or enter a total amount you want to spend on each ingredient.
              The system will calculate the other value automatically!
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <button type="button" id="cancel-ingredient-selection"
                    class="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <i class="fas fa-times mr-2"></i>Cancel
            </button>
            <button type="submit"
                    class="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <i class="fas fa-cart-plus mr-2"></i>Add Selected to Cart
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#ingredient-selection-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let cart = getUserCart();
      const formData = new FormData(form);
      const selectedIngredients = formData.getAll('selected_ingredients');
      
      if (selectedIngredients.length === 0) {
        showMessage("Please select at least one ingredient.", "error");
        return;
      }
      
      selectedIngredients.forEach(ingredientId => {
        const ingredient = ingredients.find(i => i.ingredient_id == ingredientId);
        if (ingredient) {
          const quantity = parseFloat(formData.get(`quantity-${ingredientId}`)) || 1;
          const unitPrice = parseFloat(formData.get(`price-${ingredientId}`)) || 0;
          const totalAmount = parseFloat(formData.get(`total-${ingredientId}`));
          
          // Calculate final unit price
          let finalUnitPrice = unitPrice;
          if (totalAmount && totalAmount > 0) {
            finalUnitPrice = totalAmount / quantity;
          }
          
          cart.push({
            product_id: `${ingredientId}`,
            product_name: ingredient.ingredient_name,
            description: ingredient.description || `Ingredient for ${recipeName}`,
            price_per_unit: finalUnitPrice,
            unit: ingredient.unit,
            quantity: quantity,
            product_image_url: recipeImageUrl,
            is_recipe_item: true,
            is_ingredient: true,
            recipe_id: recipeId,
            recipe_name: recipeName,
            ingredient_id: ingredientId
          });
        }
      });
      
      saveUserCart(cart);
      updateCartDisplay();
      showMessage(`${selectedIngredients.length} ingredient(s) added to cart!`, "success");
      
      // Remove modal
      document.body.removeChild(modal);
    });
    
    // Handle cancel
    const cancelBtn = modal.querySelector('#cancel-ingredient-selection');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
  } catch (err) {
    console.error('Error showing ingredient selection modal:', err);
    showMessage("Could not show ingredient selection.", "error");
  }
}

// Calculate unit price based on total amount
function calculateUnitPrice(ingredientId) {
  const quantityInput = document.querySelector(`input[name="quantity-${ingredientId}"]`);
  const totalInput = document.querySelector(`input[name="total-${ingredientId}"]`);
  const priceInput = document.querySelector(`input[name="price-${ingredientId}"]`);
  
  const quantity = parseFloat(quantityInput.value) || 1;
  const total = parseFloat(totalInput.value);
  
  if (total && total > 0) {
    const unitPrice = total / quantity;
    priceInput.value = unitPrice.toFixed(2);
  }
}

// ---------------------
// Update cart display in UI
// ---------------------
function updateCartDisplay() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    cart = getUserCart();
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
    window.location.href = "/frontend/public/html/login.html";
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
    window.location.href = "/frontend/public/html/login.html";
    return;
  }

  displayCart();
  setupCheckoutForm();
});

function displayCart() {
  const cart = getUserCart();
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
  let cart = getUserCart();
  
  const item = cart.find(item => item.product_id === productId);
  if (item) {
    if (typeof change === 'number') {
      if (change === -1 || change === 1) {
        // Increment/decrement by 1
        item.quantity = Math.max(1, item.quantity + change);
      } else {
        // Set specific quantity
        item.quantity = Math.max(1, change);
      }
    }
    saveUserCart(cart);
    displayCart();
    updateCartDisplay();
    updateCartCount();
  }
}

function removeFromCart(productId) {
  let cart = getUserCart();
  
  const updatedCart = cart.filter(item => item.product_id !== productId);
  saveUserCart(updatedCart);
  displayCart();
  updateCartDisplay();
  updateCartCount();
  showMessage("Item removed from cart!", "success");
}

function updateCartCount() {
  const cart = getUserCart();
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
  
  const cart = getUserCart();
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
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const cartKey = `cart_${user.user_id}`;
      localStorage.removeItem(cartKey);
    }
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
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const cartKey = `cart_${user.user_id}`;
      localStorage.removeItem(cartKey);
    }
    displayCart();
    updateCartCount();
  }
}

// Update price for an item
function updatePrice(productId, newPrice) {
  let cart = getUserCart();
  const item = cart.find(item => item.product_id === productId);
  
  if (item) {
    item.price_per_unit = parseFloat(newPrice) || 0;
    saveUserCart(cart);
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
window.showIngredientSelectionModal = showIngredientSelectionModal;
window.calculateUnitPrice = calculateUnitPrice;
