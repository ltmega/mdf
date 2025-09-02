document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");

  // Show loading
  productList.innerHTML = '<p class="text-gray-600 text-center">Loading products...</p>';

  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    console.log("Fetching products from the backend...");

    const res = await fetch(`${API_BASE}/api/products`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error("Failed to load products.");
    }

    const products = await res.json();
    console.log("Products fetched successfully:", products);

    if (!products || products.length === 0) {
      productList.innerHTML = "<p class='text-gray-600 text-center'>No products available.</p>";
      return;
    }

    // Save products in memory for cart use
    window.productsCache = products;

    // Render products safely
    productList.innerHTML = "";
    products.forEach((product) => {
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded-lg shadow";

      // Handle image URL properly
      const imageUrl = product.product_image_url || "/uploads/icon.png";
      const fullImageUrl = imageUrl.startsWith("/uploads/") ? `${API_BASE}${imageUrl}` : `${API_BASE}/uploads/${imageUrl}`;

      div.innerHTML = `
        <img src="${fullImageUrl}" 
             alt="${product.product_name}" 
             class="w-full h-48 object-cover rounded-md mb-4"
             onerror="this.src='${API_BASE}/uploads/icon.png'" />
        <h2 class="text-lg font-bold text-gray-800">${product.product_name}</h2>
        <p class="text-sm text-gray-600">${product.description || "No description available."}</p>
        <p class="text-orange-600 font-bold mt-2">UGX ${product.price_per_unit}</p>
        <p class="text-sm text-gray-600">Unit: ${product.unit}</p>
        <p class="text-sm text-gray-600">Available: ${product.available_quantity}</p>
        <div class="flex items-center gap-2 mt-4">
          <button 
            class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
            onclick="updateProductQuantity(${product.product_id}, -1)">
            -
          </button>
          <span id="quantity-${product.product_id}" class="w-12 text-center font-medium">1</span>
          <button 
            class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
            onclick="updateProductQuantity(${product.product_id}, 1)">
            +
          </button>
        </div>
        <button 
          class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md mt-4 w-full"
          onclick="addToCartById(${product.product_id})">
          Add to Cart
        </button>
      `;

      productList.appendChild(div);
    });

    // Initialize cart count
    updateCartCount();
  } catch (err) {
    console.error("Error loading products:", err);
    productList.innerHTML = `<p class='text-red-600 text-center'>${err.message}</p>`;
  }
});

// Update product quantity display
function updateProductQuantity(productId, change) {
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (quantityElement) {
    let currentQty = parseInt(quantityElement.textContent) || 1;
    currentQty = Math.max(1, currentQty + change);
    quantityElement.textContent = currentQty;
  }
}

// Get current quantity for a product
function getProductQuantity(productId) {
  const quantityElement = document.getElementById(`quantity-${productId}`);
  return quantityElement ? parseInt(quantityElement.textContent) || 1 : 1;
}

// ✅ Add product by ID safely
function addToCartById(productId) {
  const product = window.productsCache.find((p) => p.product_id == productId);
  if (product) {
    const quantity = getProductQuantity(productId);
    addToCart(product, quantity);
  } else {
    alert("Product not found.");
  }
}

// ✅ Add product to cart
function addToCart(product, quantity = 1) {
  try {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if product exists
    const existing = cart.find((item) => item.product_id === product.product_id);
    if (existing) {
      existing.quantity += quantity;
      alert(`Updated quantity for ${product.product_name} in cart!`);
    } else {
      cart.push({
        ...product,
        quantity: quantity
      });
      alert(`${product.product_name} added to cart!`);
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  } catch (err) {
    console.error("Error adding to cart:", err);
  }
}

// ✅ Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = cart.length;
}
